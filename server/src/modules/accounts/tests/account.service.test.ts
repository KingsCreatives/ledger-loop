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
});
