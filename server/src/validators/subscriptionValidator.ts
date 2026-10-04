import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Subscription name is required').max(100),
    amount: z.number().positive('Amount must be greater than 0').max(1000000000),
    billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    nextPaymentDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')),
    categoryId: z.string().min(1, 'Category is required'),
    status: z.enum(['ACTIVE', 'CANCELLED', 'PAUSED']).default('ACTIVE'),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Subscription ID is required'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    amount: z.number().positive().max(1000000000).optional(),
    billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    nextPaymentDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    categoryId: z.string().min(1).optional(),
    status: z.enum(['ACTIVE', 'CANCELLED', 'PAUSED']).optional(),
  }),
});
