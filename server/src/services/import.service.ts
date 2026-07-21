import csvParser from 'csv-parser';
import { Readable } from 'node:stream';
import { ParsedCsvRow, ValidatedImportRow } from '../types/import.types';
import { validateRowSchema } from '../schemas/import.schema';
import { prisma } from '../utils/prisma';
import { ImportStatus } from '../../generated/prisma/enums';

export class ImportService {
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
    validRows: ValidatedImportRow[];
    errors: { row: number; message: string; raw: ParsedCsvRow }[];
  }) {
    const { userId, accountId, filename, validRows, errors } = params;

    return prisma.$transaction(async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          userId,
          accountId,
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
    });
  }
}
