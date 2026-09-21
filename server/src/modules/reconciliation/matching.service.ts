import { LineType } from '../../../generated/prisma/enums.js';
import { ValidatedImportRow } from '../import/import.types.js';
import { prisma } from '../../shared/utils/prisma.js';
import { ImportRowClassification, MatchingType } from './matching.types.js';

export class MatchingService {
  
  static readonly DATE_TOLERANCE_DAYS = 5;

  static async findCandidatesByCriteria(
    accountId: string,
    amount: number,
    lineType: LineType,
    date: Date,
  ) {
    const fromDate = new Date(date);
    fromDate.setDate(fromDate.getDate() - this.DATE_TOLERANCE_DAYS);

    const toDate = new Date(date);
    toDate.setDate(toDate.getDate() + this.DATE_TOLERANCE_DAYS);

    return prisma.transactionLine.findMany({
      where: {
        accountId,
        type: lineType,
        amount: Math.abs(amount),
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

  static async findCandidates(row: ValidatedImportRow, accountId: string) {
    const lineType = row.amount > 0 ? LineType.DEBIT : LineType.CREDIT;

    return this.findCandidatesByCriteria(
      accountId,
      row.amount,
      lineType,
      row.date,
    );
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
