export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: string;
}

export interface ValidatedImportRow {
  date: Date;
  description: string;
  amount: number;
  rowNumber: number;
}
