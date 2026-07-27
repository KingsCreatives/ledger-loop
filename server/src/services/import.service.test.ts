import { ImportService } from './import.service';
import { prisma } from '../utils/prisma';
import { LedgerService } from './ledger.service';
import { ImportStatus, LineType } from '../../generated/prisma/enums';
import mockRows from '../fixtures/mock-import-rows.json';

jest.mock('../utils/prisma', () => ({
  prisma: {
    importBatch: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('./ledger.service', () => ({
  LedgerService: {
    createEntry: jest.fn(),
  },
}));

describe('ImportService.commitImport', () => {
  const userId = 'user-1';
  const batchId = 'batch-1';
  const accountId = 'account-checking';
  const offsetAccountId = 'account-suspense';

  const mockBatch = {
    id: batchId,
    userId,
    accountId,
    filename: 'test.csv',
    status: 'VALIDATED',
    importRows: mockRows.map((row: any) => ({
      ...row,
      date: new Date(row.date),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.importBatch.findFirst as jest.Mock).mockResolvedValue(mockBatch);
    (prisma.importBatch.update as jest.Mock).mockResolvedValue({
      ...mockBatch,
      status: ImportStatus.COMMITTED,
    });
    (LedgerService.createEntry as jest.Mock).mockResolvedValue({
      id: 'entry-1',
    });
  });

  it('loads the batch scoped to the correct user', async () => {
    await ImportService.commitImport(batchId, offsetAccountId, userId);

    expect(prisma.importBatch.findFirst).toHaveBeenCalledWith({
      where: { id: batchId, userId },
      include: { importRows: { where: { isValid: true } } },
    });
  });

  it('builds a balanced DTO for a money-in row (debit account, credit offset)', async () => {
    await ImportService.commitImport(batchId, offsetAccountId, userId);

    expect(LedgerService.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Client deposit payment',
        lines: [
          { accountId, type: LineType.DEBIT, amount: 570213 },
          { accountId: offsetAccountId, type: LineType.CREDIT, amount: 570213 },
        ],
      }),
      userId,
    );
  });

  it('builds a balanced DTO for a money-out row (credit account, debit offset)', async () => {
    await ImportService.commitImport(batchId, offsetAccountId, userId);

    expect(LedgerService.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Office supplies purchase',
        lines: [
          { accountId: offsetAccountId, type: LineType.DEBIT, amount: 409332 },
          { accountId, type: LineType.CREDIT, amount: 409332 },
        ],
      }),
      userId,
    );
  });

  it('calls LedgerService.createEntry once per valid row', async () => {
    await ImportService.commitImport(batchId, offsetAccountId, userId);
    expect(LedgerService.createEntry).toHaveBeenCalledTimes(mockRows.length);
  });

  it('updates the batch status to COMMITTED and returns it in the response', async () => {
    const result = await ImportService.commitImport(
      batchId,
      offsetAccountId,
      userId,
    );

    expect(prisma.importBatch.update).toHaveBeenCalledWith({
      where: { id: batchId },
      data: { status: ImportStatus.COMMITTED },
    });
    expect(result.status).toBe(ImportStatus.COMMITTED);
    expect(result.imported).toBe(mockRows.length);
  });

  it('throws NotFoundError when the batch does not belong to the user', async () => {
    (prisma.importBatch.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      ImportService.commitImport(batchId, offsetAccountId, userId),
    ).rejects.toThrow("Batch doesn't exist");
  });
});
