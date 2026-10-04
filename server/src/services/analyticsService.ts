import { prisma } from '../config/db.js';

export interface InsightItem {
  id: string;
  type: 'info' | 'warning' | 'positive';
  title: string;
  message: string;
  icon?: string;
}

export class AnalyticsService {
  static async getAnalytics(userId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // This month range
    const startOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
    const endOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    // Last month range
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const startOfLastMonth = new Date(Date.UTC(lastMonthYear, lastMonth - 1, 1, 0, 0, 0, 0));
    const endOfLastMonth = new Date(Date.UTC(lastMonthYear, lastMonth, 0, 23, 59, 59, 999));

    const [
      currentMonthIncomeAgg,
      currentMonthExpenseAgg,
      lastMonthIncomeAgg,
      lastMonthExpenseAgg,
      currentMonthCatExpenses,
      lastMonthCatExpenses,
      budgets,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId, month: currentMonth, year: currentYear },
        include: { category: true },
      }),
    ]);

    const curIncome = currentMonthIncomeAgg._sum.amount || 0;
    const curExpense = currentMonthExpenseAgg._sum.amount || 0;
    const curSavings = curIncome - curExpense;

    const prevIncome = lastMonthIncomeAgg._sum.amount || 0;
    const prevExpense = lastMonthExpenseAgg._sum.amount || 0;
    const prevSavings = prevIncome - prevExpense;

    // Fetch category names
    const allCatIds = [
      ...currentMonthCatExpenses.map((c) => c.categoryId),
      ...lastMonthCatExpenses.map((c) => c.categoryId),
    ];
    const categories = await prisma.category.findMany({
      where: { id: { in: allCatIds } },
    });
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const insights: InsightItem[] = [];

    // Insight 1: Savings comparison
    if (prevSavings > 0 && curSavings > 0) {
      const savingsGrowth = Math.round(((curSavings - prevSavings) / prevSavings) * 100);
      if (savingsGrowth > 0) {
        insights.push({
          id: 'savings-growth',
          type: 'positive',
          title: 'Savings Increase',
          message: `Your net savings increased by ${savingsGrowth}% compared to last month.`,
          icon: 'TrendingUp',
        });
      } else if (savingsGrowth < 0) {
        insights.push({
          id: 'savings-dip',
          type: 'warning',
          title: 'Savings Decline',
          message: `Your net savings decreased by ${Math.abs(savingsGrowth)}% compared to last month.`,
          icon: 'TrendingDown',
        });
      }
    } else if (curSavings > 0 && prevSavings <= 0) {
      insights.push({
        id: 'savings-positive',
        type: 'positive',
        title: 'Positive Cash Flow',
        message: 'You have shifted into positive net savings this month!',
        icon: 'Award',
      });
    }

    // Insight 2: Largest expense category this month
    if (currentMonthCatExpenses.length > 0) {
      const sortedCurrentCats = [...currentMonthCatExpenses].sort(
        (a, b) => (b._sum.amount || 0) - (a._sum.amount || 0)
      );
      const topCat = sortedCurrentCats[0];
      const topCatName = catMap.get(topCat.categoryId) || 'Top Category';
      const topCatAmount = Math.round((topCat._sum.amount || 0) * 100) / 100;
      const topCatShare = curExpense > 0 ? Math.round((topCatAmount / curExpense) * 100) : 0;

      insights.push({
        id: 'top-expense-category',
        type: 'info',
        title: 'Largest Expense Driver',
        message: `Your largest expense category this month is ${topCatName} (${topCatShare}% of total expenses, $${topCatAmount.toLocaleString()}).`,
        icon: 'PieChart',
      });
    }

    // Insight 3: Category month-over-month surge
    const prevCatMap = new Map(lastMonthCatExpenses.map((c) => [c.categoryId, c._sum.amount || 0]));
    for (const cur of currentMonthCatExpenses) {
      const catAmount = cur._sum.amount || 0;
      const prevAmount = prevCatMap.get(cur.categoryId) || 0;
      if (prevAmount > 0 && catAmount > prevAmount * 1.15) {
        const increase = Math.round(((catAmount - prevAmount) / prevAmount) * 100);
        const name = catMap.get(cur.categoryId) || 'a category';
        insights.push({
          id: `surge-${cur.categoryId}`,
          type: 'warning',
          title: `Increased Spending in ${name}`,
          message: `You spent ${increase}% more on ${name} this month than last month.`,
          icon: 'AlertCircle',
        });
        break; // Show most significant one
      }
    }

    // Insight 4: Budget status
    const curCatMap = new Map(currentMonthCatExpenses.map((c) => [c.categoryId, c._sum.amount || 0]));
    let withinBudgetCount = 0;
    let exceededBudgetCount = 0;

    budgets.forEach((b) => {
      const spent = curCatMap.get(b.categoryId) || 0;
      if (spent <= b.amount) {
        withinBudgetCount++;
      } else {
        exceededBudgetCount++;
      }
    });

    if (budgets.length > 0) {
      if (exceededBudgetCount === 0) {
        insights.push({
          id: 'budgets-healthy',
          type: 'positive',
          title: 'Budgets On Track',
          message: `All ${budgets.length} of your monitored budget categories are currently within limits!`,
          icon: 'CheckCircle',
        });
      } else {
        insights.push({
          id: 'budgets-alert',
          type: 'warning',
          title: 'Budget Overrun',
          message: `${exceededBudgetCount} of your budget categories have exceeded their monthly spending limit.`,
          icon: 'AlertTriangle',
        });
      }
    }

    // Days elapsed in current month for daily average
    const daysInMonthSoFar = Math.max(1, now.getDate());
    const dailyAverageSpending = Math.round((curExpense / daysInMonthSoFar) * 100) / 100;
    const projectedMonthEndExpense = Math.round((dailyAverageSpending * 30) * 100) / 100;

    return {
      insights,
      metrics: {
        currentMonth: {
          income: Math.round(curIncome * 100) / 100,
          expense: Math.round(curExpense * 100) / 100,
          savings: Math.round(curSavings * 100) / 100,
          savingsRate: curIncome > 0 ? Math.round((curSavings / curIncome) * 100) : 0,
        },
        lastMonth: {
          income: Math.round(prevIncome * 100) / 100,
          expense: Math.round(prevExpense * 100) / 100,
          savings: Math.round(prevSavings * 100) / 100,
        },
        dailyAverageSpending,
        projectedMonthEndExpense,
      },
    };
  }
}
