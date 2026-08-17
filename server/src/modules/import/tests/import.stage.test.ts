import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ImportService } from '../import.service.js';
import { prisma } from '../../../shared/utils/prisma.js';

describe('ImportService.stageImport', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'test-password',
      },
    });

    userId = user.id;

    const account = await prisma.account.create({
      data: {
        name: 'Test Bank Account',
        type: 'ASSETS',
        userId,
      },
    });

    accountId = account.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an import batch with valid rows', async () => {
    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: 'statement.csv',

      validRows: [
        {
          rowNumber: 1,
          date: new Date('2026-08-01'),
          description: 'Salary',
          amount: 500000,
        },
      ],

      errors: [],
    });

    expect(batch.status).toBe('VALIDATED');

    const rows = await prisma.importRow.findMany({
      where: {
        batchId: batch.id,
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].isValid).toBe(true);
    expect(rows[0].description).toBe('Salary');
    expect(rows[0].amount).toBe(500000);
  });

  it('should store invalid rows with isValid false and error message', async () => {
    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: 'statement.csv',

      validRows: [],

      errors: [
        {
          row: 2,
          message: 'amount: Invalid amount',
          raw: {
            date: 'invalid-date',
            description: 'Bad transaction',
            amount: 'abc',
          },
        },
      ],
    });

    const row = await prisma.importRow.findFirst({
      where: {
        batchId: batch.id,
      },
    });

    expect(row).not.toBeNull();
    expect(row?.isValid).toBe(false);
    expect(row?.errorMessage).toBe('amount: Invalid amount');
    expect(row?.rowNumber).toBe(2);
  });

  it('should rollback the transaction if staging fails', async () => {
    const filename = `rollback-${Date.now()}.csv`;

    await expect(
      ImportService.stageImport({
        userId,
        accountId,
        filename,

        validRows: [
          {
            rowNumber: 1,
            date: new Date('2026-08-01'),
            description: 'Salary',

            amount: 2147483648,
          },
        ],

        errors: [],
      }),
    ).rejects.toThrow();

    const batch = await prisma.importBatch.findFirst({
      where: {
        filename,
      },
    });

    expect(batch).toBeNull();
  });
});
