import { z } from 'zod';

export const validateRowSchema = z.object({
  date: z
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: 'Invalid date' }),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().int('Amount must be a whole number of cents'),
});
