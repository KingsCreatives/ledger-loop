import { PrismaClient, LineType } from '../../generated/prisma/client';

export interface CreateTransactionLineDTO {
  accountId: string;
  amount: number;
  type: LineType;
}

export interface CreateJournalEntryDTO {
  date: Date;
  description: string;
  lines: CreateTransactionLineDTO[];
}
