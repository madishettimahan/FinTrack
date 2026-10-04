import { Request } from 'express';
import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { logAudit } from './auditService.js';

export interface TransactionFilterParams {
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class TransactionService {
  static async getTransactions(userId: string, filters: TransactionFilterParams = {}) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      userId, // STRICT TENANT ISOLATION
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // end of that day
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { category: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    let orderBy: any = { date: 'desc' };
    if (filters.sortBy) {
      if (filters.sortBy === 'category') {
        orderBy = { category: { name: filters.sortOrder || 'asc' } };
      } else {
        orderBy = { [filters.sortBy]: filters.sortOrder || 'desc' };
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              icon: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getTransactionById(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId, // STRICT USER ISOLATION
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      // Return 404 or 403 without revealing another user's transaction exists
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  static async createTransaction(
    userId: string,
    data: {
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      categoryId: string;
      date: string;
      description: string;
      paymentMethod?: string;
      notes?: string | null;
    },
    req?: Request
  ) {
    // Verify category is valid for user
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null, isDefault: true }],
      },
    });

    if (!category) {
      throw new BadRequestError('Invalid category selected');
    }

    if (category.type !== data.type) {
      throw new BadRequestError(`Selected category is for ${category.type}, but transaction is ${data.type}`);
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        amount: Math.round(data.amount * 100) / 100, // Round to 2 decimal places
        categoryId: data.categoryId,
        date: new Date(data.date),
        description: data.description,
        paymentMethod: data.paymentMethod || 'CASH',
        notes: data.notes || null,
      },
      include: {
        category: true,
      },
    });

    await logAudit({
      userId,
      action: 'TRANSACTION_CREATED',
      entity: 'Transaction',
      entityId: transaction.id,
      req,
    });

    return transaction;
  }

  static async updateTransaction(
    userId: string,
    id: string,
    data: {
      type?: 'INCOME' | 'EXPENSE';
      amount?: number;
      categoryId?: string;
      date?: string;
      description?: string;
      paymentMethod?: string;
      notes?: string | null;
    },
    req?: Request
  ) {
    // Ensure transaction exists and belongs to current user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId }, { userId: null, isDefault: true }],
        },
      });
      if (!category) {
        throw new BadRequestError('Invalid category selected');
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.amount !== undefined && { amount: Math.round(data.amount * 100) / 100 }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.description && { description: data.description }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        category: true,
      },
    });

    await logAudit({
      userId,
      action: 'TRANSACTION_UPDATED',
      entity: 'Transaction',
      entityId: id,
      req,
    });

    return updated;
  }

  static async deleteTransaction(userId: string, id: string, req?: Request) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id },
    });

    await logAudit({
      userId,
      action: 'TRANSACTION_DELETED',
      entity: 'Transaction',
      entityId: id,
      req,
    });

    return { message: 'Transaction deleted successfully' };
  }
}
