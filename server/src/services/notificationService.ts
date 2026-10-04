import { prisma } from '../config/db.js';

export interface AppNotification {
  id: string;
  type: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'SUBSCRIPTION_DUE' | 'GOAL_MILESTONE';
  level: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  link: string;
  createdAt: string;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    const notifications: AppNotification[] = [];

    // 1. Budget Alerts
    const budgets = await prisma.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    });

    if (budgets.length > 0) {
      const expenses = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          categoryId: { in: budgets.map((b) => b.categoryId) },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      });

      const expenseMap = new Map(expenses.map((e) => [e.categoryId, e._sum.amount || 0]));

      budgets.forEach((b) => {
        const spent = expenseMap.get(b.categoryId) || 0;
        const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

        if (spent > b.amount) {
          notifications.push({
            id: `budget-exceeded-${b.id}`,
            type: 'BUDGET_EXCEEDED',
            level: 'danger',
            title: 'Budget Exceeded',
            message: `Your ${b.category.name} budget has been exceeded! (Spent $${spent.toFixed(2)} of $${b.amount.toFixed(2)})`,
            link: '/budgets',
            createdAt: now.toISOString(),
          });
        } else if (percentage >= 80) {
          notifications.push({
            id: `budget-warning-${b.id}`,
            type: 'BUDGET_WARNING',
            level: 'warning',
            title: 'Budget Alert',
            message: `You have used ${Math.round(percentage)}% of your ${b.category.name} budget. ($${(b.amount - spent).toFixed(2)} remaining)`,
            link: '/budgets',
            createdAt: now.toISOString(),
          });
        }
      });
    }

    // 2. Upcoming Subscription Alerts (due within 3 days)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    activeSubscriptions.forEach((sub) => {
      const diffTime = sub.nextPaymentDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        notifications.push({
          id: `sub-due-today-${sub.id}`,
          type: 'SUBSCRIPTION_DUE',
          level: 'warning',
          title: 'Subscription Due Today',
          message: `Your ${sub.name} subscription ($${sub.amount.toFixed(2)}) is due today.`,
          link: '/subscriptions',
          createdAt: now.toISOString(),
        });
      } else if (diffDays === 1) {
        notifications.push({
          id: `sub-due-tomorrow-${sub.id}`,
          type: 'SUBSCRIPTION_DUE',
          level: 'info',
          title: 'Subscription Due Tomorrow',
          message: `Your ${sub.name} subscription ($${sub.amount.toFixed(2)}) is due tomorrow.`,
          link: '/subscriptions',
          createdAt: now.toISOString(),
        });
      } else if (diffDays > 1 && diffDays <= 3) {
        notifications.push({
          id: `sub-due-soon-${sub.id}`,
          type: 'SUBSCRIPTION_DUE',
          level: 'info',
          title: 'Upcoming Subscription',
          message: `Your ${sub.name} payment of $${sub.amount.toFixed(2)} is due in ${diffDays} days.`,
          link: '/subscriptions',
          createdAt: now.toISOString(),
        });
      }
    });

    // 3. Savings Goal Milestones
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
    });

    goals.forEach((g) => {
      if (g.targetAmount > 0) {
        const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
        if (pct >= 100) {
          notifications.push({
            id: `goal-completed-${g.id}`,
            type: 'GOAL_MILESTONE',
            level: 'success',
            title: 'Goal Achieved!',
            message: `Congratulations! You reached 100% of your savings goal: "${g.name}".`,
            link: '/goals',
            createdAt: now.toISOString(),
          });
        } else if (pct >= 50 && pct < 100) {
          notifications.push({
            id: `goal-milestone-${g.id}`,
            type: 'GOAL_MILESTONE',
            level: 'info',
            title: 'Savings Progress',
            message: `Your savings goal "${g.name}" is ${pct}% complete!`,
            link: '/goals',
            createdAt: now.toISOString(),
          });
        }
      }
    });

    return notifications;
  }
}
