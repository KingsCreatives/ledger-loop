import { LineType } from '../../../generated/prisma/client';
import { CreateJournalEntryDTO } from './ledger.types';
import { prisma } from '../../shared/utils/prisma';
import { ValidationError } from '../../shared/utils/errors';
import { Prisma } from '../../../generated/prisma/browser';

export class LedgerService {
  static async createEntry(
    data: CreateJournalEntryDTO,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (data.lines.length < 2) {
      throw new ValidationError(
        'A journal entry must have at least two transactions',
      );
    }

    const db = tx ?? prisma;

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
      throw new ValidationError(
        `Ledger Imbalance: Debits (${totalDebits}) do not equal Credits(${totalCredits}).`,
      );
    }

    const accountIds = data.lines.map((line) => line.accountId);

    const accounts = await db.account.findMany({
      where: { id: { in: accountIds }, userId },
    });

    if (accounts.length !== accountIds.length) {
      throw new ValidationError(
        'One or more account IDs are invalid or do not belong to the user',
      );
    }

    const newEntry = await db.journalEntry.create({
      data: {
        date: data.date,
        description: data.description,
        lines: { create: data.lines },
      },
    });

    return newEntry;
  }
}
