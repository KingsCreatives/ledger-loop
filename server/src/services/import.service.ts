import csvParser from 'csv-parser';
import { Readable } from 'node:stream';
import { ParsedCsvRow } from '../types/import.types';

export class ImportService {
  static async parseCSV(buffer: Buffer): Promise<ParsedCsvRow[]> {
    const rows: ParsedCsvRow[] = [];

    return new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });
  }
}
