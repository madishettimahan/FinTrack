import { prisma } from '../config/db.js';

export class DashboardService {
  static async getDashboardData(userId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const startOfThisMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
    const endOfThisMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    // 1. Overall all-time totals
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Math.round((incomeAgg._sum.amount || 0) * 100) / 100;
    const totalExpenses = Math.round((expenseAgg._sum.amount || 0) * 100) / 100;
    const totalBalance = Math.round((totalIncome - totalExpenses) * 100) / 100;
    const totalSavings = totalBalance;

    // 2. Current Month Totals
    const [monthIncomeAgg, monthExpenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'INCOME',
          date: { gte: startOfThisMonth, lte: endOfThisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: startOfThisMonth, lte: endOfThisMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const monthIncome = Math.round((monthIncomeAgg._sum.amount || 0) * 100) / 100;
    const monthExpenses = Math.round((monthExpenseAgg._sum.amount || 0) * 100) / 100;
    const monthSavings = Math.round((monthIncome - monthExpenses) * 100) / 100;

    // 3. Last 6 Months Income vs Expense Trend
    const sixMonthsAgo = new Date(Date.UTC(currentYear, currentMonth - 6, 1));
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendMap = new Map<string, { income: number; expense: number; monthName: string }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(currentYear, currentMonth - 1 - i, 1));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrendMap.set(key, {
        income: 0,
        expense: 0,
        monthName: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
      });
    }

    recentTransactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrendMap.has(key)) {
        const item = monthlyTrendMap.get(key)!;
        if (tx.type === 'INCOME') {
          item.income = Math.round((item.income + tx.amount) * 100) / 100;
        } else {
          item.expense = Math.round((item.expense + tx.amount) * 100) / 100;
        }
      }
    });

    const monthlyTrends = Array.from(monthlyTrendMap.entries()).map(([key, val]) => ({
      key,
      name: val.monthName,
      income: val.income,
      expense: val.expense,
      savings: Math.round((val.income - val.expense) * 100) / 100,
    }));

    // 4. Current Month Expense by Category (Donut chart data)
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
      _sum: { amount: true },
    });

    const catIds = categoryExpenses.map((c) => c.categoryId);
    const catDetails = await prisma.category.findMany({
      where: { id: { in: catIds } },
    });
    const catMap = new Map(catDetails.map((c) => [c.id, c.name]));

    const expensesByCategory = categoryExpenses
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: catMap.get(item.categoryId) || 'Uncategorized',
        amount: Math.round((item._sum.amount || 0) * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Current Month Budget Utilization
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
      include: { category: true },
    });

    const budgetCatMap = new Map(categoryExpenses.map((c) => [c.categoryId, c._sum.amount || 0]));

    const budgetUtilization = budgets.map((b) => {
      const spent = Math.round((budgetCatMap.get(b.categoryId) || 0) * 100) / 100;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        id: b.id,
        category: b.category.name,
        budget: b.amount,
        spent,
        remaining: Math.max(0, Math.round((b.amount - spent) * 100) / 100),
        percentage,
      };
    });

    // 6. Savings Goals Summary
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const savingsProgress = goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      percentage: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
    }));

    // 7. Recent Transactions
    const latestTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: {
          select: { name: true, icon: true, type: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return {
      summary: {
        totalBalance,
        totalIncome,
        totalExpenses,
        totalSavings,
        monthIncome,
        monthExpenses,
        monthSavings,
      },
      charts: {
        monthlyTrends,
        expensesByCategory,
        budgetUtilization,
        savingsProgress,
      },
      recentTransactions: latestTransactions,
    };
  }
}
