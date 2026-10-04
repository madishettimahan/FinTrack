import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z.number().positive('Amount must be greater than 0').max(1000000000, 'Amount is too large'),
    categoryId: z.string().min(1, 'Category is required'),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (expected YYYY-MM-DD)')),
    description: z.string().trim().min(1, 'Description is required').max(255, 'Description is too long'),
    paymentMethod: z.string().trim().max(50).default('CASH'),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z.number().positive('Amount must be greater than 0').max(1000000000).optional(),
    categoryId: z.string().min(1).optional(),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    description: z.string().trim().min(1).max(255).optional(),
    paymentMethod: z.string().trim().max(50).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
});

export const getTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
});

export const queryTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    categoryId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    maxAmount: z.string().transform(Number).pipe(z.number().positive()).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['date', 'amount', 'description', 'category']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('10'),
  }).optional(),
});
