import { LineType } from '../../../generated/prisma/enums';
import { ValidatedImportRow } from '../import/import.types';
import { prisma } from '../../shared/utils/prisma';

export class MatchingService {
  
  private static readonly DATE_TOLERANCE_DAYS = 5;

  static async findCandidates(row: ValidatedImportRow, accountId: string) {
    const lineType = row.amount > 0 ? LineType.DEBIT : LineType.CREDIT;

    /**TransactionLine.amount is always stored as a positive magnitude, per the double-entry convention used throughout this system direction lives in "type", never in the sign of "amount".
    **/
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
}
