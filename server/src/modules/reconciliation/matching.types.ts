import {
  TransactionLine,
  JournalEntry,
} from '../../../generated/prisma/client.js';

export type MatchingType = 'NO_MATCH' | 'SUGGESTED_MATCH' | 'AMBIGUOUS';

export type ImportRowClassification = {
  rowNumber: number;
  status: MatchingType;
  candidates: (TransactionLine & { journalEntryLine: JournalEntry })[];
};
