import { LineType, EntrySource } from '../../../generated/prisma/client.js';

export interface CreateTransactionLineDTO {
  accountId: string;
  amount: number;
  type: LineType;
}

export interface CreateJournalEntryDTO {
  date: Date;
  description: string;
  lines: CreateTransactionLineDTO[];
  source?: EntrySource
}
