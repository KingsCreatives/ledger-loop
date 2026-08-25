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

  it('should reject staging when the account belongs to another user', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@example.com`,
        password: 'test-password',
      },
    });

    const otherAccount = await prisma.account.create({
      data: {
        name: 'Other User Account',
        type: 'ASSETS',
        userId: otherUser.id,
      },
    });

    await expect(
      ImportService.stageImport({
        userId,
        accountId: otherAccount.id,
        filename: `unauthorized-account-${Date.now()}.csv`,

        validRows: [
          {
            rowNumber: 1,
            date: new Date('2026-08-01'),
            description: 'Salary',
            amount: 500000,
          },
        ],

        errors: [],
      }),
    ).rejects.toThrow();

    const batch = await prisma.importBatch.findFirst({
      where: {
        filename: `unauthorized-account-${Date.now()}.csv`,
      },
    });

    expect(batch).toBeNull();
  });

 it('should create a validated batch when no rows are provided', async () => {
   const filename = `empty-${Date.now()}.csv`;

   const batch = await ImportService.stageImport({
     userId,
     accountId,
     filename,
     validRows: [],
     errors: [],
   });

   expect(batch.status).toBe('VALIDATED');

   const rows = await prisma.importRow.findMany({
     where: {
       batchId: batch.id,
     },
   });

   expect(rows).toHaveLength(0);
 });

 it('should set the batch status to VALIDATED after staging', async () => {
   const filename = `status-${Date.now()}.csv`;

   const batch = await ImportService.stageImport({
     userId,
     accountId,
     filename,

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

   const storedBatch = await prisma.importBatch.findUnique({
     where: {
       id: batch.id,
     },
   });

   expect(storedBatch).not.toBeNull();
   expect(storedBatch?.status).toBe('VALIDATED');
 });

 it('should persist row numbers correctly for staged rows', async () => {
   const filename = `row-numbers-${Date.now()}.csv`;

   const batch = await ImportService.stageImport({
     userId,
     accountId,
     filename,

     validRows: [
       {
         rowNumber: 1,
         date: new Date('2026-08-01'),
         description: 'Salary',
         amount: 500000,
       },
       {
         rowNumber: 3,
         date: new Date('2026-08-03'),
         description: 'Rent',
         amount: 200000,
       },
     ],

     errors: [
       {
         row: 2,
         message: 'amount: Invalid amount',
         raw: {
           date: '2026-08-02',
           description: 'Invalid transaction',
           amount: 'abc',
         },
       },
     ],
   });

   const rows = await prisma.importRow.findMany({
     where: {
       batchId: batch.id,
     },
     orderBy: {
       rowNumber: 'asc',
     },
   });

   expect(rows).toHaveLength(3);

   expect(rows[0].rowNumber).toBe(1);
   expect(rows[0].isValid).toBe(true);

   expect(rows[1].rowNumber).toBe(2);
   expect(rows[1].isValid).toBe(false);
   expect(rows[1].errorMessage).toBe('amount: Invalid amount');

   expect(rows[2].rowNumber).toBe(3);
   expect(rows[2].isValid).toBe(true);
 });

 it('should persist rows with the correct row numbers', async () => {
   const result = await ImportService.stageImport({
     userId,
     accountId,
     filename: 'row-numbering.csv',

     validRows: [
       {
         rowNumber: 1,
         date: new Date('2026-08-01'),
         description: 'Salary',
         amount: 500000,
       },
       {
         rowNumber: 2,
         date: new Date('2026-08-02'),
         description: 'Rent',
         amount: -150000,
       },
       {
         rowNumber: 3,
         date: new Date('2026-08-03'),
         description: 'Utilities',
         amount: -30000,
       },
     ],

     errors: [],
   });

   const rows = await prisma.importRow.findMany({
     where: {
       batchId: result.id,
     },
     orderBy: {
       rowNumber: 'asc',
     },
   });

   expect(rows).toHaveLength(3);

   expect(rows.map((row: { rowNumber: any; }) => row.rowNumber)).toEqual([1, 2, 3]);

   expect(rows.map((row: { description: any; }) => row.description)).toEqual([
     'Salary',
     'Rent',
     'Utilities',
   ]);
 });

 it('should persist both valid and invalid rows in the same batch', async () => {
   const filename = `mixed-${Date.now()}.csv`;

   const batch = await ImportService.stageImport({
     userId,
     accountId,
     filename,

     validRows: [
       {
         rowNumber: 1,
         date: new Date('2026-08-01'),
         description: 'Salary',
         amount: 500000,
       },
       {
         rowNumber: 3,
         date: new Date('2026-08-03'),
         description: 'Rent',
         amount: -150000,
       },
     ],

     errors: [
       {
         row: 2,
         message: 'amount: Invalid amount',
         raw: {
           date: '2026-08-02',
           description: 'Invalid transaction',
           amount: 'abc',
         },
       },
     ],
   });

   const rows = await prisma.importRow.findMany({
     where: {
       batchId: batch.id,
     },
     orderBy: {
       rowNumber: 'asc',
     },
   });

   expect(rows).toHaveLength(3);

   expect(rows[0]).toMatchObject({
     rowNumber: 1,
     description: 'Salary',
     amount: 500000,
     isValid: true,
   });

   expect(rows[1]).toMatchObject({
     rowNumber: 2,
     description: 'Invalid transaction',
     isValid: false,
     errorMessage: 'amount: Invalid amount',
   });

   expect(rows[2]).toMatchObject({
     rowNumber: 3,
     description: 'Rent',
     amount: -150000,
     isValid: true,
   });
 });

 it('should persist the batch with the correct filename and user ownership', async () => {
   const filename = `ownership-${Date.now()}.csv`;

   const batch = await ImportService.stageImport({
     userId,
     accountId,
     filename,

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

   expect(batch.filename).toBe(filename);
   expect(batch.userId).toBe(userId);
   expect(batch.accountId).toBe(accountId);
   expect(batch.status).toBe('VALIDATED');
 });
});
