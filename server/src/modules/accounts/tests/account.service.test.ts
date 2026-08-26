import { describe, expect, it } from 'vitest';
import { AccountService } from '../account.service.js';
import { AccountType, LineType } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../shared/utils/prisma.js';

describe('AccountService.createAccount', () => {
  it('should create a new account with valid data', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const name = 'Test Account';
    const type = AccountType.ASSETS;

    const account = await AccountService.createAccount(name, type, user.id);

    expect(account.name).toBe(name);
    expect(account.type).toBe(type);
    expect(account.userId).toBe(user.id);
  });

  it('should list only accounts belonging to the user', async () => {
    const user = await prisma.user.create({
      data: {
        email: `list-accounts-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `test-${crypto.randomUUID()}@example.com`,
        password: 'password123456',
      },
    });

    await prisma.account.createMany({
      data: [
        {
          name: 'Cash',
          type: AccountType.ASSETS,
          userId: user.id,
        },
        {
          name: 'Bank',
          type: AccountType.ASSETS,
          userId: user.id,
        },
        {
          name: 'Other User Account',
          type: AccountType.ASSETS,
          userId: otherUser.id,
        },
      ],
    });

    const accounts = await AccountService.listAccounts(user.id);

    expect(accounts).toHaveLength(2);

    expect(accounts.map((account: { name: any }) => account.name)).toEqual(
      expect.arrayContaining(['Cash', 'Bank']),
    );

    expect(
      accounts.some(
        (account: { name: string }) => account.name === 'Other User Account',
      ),
    ).toBe(false);
  });

  it('should not return accounts belonging to another user', async () => {
    const user = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    });

    await AccountService.createAccount(
      'Owner Account',
      AccountType.ASSETS,
      user.id,
    );

    await AccountService.createAccount(
      'Other User Account',
      AccountType.ASSETS,
      otherUser.id,
    );

    const accounts = await AccountService.listAccounts(user.id);

    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Owner Account');
    expect(accounts[0].userId).toBe(user.id);
  });

  it('should calculate an asset account balance as debit minus credit', async () => {
    const user = await prisma.user.create({
      data: {
        email: `balance-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Cash',
      AccountType.ASSETS,
      user.id,
    );

    const journalEntry = await prisma.journalEntry.create({
      data: {
        date: new Date(),
        description: 'Test cash movement',
      },
    });

    await prisma.transactionLine.createMany({
      data: [
        {
          amount: 1000,
          type: LineType.DEBIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
        {
          amount: 300,
          type: LineType.CREDIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
      ],
    });

    const balance = await AccountService.getAccountBalance(account.id, user.id);

    expect(balance).toBe(700);
  });

  it('should calculate a liability account balance as credit minus debit', async () => {
    const user = await prisma.user.create({
      data: {
        email: `liability-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Accounts Payable',
      AccountType.LIABILITIES,
      user.id,
    );

    const journalEntry = await prisma.journalEntry.create({
      data: {
        date: new Date(),
        description: 'Test liability movement',
      },
    });

    await prisma.transactionLine.createMany({
      data: [
        {
          amount: 2000,
          type: LineType.CREDIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
        {
          amount: 500,
          type: LineType.DEBIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
      ],
    });

    const balance = await AccountService.getAccountBalance(account.id, user.id);

    expect(balance).toBe(1500);
  });

  it('should reject balance lookup when the account belongs to another user', async () => {
    const owner = await prisma.user.create({
      data: {
        email: `balance-owner-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `balance-other-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Private Cash',
      AccountType.ASSETS,
      owner.id,
    );

    await expect(
      AccountService.getAccountBalance(account.id, otherUser.id),
    ).rejects.toThrow('Account not found.');
  });

  it('should reject balance lookup for a non-existent account', async () => {
    const user = await prisma.user.create({
      data: {
        email: `missing-account-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const nonExistentAccountId = crypto.randomUUID();

    await expect(
      AccountService.getAccountBalance(nonExistentAccountId, user.id),
    ).rejects.toThrow('Account not found.');
  });

  it('should reject balance lookup when no account ID is provided', async () => {
    const user = await prisma.user.create({
      data: {
        email: `missing-id-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    await expect(AccountService.getAccountBalance('', user.id)).rejects.toThrow(
      'Account ID is required.',
    );
  });

  it('should return account information with the calculated balance', async () => {
    const user = await prisma.user.create({
      data: {
        email: `account-info-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Cash Account',
      AccountType.ASSETS,
      user.id,
    );

    const journalEntry = await prisma.journalEntry.create({
      data: {
        date: new Date(),
        description: 'Account info test',
      },
    });

    await prisma.transactionLine.createMany({
      data: [
        {
          amount: 1500,
          type: LineType.DEBIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
        {
          amount: 400,
          type: LineType.CREDIT,
          accountId: account.id,
          journalEntryId: journalEntry.id,
        },
      ],
    });

    const result = await AccountService.getAccountInfo(account.id, user.id);

    expect(result).toEqual({
      id: account.id,
      name: 'Cash Account',
      type: AccountType.ASSETS,
      balance: 1100,
    });
  });

  it('should reject account info lookup when the account belongs to another user', async () => {
    const owner = await prisma.user.create({
      data: {
        email: `info-owner-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `info-other-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Private Account',
      AccountType.ASSETS,
      owner.id,
    );

    await expect(
      AccountService.getAccountInfo(account.id, otherUser.id),
    ).rejects.toThrow('No account found, check id again');
  });

  it('should reject account info lookup for a non-existent account', async () => {
    const user = await prisma.user.create({
      data: {
        email: `missing-info-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const nonExistentAccountId = crypto.randomUUID();

    await expect(
      AccountService.getAccountInfo(nonExistentAccountId, user.id),
    ).rejects.toThrow('No account found, check id again');
  });

  it('should reject account info lookup when no account ID is provided', async () => {
    const user = await prisma.user.create({
      data: {
        email: `missing-info-id-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    await expect(AccountService.getAccountInfo('', user.id)).rejects.toThrow(
      'No account Id provided',
    );
  });

  it('should return transactions for an account', async () => {
    const user = await prisma.user.create({
      data: {
        email: `transactions-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Cash Account',
      AccountType.ASSETS,
      user.id,
    );

    const olderEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-01-01'),
        description: 'Older transaction',
      },
    });

    const newerEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-02-01'),
        description: 'Newer transaction',
      },
    });

    await prisma.transactionLine.createMany({
      data: [
        {
          amount: 500,
          type: LineType.DEBIT,
          accountId: account.id,
          journalEntryId: olderEntry.id,
        },
        {
          amount: 1000,
          type: LineType.DEBIT,
          accountId: account.id,
          journalEntryId: newerEntry.id,
        },
      ],
    });

    const transactions = await AccountService.getAccountTransactions(
      account.id,
      user.id,
    );

    expect(transactions).toHaveLength(2);

    expect(transactions[0].journalEntryLine.id).toBe(newerEntry.id);
    expect(transactions[0].journalEntryLine.date).toEqual(newerEntry.date);
    expect(transactions[0].journalEntryLine.description).toBe(
      'Newer transaction',
    );
    expect(transactions[0].amount).toBe(1000);

    expect(transactions[1].journalEntryLine.id).toBe(olderEntry.id);
    expect(transactions[1].journalEntryLine.date).toEqual(olderEntry.date);
    expect(transactions[1].journalEntryLine.description).toBe(
      'Older transaction',
    );
    expect(transactions[1].amount).toBe(500);
  });

  it('should reject transaction lookup when the account belongs to another user', async () => {
    const owner = await prisma.user.create({
      data: {
        email: `transactions-owner-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `transactions-other-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const account = await AccountService.createAccount(
      'Private Cash',
      AccountType.ASSETS,
      owner.id,
    );

    await expect(
      AccountService.getAccountTransactions(account.id, otherUser.id),
    ).rejects.toThrow('No account found, check id again');
  });

  it('should reject transaction lookup for a non-existent account', async () => {
    const user = await prisma.user.create({
      data: {
        email: `missing-transactions-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

    const nonExistentAccountId = crypto.randomUUID();

    await expect(
      AccountService.getAccountTransactions(nonExistentAccountId, user.id),
    ).rejects.toThrow('No account found, check id again');
  });
});
