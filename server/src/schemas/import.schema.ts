import { z } from 'zod';

export const validateRowSchema = z.object({
  date: z.date(),
  description: z.string().min(1),
  amount: z.number(),
});
