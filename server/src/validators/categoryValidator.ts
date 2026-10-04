import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Category name is required').max(50, 'Name must be at most 50 characters'),
    type: z.enum(['INCOME', 'EXPENSE']),
    icon: z.string().trim().default('Tag'),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    icon: z.string().trim().optional(),
  }),
});
