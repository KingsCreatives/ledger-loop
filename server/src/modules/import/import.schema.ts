import { z } from 'zod';

export const validateRowSchema = z.object({
  date: z
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: 'Invalid date' }),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().int('Amount must be a whole number of cents'),
});

export const commitImportSchema = z.object({
  batchId: z.string().min(1),
  offsetAccountId: z.string().min(1),
  decisions: z.array(
    z.discriminatedUnion('status', [
      z.object({
        rowNumber: z.number().int().positive(),
        status: z.literal('LINKED'),
        candidateId: z.string().min(1),
      }),
      z.object({
        rowNumber: z.number().int().positive(),
        status: z.literal('NONE'),
      }),
    ]),
  ),
});
