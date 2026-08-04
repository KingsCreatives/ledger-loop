import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(3, 'Account name is required').max(50, 'Account name must be less than 50 characters'),
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    message: 'Invalid account type',
  }),
});
