import { LineType } from '../../generated/prisma/client';
import { CreateJournalEntryDTO } from '../types';
import { prisma } from '../utils/prisma';

export class LedgerService {
  
  static async createEntry(data: CreateJournalEntryDTO) {
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

    console.log('Validation passed! Ready to save to the db.');

    const newEntry = await prisma.journalEntry.create({
      data: {
        date: data.date,
        description: data.description,
        lines: { create: data.lines },
      },
    });

    return newEntry;
  }
}
