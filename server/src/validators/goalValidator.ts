import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Goal name is required').max(100),
    targetAmount: z.number().positive('Target amount must be greater than 0').max(1000000000),
    currentAmount: z.number().min(0, 'Current amount cannot be negative').default(0),
    deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Goal ID is required'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    targetAmount: z.number().positive().max(1000000000).optional(),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
  }),
});

export const adjustGoalMoneySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Goal ID is required'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    operation: z.enum(['ADD', 'WITHDRAW']),
  }),
});
