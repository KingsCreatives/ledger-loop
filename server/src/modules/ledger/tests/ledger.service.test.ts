import { describe, it, expect } from 'vitest';
import { prisma } from '../../../shared/utils/prisma.js';
import { LedgerService } from '../ledger.service.js';
import { AccountType, LineType } from '../../../../generated/prisma/client.js';

describe('LedgerService.createEntry', () => {
  it('should create a valid balanced journal entry with transaction lines', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger-test-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const debitAccount = await prisma.account.create({
      data: {
        name: 'Cash',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    const creditAccount = await prisma.account.create({
      data: {
        name: 'Revenue',
        type: AccountType.REVENUE,
        userId: user.id,
      },
    });

    const date = new Date('2026-08-27T00:00:00.000Z');

    const entry = await LedgerService.createEntry(
      {
        date,
        description: 'Test journal entry',
        lines: [
          {
            accountId: debitAccount.id,
            amount: 100,
            type: LineType.DEBIT,
          },
          {
            accountId: creditAccount.id,
            amount: 100,
            type: LineType.CREDIT,
          },
        ],
      },
      user.id,
    );

    expect(entry).toBeDefined();
    expect(entry.description).toBe('Test journal entry');
    expect(entry.date).toEqual(date);

    const lines = await prisma.transactionLine.findMany({
      where: {
        journalEntryId: entry.id,
      },
    });

    expect(lines).toHaveLength(2);

    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: debitAccount.id,
          amount: 100,
          type: LineType.DEBIT,
        }),
        expect.objectContaining({
          accountId: creditAccount.id,
          amount: 100,
          type: LineType.CREDIT,
        }),
      ]),
    );
  });

  it('should reject a journal entry with fewer than two transaction lines', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger-test-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const account = await prisma.account.create({
      data: {
        name: 'Cash',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    await expect(
      LedgerService.createEntry(
        {
          date: new Date(),
          description: 'Invalid journal entry',
          lines: [
            {
              accountId: account.id,
              amount: 100,
              type: LineType.DEBIT,
            },
          ],
        },
        user.id,
      ),
    ).rejects.toThrow('A journal entry must have at least two transactions');
  });

  it('should reject an unbalanced journal entry', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger-test-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const debitAccount = await prisma.account.create({
      data: {
        name: 'Cash',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    const creditAccount = await prisma.account.create({
      data: {
        name: 'Revenue',
        type: AccountType.REVENUE,
        userId: user.id,
      },
    });

    await expect(
      LedgerService.createEntry(
        {
          date: new Date(),
          description: 'Unbalanced journal entry',
          lines: [
            {
              accountId: debitAccount.id,
              amount: 100,
              type: LineType.DEBIT,
            },
            {
              accountId: creditAccount.id,
              amount: 50,
              type: LineType.CREDIT,
            },
          ],
        },
        user.id,
      ),
    ).rejects.toThrow(
      'Ledger Imbalance: Debits (100) do not equal Credits(50).',
    );
  });

  it('should reject a journal entry when an account belongs to another user', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger-user-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `ledger-other-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const userAccount = await prisma.account.create({
      data: {
        name: 'Cash',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    const otherUserAccount = await prisma.account.create({
      data: {
        name: 'Revenue',
        type: AccountType.REVENUE,
        userId: otherUser.id,
      },
    });

    await expect(
      LedgerService.createEntry(
        {
          date: new Date(),
          description: 'Unauthorized account test',
          lines: [
            {
              accountId: userAccount.id,
              amount: 100,
              type: LineType.DEBIT,
            },
            {
              accountId: otherUserAccount.id,
              amount: 100,
              type: LineType.CREDIT,
            },
          ],
        },
        user.id,
      ),
    ).rejects.toThrow(
      'One or more account IDs are invalid or do not belong to the user',
    );
  });

  it('should persist transaction lines with the correct account, amount, and type', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger-lines-${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    const debitAccount = await prisma.account.create({
      data: {
        name: 'Cash',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    const creditAccount = await prisma.account.create({
      data: {
        name: 'Revenue',
        type: AccountType.REVENUE,
        userId: user.id,
      },
    });

    const entry = await LedgerService.createEntry(
      {
        date: new Date(),
        description: 'Transaction line persistence test',
        lines: [
          {
            accountId: debitAccount.id,
            amount: 250,
            type: LineType.DEBIT,
          },
          {
            accountId: creditAccount.id,
            amount: 250,
            type: LineType.CREDIT,
          },
        ],
      },
      user.id,
    );

    const lines = await prisma.transactionLine.findMany({
      where: {
        journalEntryId: entry.id,
      },
    });

    expect(lines).toHaveLength(2);

    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: debitAccount.id,
          amount: 250,
          type: LineType.DEBIT,
        }),
        expect.objectContaining({
          accountId: creditAccount.id,
          amount: 250,
          type: LineType.CREDIT,
        }),
      ]),
    );
  });
});