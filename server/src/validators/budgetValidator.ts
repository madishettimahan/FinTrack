import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Budget amount must be greater than 0').max(1000000000),
    month: z.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Budget ID is required'),
  }),
  body: z.object({
    amount: z.number().positive('Budget amount must be greater than 0').max(1000000000),
  }),
});
