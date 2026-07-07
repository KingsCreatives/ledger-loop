import { AccountType, LineType } from '../../generated/prisma/client';
import { CreateJournalEntryDTO } from '../types';
import { prisma } from '../utils/prisma';

export class LedgerService {
  static async createEntry(data: CreateJournalEntryDTO, userId: string) {
    if (data.lines.length < 2) {
      throw new Error('A journal entry must have at least two transactions');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of data.lines) {
      if (line.type === LineType.DEBIT) {
        totalDebits += line.amount;
      } else if (line.type === LineType.CREDIT) {
        totalCredits += line.amount;
      }
    }

    if (totalDebits !== totalCredits) {
      throw new Error(
        `Ledger Imbalance: Debits (${totalDebits}) do not equal Credits(${totalCredits}).`,
      );
    }

    const accountIds = data.lines.map((line) => line.accountId);

    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, userId },
    });

    if (accounts.length !== accountIds.length) {
      throw new Error(
        'One or more account IDs are invalid or do not belong to the user',
      );
    }

    const newEntry = await prisma.journalEntry.create({
      data: {
        date: data.date,
        description: data.description,
        lines: { create: data.lines },
      },
    });

    return newEntry;
  }

  static async getAccountBalance(
    accountId: string,
    userId: string,
  ): Promise<number> {
    if (!accountId) throw new Error('No account Id provided');

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId },
      select: { type: true },
    });

    if (!account) throw new Error(`No account found, check id again`);

    const aggregations = await prisma.transactionLine.groupBy({
      by: ['type'],
      where: { accountId },
      _sum: { amount: true },
    });

    const debitSum =
      aggregations.find((a) => a.type === LineType.DEBIT)?._sum.amount || 0;
    const creditSum =
      aggregations.find((a) => a.type === LineType.CREDIT)?._sum.amount || 0;

    let balance = 0;

    if (
      account.type === AccountType.ASSETS ||
      account.type === AccountType.EXPENSE
    ) {
      balance = debitSum - creditSum;
    } else {
      balance = creditSum - debitSum;
    }

    return balance;
  }

  static async listAccounts(userId: string) {
    return await prisma.account.findMany({ where: { userId } });
  }

  static async createAccount(name: string, type: AccountType, userId: string) {
    return await prisma.account.create({
      data: { name, type, userId },
    });
  }

  static async getAccountTransactions(accountId: string, userId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) throw new Error(`No account found, check id again`);

    return prisma.transactionLine.findMany({
      where: { accountId: account.id },
      include: {
        journalEntryLine: {
          select: { date: true, description: true, id: true },
        },
      },
      orderBy: { journalEntryLine: { date: 'desc' } },
    });
  }
}
