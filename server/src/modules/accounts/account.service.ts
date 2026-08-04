import { AccountType, LineType } from '../../../generated/prisma/client';
import { prisma } from '../../shared/utils/prisma';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';

export class AccountService {
  private static calculateBalance(
    type: AccountType,
    debitSum: number,
    creditSum: number,
  ): number {
    return type === AccountType.ASSETS || type === AccountType.EXPENSE
      ? debitSum - creditSum
      : creditSum - debitSum;
  }

  private static async getBalanceSums(accountId: string) {
    const aggregations = await prisma.transactionLine.groupBy({
      by: ['type'],
      where: { accountId },
      _sum: { amount: true },
    });

    const debitSum =
      aggregations.find((a: { type: string }) => a.type === LineType.DEBIT)
        ?._sum.amount || 0;
    const creditSum =
      aggregations.find((a: { type: string }) => a.type === LineType.CREDIT)
        ?._sum.amount || 0;

    return { debitSum, creditSum };
  }

  static async createAccount(name: string, type: AccountType, userId: string) {
    return await prisma.account.create({
      data: { name, type, userId },
    });
  }

  static async listAccounts(userId: string) {
    return await prisma.account.findMany({ where: { userId } });
  }

  static async getAccountBalance(
    accountId: string,
    userId: string,
  ): Promise<number> {
    if (!accountId) throw new ValidationError('Account ID is required.');

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId },
      select: { type: true },
    });

    if (!account) throw new NotFoundError('Account not found.');

    const { debitSum, creditSum } = await this.getBalanceSums(accountId);
    return this.calculateBalance(account.type, debitSum, creditSum);
  }

  static async getAccountInfo(accountId: string, userId: string) {
    if (!accountId) throw new ValidationError('No account Id provided');

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId },
      select: { id: true, name: true, type: true },
    });

    if (!account) throw new NotFoundError(`No account found, check id again`);

    const balance = await this.getAccountBalance(accountId, userId);

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance,
    };
  }

  static async getAccountTransactions(accountId: string, userId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) throw new NotFoundError(`No account found, check id again`);

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
