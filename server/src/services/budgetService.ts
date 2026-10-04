import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export class BudgetService {
  static async getBudgets(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate actual expenses for each category in the specified month
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const categoryIds = budgets.map((b) => b.categoryId);

    // Group transactions by categoryId for that month
    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: { in: categoryIds },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const expenseMap = new Map<string, number>();
    expenses.forEach((item) => {
      expenseMap.set(item.categoryId, item._sum.amount || 0);
    });

    const enrichedBudgets = budgets.map((b) => {
      const spent = Math.round((expenseMap.get(b.categoryId) || 0) * 100) / 100;
      const remaining = Math.round(Math.max(0, b.amount - spent) * 100) / 100;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      let status: 'SAFE' | 'WARNING' | 'EXCEEDED' = 'SAFE';
      if (spent > b.amount) {
        status = 'EXCEEDED';
      } else if (percentage >= 80) {
        status = 'WARNING';
      }

      return {
        id: b.id,
        categoryId: b.categoryId,
        category: b.category,
        amount: b.amount,
        spent,
        remaining,
        percentage,
        status,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });

    return enrichedBudgets;
  }

  static async createBudget(
    userId: string,
    data: { categoryId: string; amount: number; month: number; year: number }
  ) {
    // Check if category exists
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null, isDefault: true }],
      },
    });

    if (!category) {
      throw new BadRequestError('Invalid category');
    }

    if (category.type !== 'EXPENSE') {
      throw new BadRequestError('Budgets can only be set for Expense categories');
    }

    // Check if budget already exists for this category/month/year
    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw new ConflictError('A budget for this category and month already exists. Update it instead.');
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: Math.round(data.amount * 100) / 100,
        month: data.month,
        year: data.year,
      },
      include: {
        category: true,
      },
    });

    return budget;
  }

  static async updateBudget(userId: string, id: string, amount: number) {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Budget not found');
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        amount: Math.round(amount * 100) / 100,
      },
      include: {
        category: true,
      },
    });

    return updated;
  }

  static async deleteBudget(userId: string, id: string) {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Budget not found');
    }

    await prisma.budget.delete({
      where: { id },
    });

    return { message: 'Budget deleted successfully' };
  }
}
