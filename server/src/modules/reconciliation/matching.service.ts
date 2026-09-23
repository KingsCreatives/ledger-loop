import { LineType } from '../../../generated/prisma/enums.js';
import { ValidatedImportRow } from '../import/import.types.js';
import { prisma } from '../../shared/utils/prisma.js';
import { Prisma } from '../../../generated/prisma/client.js';
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

  static async findMatchesForLine(lineId: string, accountId: string) {
    const line = await prisma.transactionLine.findFirst({
      where: {
        id: lineId,
        accountId,
        isReconciled: false,
      },
      include: {
        journalEntryLine: true,
      },
    });

    if (!line) {
      return null;
    }

    const candidates = await this.findCandidatesByCriteria(
      accountId,
      line.amount,
      line.type,
      line.journalEntryLine.date,
    );

    return {
      line,
      candidates: candidates.filter(
        (candidate: { id: string }) => candidate.id !== line.id,
      ),
    };
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

  static async reconcileLines(
    accountId: string,
    lineId: string,
    candidateId: string,
  ) {
    return prisma.$transaction(async (tx:Prisma.TransactionClient) => {
      const lines = await tx.transactionLine.findMany({
        where: {
          id: {
            in: [lineId, candidateId],
          },
          accountId,
          isReconciled: false,
        },
        include: {
          journalEntryLine: true,
        },
      });

      if (lines.length !== 2) {
        return null;
      }

      const line = lines.find((item: {id: string}) => item.id === lineId);
      const candidate = lines.find((item: {id: string}) => item.id === candidateId);

      if (!line || !candidate) {
        return null;
      }

      const dateDifference = Math.abs(
        line.journalEntryLine.date.getTime() -
          candidate.journalEntryLine.date.getTime(),
      );

      const daysDifference = dateDifference / (1000 * 60 * 60 * 24);

      if (
        line.amount !== candidate.amount ||
        line.type !== candidate.type ||
        daysDifference > this.DATE_TOLERANCE_DAYS
      ) {
        return null;
      }

      const reconciledAt = new Date();

      await tx.transactionLine.updateMany({
        where: {
          id: {
            in: [lineId, candidateId],
          },
        },
        data: {
          isReconciled: true,
          reconciledAt,
        },
      });

      return {
        lineId,
        candidateId,
        reconciledAt,
      };
    });
  }
}
