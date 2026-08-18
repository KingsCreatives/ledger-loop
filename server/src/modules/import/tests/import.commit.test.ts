import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ImportService } from '../import.service.js';
import { prisma } from '../../../shared/utils/prisma.js';
import { AccountType, ImportStatus, LineType } from '../../../../generated/prisma/enums.js';

describe('ImportService.commitImport', () => {
  let userId: string;
  let accountId: string;
  let offsetAccountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `commit-test-${Date.now()}@example.com`,
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

    const offsetAccount = await prisma.account.create({
      data: {
        name: 'Sales Account',
        type: 'REVENUE',
        userId,
      },
    });

    offsetAccountId = offsetAccount.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should commit a validated import and create a journal entry', async () => {
    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: `statement-${Date.now()}.csv`,

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

    const result = await ImportService.commitImport(
      batch.id,
      offsetAccountId,
      userId,
    );

    expect(result).toEqual({
      batchId: batch.id,
      imported: 1,
      status: 'COMMITTED',
    });

    const committedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(committedBatch?.status).toBe('COMMITTED');

   const journalEntry = await prisma.journalEntry.findFirst({
     where: {
       description: 'Salary',
       lines: {
         some: {
           accountId,
         },
       },
     },
     include: {
       lines: true,
     },
   });

    expect(journalEntry).not.toBeNull();
    expect(journalEntry?.date).toEqual(new Date('2026-08-01'));

    expect(journalEntry?.lines).toHaveLength(2);

    const bankLine = journalEntry?.lines.find(
      (line: { accountId: string; }) => line.accountId === accountId,
    );

    const offsetLine = journalEntry?.lines.find(
      (line: { accountId: string; }) => line.accountId === offsetAccountId,
    );

    expect(bankLine?.type).toBe(LineType.DEBIT);
    expect(bankLine?.amount).toBe(500000);

    expect(offsetLine?.type).toBe(LineType.CREDIT);
    expect(offsetLine?.amount).toBe(500000);
  });

  it('should reject an import that is not validated', async () => {
    const batch = await prisma.importBatch.create({
      data: {
        filename: `pending-${Date.now()}.csv`,
        status: ImportStatus.UPLOADED,
        userId,
        accountId,
      },
    });

    const journalEntriesBefore = await prisma.journalEntry.count();

    await expect(
      ImportService.commitImport(batch.id, offsetAccountId, userId),
    ).rejects.toThrow();

    const updatedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(updatedBatch?.status).toBe(ImportStatus.UPLOADED);

    const journalEntriesAfter = await prisma.journalEntry.count();

    expect(journalEntriesAfter).toBe(journalEntriesBefore);
  });

  it('should commit multiple valid rows and create a journal entry for each row', async () => {
    const salaryDescription = `Multiple Test Salary ${Date.now()}`;
    const freelanceDescription = `Multiple Test Freelance ${Date.now()}`;

    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: `multiple-${Date.now()}.csv`,

      validRows: [
        {
          rowNumber: 1,
          date: new Date('2026-08-01'),
          description: salaryDescription,
          amount: 500000,
        },
        {
          rowNumber: 2,
          date: new Date('2026-08-02'),
          description: freelanceDescription,
          amount: 250000,
        },
      ],

      errors: [],
    });

    const result = await ImportService.commitImport(
      batch.id,
      offsetAccountId,
      userId,
    );

    expect(result).toEqual({
      batchId: batch.id,
      imported: 2,
      status: ImportStatus.COMMITTED,
    });

    const committedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(committedBatch?.status).toBe(ImportStatus.COMMITTED);

    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        description: {
          in: [salaryDescription, freelanceDescription],
        },
      },
      include: {
        lines: true,
      },
    });

    expect(journalEntries).toHaveLength(2);

    const salaryEntry = journalEntries.find(
      (entry: { description: string; }) => entry.description === salaryDescription,
    );

    const freelanceEntry = journalEntries.find(
      (entry: { description: string; }) => entry.description === freelanceDescription,
    );

    expect(salaryEntry?.lines).toHaveLength(2);
    expect(freelanceEntry?.lines).toHaveLength(2);

    const salaryBankLine = salaryEntry?.lines.find(
      (line: { accountId: string; }) => line.accountId === accountId,
    );

    const freelanceBankLine = freelanceEntry?.lines.find(
      (line: { accountId: string; }) => line.accountId === accountId,
    );

    expect(salaryBankLine?.amount).toBe(500000);
    expect(freelanceBankLine?.amount).toBe(250000);
  });

  it('should commit only valid rows and skip invalid rows', async () => {
    const timestamp = Date.now();

    const validDescription1 = `Valid Salary ${timestamp}`;
    const invalidDescription = `Invalid Row ${timestamp}`;
    const validDescription2 = `Valid Income ${timestamp}`;

    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: `invalid-rows-${timestamp}.csv`,

      validRows: [
        {
          rowNumber: 1,
          date: new Date('2026-08-01'),
          description: validDescription1,
          amount: 500000,
        },
        {
          rowNumber: 3,
          date: new Date('2026-08-03'),
          description: validDescription2,
          amount: 250000,
        },
      ],

      errors: [
        {
          row: 2,
          message: 'Invalid amount',
          raw: {
            date: '2026-08-02',
            description: invalidDescription,
            amount: 'not-a-number',
          },
        },
      ],
    });

    const result = await ImportService.commitImport(
      batch.id,
      offsetAccountId,
      userId,
    );

    expect(result).toEqual({
      batchId: batch.id,
      imported: 2,
      status: ImportStatus.COMMITTED,
    });

    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        description: {
          in: [validDescription1, invalidDescription, validDescription2],
        },
      },
      include: {
        lines: true,
      },
    });

    expect(journalEntries).toHaveLength(2);

    expect(
      journalEntries.some((entry: { description: string; }) => entry.description === invalidDescription),
    ).toBe(false);

    const firstEntry = journalEntries.find(
      (entry: { description: string; }) => entry.description === validDescription1,
    );

    const secondEntry = journalEntries.find(
      (entry: { description: string; }) => entry.description === validDescription2,
    );

    expect(firstEntry).toBeDefined();
    expect(secondEntry).toBeDefined();

    expect(firstEntry?.lines).toHaveLength(2);
    expect(secondEntry?.lines).toHaveLength(2);
  });

  it('should rollback the transaction if commit fails', async () => {
    const description = `Rollback Test ${Date.now()}`;

    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: `rollback-${Date.now()}.csv`,

      validRows: [
        {
          rowNumber: 1,
          date: new Date('2026-08-05'),
          description,
          amount: 300000,
        },
      ],

      errors: [],
    });

    const invalidOffsetAccountId = '00000000-0000-0000-0000-000000000000';

    await expect(
      ImportService.commitImport(batch.id, invalidOffsetAccountId, userId),
    ).rejects.toThrow();

    const updatedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(updatedBatch?.status).toBe(ImportStatus.VALIDATED);

    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        description,
      },
      include: {
        lines: true,
      },
    });

    expect(journalEntry).toBeNull();
  });

  it('should reject committing an import belonging to another user', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `other-user-${Date.now()}@example.com`,
        password: 'test-password',
      },
    });

    const otherAccount = await prisma.account.create({
      data: {
        name: 'Other User Bank Account',
        type: 'ASSETS',
        userId: otherUser.id,
      },
    });

    const batch = await ImportService.stageImport({
      userId: otherUser.id,
      accountId: otherAccount.id,
      filename: `other-user-${Date.now()}.csv`,

      validRows: [
        {
          rowNumber: 1,
          date: new Date('2026-08-06'),
          description: `Other User Transaction ${Date.now()}`,
          amount: 100000,
        },
      ],

      errors: [],
    });

    await expect(
      ImportService.commitImport(
        batch.id,
        offsetAccountId,
        userId, // different user
      ),
    ).rejects.toThrow();

    const unchangedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(unchangedBatch?.status).toBe(ImportStatus.VALIDATED);
  });

  it('should reject an import with no valid rows', async () => {
    const timestamp = Date.now();

    const batch = await ImportService.stageImport({
      userId,
      accountId,
      filename: `no-valid-rows-${timestamp}.csv`,

      validRows: [],

      errors: [
        {
          row: 1,
          message: 'Invalid amount',
          raw: {
            date: '2026-08-07',
            description: `Invalid Transaction ${timestamp}`,
            amount: 'not-a-number',
          },
        },
      ],
    });

    const journalEntriesBefore = await prisma.journalEntry.count();

    await expect(
      ImportService.commitImport(batch.id, offsetAccountId, userId),
    ).rejects.toThrow();

    const updatedBatch = await prisma.importBatch.findUnique({
      where: {
        id: batch.id,
      },
    });

    expect(updatedBatch?.status).toBe(ImportStatus.VALIDATED);

    const journalEntriesAfter = await prisma.journalEntry.count();

    expect(journalEntriesAfter).toBe(journalEntriesBefore);
  });

  it('should reject committing with an offset account belonging to another user', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    });

    const otherAccount = await prisma.account.create({
      data: {
        name: 'Other User Account',
        type: AccountType.EXPENSE,
        userId: otherUser.id,
      },
    });

    const batch = await prisma.importBatch.create({
      data: {
        filename: `invalid-offset-${Date.now()}.csv`,
        status: ImportStatus.VALIDATED,
        userId,
        accountId,
      },
    });

    await prisma.importRow.create({
      data: {
        batchId: batch.id,
        rowNumber: 1,
        date: new Date('2026-08-01'),
        description: 'Salary',
        amount: 500000,
        isValid: true,
      },
    });

    await expect(
      ImportService.commitImport(batch.id, otherAccount.id, userId),
    ).rejects.toThrow();

    const updatedBatch = await prisma.importBatch.findUnique({
      where: { id: batch.id },
    });

    expect(updatedBatch?.status).toBe(ImportStatus.VALIDATED);
  });
});
