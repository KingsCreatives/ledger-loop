import csvParser from 'csv-parser';
import { Readable } from 'node:stream';
import { ParsedCsvRow, ValidatedImportRow } from '../types/import.types';
import { validateRowSchema } from '../schemas/import.schema';

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
    errors: { row: number; message: string }[];
  } {
    const validRows: ValidatedImportRow[] = [];
    const errors: { row: number; message: string }[] = [];

    rows.forEach((row, index) => {
      const result = this.validateRow(row, index + 1);

      if (result.success && result.data) {
        validRows.push(result.data);
      } else {
        errors.push({
          row: index + 1,
          message: result.error ?? 'Unknown validation error',
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
      amount: row.amount ? Number(row.amount) : 0,
    };
  }

  private static formatZodErrors(errors: any[]): string {
    return errors
      .map((err) => `${err.path.join('.') || 'root'}: ${err.message}`)
      .join('; ');
  }
}
