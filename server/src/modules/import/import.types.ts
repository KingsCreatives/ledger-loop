export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: string;
}

export interface ValidatedImportRow {
  date: Date;
  description: string;
  amount: number; // stored as integer cents, e.g. 1250 = $12.50
  rowNumber: number;
}
