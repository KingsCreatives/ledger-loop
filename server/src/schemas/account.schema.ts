import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(5, 'Account name is required'),
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    message: 'Invalid account type',
  }),
});
