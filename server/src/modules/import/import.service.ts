import csvParser from 'csv-parser';
import { Readable } from 'node:stream';
import { ParsedCsvRow, ValidatedImportRow } from './import.types.js';
import { validateRowSchema } from './import.schema.js';
import { prisma } from '../../shared/utils/prisma.js';
import { EntrySource, ImportStatus } from '../../../generated/prisma/enums.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../shared/utils/errors.js';
import { LineType } from '../../../generated/prisma/enums.js';
import { CreateJournalEntryDTO } from '../../modules/ledger/ledger.types.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ImportRow } from '../../../generated/prisma/client.js';
import crypto from 'node:crypto';
import { ImportRowDecision } from './import.types.js';
import { MatchingService } from '../reconciliation/matching.service.js';
import { Prisma } from '../../../generated/prisma/browser.js';

export class ImportService {
  static computeContentHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  static async parseCSV(buffer: Buffer): Promise<ParsedCsvRow[]> {
    const rows: ParsedCsvRow[] = [];

    return new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', (row: ParsedCsvRow) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });
  }

  static validateRows(rows: ParsedCsvRow[]): {
    validRows: ValidatedImportRow[];
    errors: { row: number; message: string; raw: ParsedCsvRow }[];
  } {
    const validRows: ValidatedImportRow[] = [];
    const errors: { row: number; message: string; raw: ParsedCsvRow }[] = [];

    rows.forEach((row, index) => {
      const result = this.validateRow(row, index + 1);

      if (result.success && result.data) {
        validRows.push(result.data);
      } else {
        errors.push({
          row: index + 1,
          message: result.error ?? 'Unknown validation error',
          raw: row,
        });
      }
    });

    return { validRows, errors };
  }

  static validateRow(
    row: ParsedCsvRow,
    rowNumber: number,
  ): {
    success: boolean;
    data?: ValidatedImportRow;
    error?: string;
  } {
    const transformedRow = this.transformRow(row);

    const validation = validateRowSchema.safeParse(transformedRow);

    if (validation.success) {
      return {
        success: true,
        data: {
          ...(validation.data as ValidatedImportRow),
          rowNumber,
        },
      };
    } else {
      return {
        success: false,
        error: this.formatZodErrors(validation.error.issues),
      };
    }
  }

  private static transformRow(
    row: ParsedCsvRow,
  ): Omit<ValidatedImportRow, 'rowNumber'> {
    return {
      date: new Date(row.date),
      description: row.description?.trim(),
      amount: row.amount ? Math.round(Number(row.amount) * 100) : 0,
    };
  }

  private static formatZodErrors(errors: any[]): string {
    return errors
      .map((err) => `${err.path.join('.') || 'root'}: ${err.message}`)
      .join('; ');
  }

  static async stageImport(params: {
    userId: string;
    accountId: string;
    filename: string;
    contentHash: string;
    validRows: ValidatedImportRow[];
    errors: {
      row: number;
      message: string;
      raw: ParsedCsvRow;
    }[];
  }) {
    const { userId, accountId, filename, validRows, errors, contentHash } =
      params;

    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new ValidationError(
        'Account does not exist or does not belong to the user',
      );
    }

    const existingBatch = await prisma.importBatch.findFirst({
      where: { accountId, contentHash },
    });

    if (existingBatch) {
      if (existingBatch.status === ImportStatus.COMMITTED) {
        throw new ConflictError(
          'This statement has already been imported for this account.',
        );
      }

      await prisma.importRow.deleteMany({
        where: { batchId: existingBatch.id },
      });
      await prisma.importBatch.delete({
        where: { id: existingBatch.id },
      });
    }

    return prisma.$transaction(
      async (tx: {
        importBatch: {
          create: (arg0: {
            data: {
              userId: string;
              accountId: string;
              filename: string;
              contentHash: string;
              status: any;
            };
          }) => any;
        };
        importRow: {
          createMany: (arg0: {
            data: {
              batchId: any;
              rowNumber: any;
              date: any;
              description: any;
              amount: any;
              isValid: boolean;
            }[];
          }) => any;
        };
      }) => {
        const batch = await tx.importBatch.create({
          data: {
            userId,
            accountId,
            contentHash,
            filename,
            status: ImportStatus.VALIDATED,
          },
        });

        const validRowData = validRows.map((row) => ({
          batchId: batch.id,
          rowNumber: row.rowNumber,
          date: row.date,
          description: row.description,
          amount: row.amount,
          isValid: true,
        }));

        const invalidRowData = errors.map((err) => ({
          batchId: batch.id,
          rowNumber: err.row,
          date: isNaN(new Date(err.raw.date).getTime())
            ? null
            : new Date(err.raw.date),
          description: err.raw.description?.trim() || null,
          amount:
            err.raw.amount && !isNaN(Number(err.raw.amount))
              ? Math.round(Number(err.raw.amount) * 100)
              : null,
          isValid: false,
          errorMessage: err.message,
        }));

        await tx.importRow.createMany({
          data: [...validRowData, ...invalidRowData],
        });

        return batch;
      },
    );
  }

  static async loadImportBatch(batchId: string, userId: string) {
    const batch = await prisma.importBatch.findFirst({
      where: {
        id: batchId,
        userId,
        status: ImportStatus.VALIDATED,
      },
      include: {
        importRows: {
          where: {
            isValid: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundError("Batch doesn't exist");
    }

    return batch;
  }

  private static buildJournalEntryDTO(
    row: ImportRow,
    accountId: string,
    offsetAccountId: string,
  ): CreateJournalEntryDTO {
    if (!row.date || !row.description || row.amount === null) {
      throw new ValidationError('Invalid import row');
    }
    const isMoneyIn = row.amount > 0;
    const amount = Math.abs(row.amount);

    return {
      date: row.date,
      description: row.description,
      lines: isMoneyIn
        ? [
            {
              accountId,
              type: LineType.DEBIT,
              amount,
            },
            {
              accountId: offsetAccountId,
              type: LineType.CREDIT,
              amount,
            },
          ]
        : [
            {
              accountId: offsetAccountId,
              type: LineType.DEBIT,
              amount,
            },
            {
              accountId,
              type: LineType.CREDIT,
              amount,
            },
          ],
    };
  }

 static async commitImport(
  batchId: string,
  offsetAccountId: string,
  userId: string,
  decisions: ImportRowDecision[],
) {
  const batch = await this.loadImportBatch(batchId, userId);

  if (batch.importRows.length === 0) {
    throw new ValidationError('Import contains no valid rows');
  }

  // Prevent two import rows from matching the same transaction line
  const linkedCandidateIds = decisions
    .filter((decision) => decision.status === 'LINKED')
    .map((decision) => decision.candidateId);

  if (new Set(linkedCandidateIds).size !== linkedCandidateIds.length) {
    throw new ValidationError(
      'Two rows cannot be matched to the same existing transaction.',
    );
  }

  return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
    let created = 0;
    let reconciled = 0;

    for (const row of batch.importRows) {

      if (!row.date || !row.description || row.amount === null) {
        throw new ValidationError('Invalid import row');
      }
      
      const decision = decisions.find(
        (item) => item.rowNumber === row.rowNumber,
      );

      if (decision?.status === 'LINKED') {

        const candidate = await tx.transactionLine.findFirst({
          where: {
            id: decision.candidateId,
            accountId: batch.accountId,
            isReconciled: false,
            amount: Math.abs(row.amount),
            type: row.amount > 0 ? LineType.DEBIT : LineType.CREDIT,
            journalEntryLine: {
              date: {
                gte: new Date(
                  row.date.getTime() -
                    MatchingService.DATE_TOLERANCE_DAYS * 24 * 60 * 60 * 1000,
                ),
                lte: new Date(
                  row.date.getTime() +
                    MatchingService.DATE_TOLERANCE_DAYS * 24 * 60 * 60 * 1000,
                ),
              },
            },
          },
        });

        if (!candidate) {
          throw new ValidationError(
            'Selected transaction is invalid, already reconciled, or does not belong to this account.',
          );
        }

        await tx.transactionLine.update({
          where: {
            id: candidate.id,
          },
          data: {
            isReconciled: true,
            reconciledAt: new Date(),
          },
        });

        await tx.importRow.update({
          where: {
            id: row.id,
          },
          data: {
            matchLineId: candidate.id,
          },
        });

        reconciled++;
        continue;
      }

      const dto = this.buildJournalEntryDTO(
        row,
        batch.accountId,
        offsetAccountId,
      );

      dto.source = EntrySource.IMPORT;

      const newEntry = await LedgerService.createEntry(
        dto,
        userId,
        tx,
      );

      const bankLine = await tx.transactionLine.findFirst({
        where: {
          journalEntryId: newEntry.id,
          accountId: batch.accountId,
        },
      });

      if (!bankLine) {
        throw new ValidationError(
          'Failed to identify the bank transaction line.',
        );
      }

      await tx.transactionLine.update({
        where: {
          id: bankLine.id,
        },
        data: {
          isReconciled: true,
          reconciledAt: new Date(),
        },
      });

      created++;
    }

    await tx.importBatch.update({
      where: {
        id: batch.id,
      },
      data: {
        status: ImportStatus.COMMITTED,
      },
    });

    return {
      batchId: batch.id,
      created,
      reconciled,
      status: ImportStatus.COMMITTED,
    };
  });
}
}
