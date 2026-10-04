import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class GoalService {
  static async getGoals(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return goals.map((goal) => {
      const remaining = Math.max(0, Math.round((goal.targetAmount - goal.currentAmount) * 100) / 100);
      const percentage = goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0;
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      
      let daysRemaining: number | null = null;
      if (goal.deadline) {
        const diff = goal.deadline.getTime() - now.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        ...goal,
        remaining,
        percentage,
        isCompleted,
        daysRemaining,
      };
    });
  }

  static async getGoalById(userId: string, id: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundError('Savings goal not found');
    }

    const remaining = Math.max(0, Math.round((goal.targetAmount - goal.currentAmount) * 100) / 100);
    const percentage = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

    return {
      ...goal,
      remaining,
      percentage,
      isCompleted: goal.currentAmount >= goal.targetAmount,
    };
  }

  static async createGoal(
    userId: string,
    data: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      deadline?: string | null;
      description?: string | null;
    }
  ) {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name.trim(),
        targetAmount: Math.round(data.targetAmount * 100) / 100,
        currentAmount: data.currentAmount ? Math.round(data.currentAmount * 100) / 100 : 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
        description: data.description?.trim() || null,
      },
    });

    return goal;
  }

  static async updateGoal(
    userId: string,
    id: string,
    data: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      deadline?: string | null;
      description?: string | null;
    }
  ) {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Savings goal not found');
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.targetAmount !== undefined && { targetAmount: Math.round(data.targetAmount * 100) / 100 }),
        ...(data.currentAmount !== undefined && { currentAmount: Math.round(data.currentAmount * 100) / 100 }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });

    return updated;
  }

  static async adjustGoalMoney(
    userId: string,
    id: string,
    amount: number,
    operation: 'ADD' | 'WITHDRAW'
  ) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundError('Savings goal not found');
    }

    let newCurrent = goal.currentAmount;
    if (operation === 'ADD') {
      newCurrent += amount;
    } else {
      if (goal.currentAmount < amount) {
        throw new BadRequestError('Cannot withdraw more than current saved amount');
      }
      newCurrent -= amount;
    }

    newCurrent = Math.round(newCurrent * 100) / 100;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newCurrent },
    });

    return updated;
  }

  static async deleteGoal(userId: string, id: string) {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Savings goal not found');
    }

    await prisma.savingsGoal.delete({
      where: { id },
    });

    return { message: 'Savings goal deleted successfully' };
  }
}
