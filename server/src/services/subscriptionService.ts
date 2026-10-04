import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class SubscriptionService {
  static async getSubscriptions(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { nextPaymentDate: 'asc' },
    });

    const now = new Date();
    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;

    const enriched = subscriptions.map((sub) => {
      let monthlyRate = 0;
      if (sub.status === 'ACTIVE') {
        switch (sub.billingCycle) {
          case 'WEEKLY':
            monthlyRate = sub.amount * (52 / 12);
            break;
          case 'MONTHLY':
            monthlyRate = sub.amount;
            break;
          case 'QUARTERLY':
            monthlyRate = sub.amount / 3;
            break;
          case 'YEARLY':
            monthlyRate = sub.amount / 12;
            break;
        }
      }

      const yearlyRate = monthlyRate * 12;
      totalMonthlyCost += monthlyRate;
      totalYearlyCost += yearlyRate;

      const diffTime = sub.nextPaymentDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isDueSoon = sub.status === 'ACTIVE' && daysUntilDue >= 0 && daysUntilDue <= 7;

      return {
        ...sub,
        monthlyNormalized: Math.round(monthlyRate * 100) / 100,
        yearlyNormalized: Math.round(yearlyRate * 100) / 100,
        daysUntilDue,
        isDueSoon,
      };
    });

    return {
      subscriptions: enriched,
      metrics: {
        totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
        totalYearlyCost: Math.round(totalYearlyCost * 100) / 100,
        activeCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
        upcomingCount: enriched.filter((s) => s.isDueSoon).length,
      },
    };
  }

  static async createSubscription(
    userId: string,
    data: {
      name: string;
      amount: number;
      billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      nextPaymentDate: string;
      categoryId: string;
      status?: 'ACTIVE' | 'CANCELLED' | 'PAUSED';
    }
  ) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null, isDefault: true }],
      },
    });

    if (!category) {
      throw new BadRequestError('Invalid category');
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name: data.name.trim(),
        amount: Math.round(data.amount * 100) / 100,
        billingCycle: data.billingCycle,
        nextPaymentDate: new Date(data.nextPaymentDate),
        categoryId: data.categoryId,
        status: data.status || 'ACTIVE',
      },
      include: {
        category: true,
      },
    });

    return subscription;
  }

  static async updateSubscription(
    userId: string,
    id: string,
    data: {
      name?: string;
      amount?: number;
      billingCycle?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      nextPaymentDate?: string;
      categoryId?: string;
      status?: 'ACTIVE' | 'CANCELLED' | 'PAUSED';
    }
  ) {
    const existing = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Subscription not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId }, { userId: null, isDefault: true }],
        },
      });
      if (!category) {
        throw new BadRequestError('Invalid category');
      }
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.amount !== undefined && { amount: Math.round(data.amount * 100) / 100 }),
        ...(data.billingCycle && { billingCycle: data.billingCycle }),
        ...(data.nextPaymentDate && { nextPaymentDate: new Date(data.nextPaymentDate) }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.status && { status: data.status }),
      },
      include: {
        category: true,
      },
    });

    return updated;
  }

  static async deleteSubscription(userId: string, id: string) {
    const existing = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Subscription not found');
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
  }
}
