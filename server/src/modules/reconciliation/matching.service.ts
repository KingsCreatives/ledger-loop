import { LineType } from '../../../generated/prisma/enums.js';
import { ValidatedImportRow } from '../import/import.types.js';
import { prisma } from '../../shared/utils/prisma.js';
import { ImportRowClassification, MatchingType } from './matching.types.js';

export class MatchingService {
  static readonly DATE_TOLERANCE_DAYS = 5;

  static async findCandidates(row: ValidatedImportRow, accountId: string) {
    const lineType = row.amount > 0 ? LineType.DEBIT : LineType.CREDIT;

    const amount = Math.abs(row.amount);

    const fromDate = new Date(row.date);
    fromDate.setDate(fromDate.getDate() - this.DATE_TOLERANCE_DAYS);

    const toDate = new Date(row.date);
    toDate.setDate(toDate.getDate() + this.DATE_TOLERANCE_DAYS);

    return prisma.transactionLine.findMany({
      where: {
        accountId,
        type: lineType,
        amount,
        isReconciled: false,

        journalEntryLine: {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      include: {
        journalEntryLine: true,
      },
    });
  }

  static async classifyImportRows(
    rows: ValidatedImportRow[],
    accountId: string,
  ): Promise<ImportRowClassification[]> {
    const results: ImportRowClassification[] = [];

    for (const row of rows) {
      const candidates = await this.findCandidates(row, accountId);

      let status: MatchingType;
      if (candidates.length === 0) {
        status = 'NO_MATCH';
      } else if (candidates.length === 1) {
        status = 'SUGGESTED_MATCH';
      } else {
        status = 'AMBIGUOUS';
      }

      results.push({
        rowNumber: row.rowNumber,
        status,
        candidates,
      });
    }

    return results;
  }

  static async getOutstandingItems(accountId: string) {
    return prisma.transactionLine.findMany({
      where: {
        accountId,
        isReconciled: false,
      },
      include: {
        journalEntryLine: true,
      },
      orderBy: {
        journalEntryLine: {
          date: 'asc',
        },
      },
    });
  }
}
