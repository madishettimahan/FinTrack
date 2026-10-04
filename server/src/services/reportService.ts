import { prisma } from '../config/db.js';

export class ReportService {
  static resolveDateRange(range: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let start: Date;
    let end: Date = new Date();

    switch (range) {
      case 'this-month':
        start = new Date(Date.UTC(currentYear, currentMonth, 1));
        end = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        break;
      case 'last-month':
        start = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        end = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
        break;
      case 'last-3-months':
        start = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
        end = new Date();
        break;
      case 'last-6-months':
        start = new Date(Date.UTC(currentYear, currentMonth - 5, 1));
        end = new Date();
        break;
      case 'this-year':
        start = new Date(Date.UTC(currentYear, 0, 1));
        end = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(Date.UTC(currentYear, currentMonth, 1));
        end = customEnd ? new Date(customEnd) : new Date();
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(Date.UTC(currentYear, currentMonth, 1));
        end = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    }

    return { start, end };
  }

  static async generateReport(
    userId: string,
    range = 'this-month',
    customStart?: string,
    customEnd?: string
  ) {
    const { start, end } = this.resolveDateRange(range, customStart, customEnd);

    // Fetch transactions in range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryMap = new Map<string, { name: string; type: string; total: number }>();
    const paymentMethodMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
      }

      // Category breakdown
      const catKey = tx.categoryId;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          name: tx.category.name,
          type: tx.category.type,
          total: 0,
        });
      }
      categoryMap.get(catKey)!.total += tx.amount;

      // Payment method breakdown
      const pm = tx.paymentMethod || 'OTHER';
      paymentMethodMap.set(pm, (paymentMethodMap.get(pm) || 0) + tx.amount);
    });

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((item) => {
        const rounded = Math.round(item.total * 100) / 100;
        const totalBase = item.type === 'INCOME' ? totalIncome : totalExpenses;
        const percentage = totalBase > 0 ? Math.round((rounded / totalBase) * 100) : 0;
        return {
          name: item.name,
          type: item.type,
          amount: rounded,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const paymentMethodBreakdown = Array.from(paymentMethodMap.entries()).map(([method, amount]) => ({
      method,
      amount: Math.round(amount * 100) / 100,
    }));

    return {
      period: {
        range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: transactions.length,
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        category: t.category.name,
        type: t.type,
        amount: t.amount,
        paymentMethod: t.paymentMethod,
      })),
    };
  }

  static async exportToCsv(
    userId: string,
    range = 'this-month',
    customStart?: string,
    customEnd?: string
  ) {
    const report = await this.generateReport(userId, range, customStart, customEnd);

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Method'];
    const rows = report.transactions.map((tx) => [
      `"${tx.date}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.type}"`,
      tx.amount.toFixed(2),
      `"${tx.paymentMethod.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}
