import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { prisma } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { logAudit } from './auditService.js';

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', type: 'EXPENSE' as const },
  { name: 'Travel & Transport', icon: 'Plane', type: 'EXPENSE' as const },
  { name: 'Shopping', icon: 'ShoppingBag', type: 'EXPENSE' as const },
  { name: 'Bills & Utilities', icon: 'Receipt', type: 'EXPENSE' as const },
  { name: 'Education', icon: 'GraduationCap', type: 'EXPENSE' as const },
  { name: 'Entertainment', icon: 'Film', type: 'EXPENSE' as const },
  { name: 'Healthcare', icon: 'Activity', type: 'EXPENSE' as const },
  { name: 'Housing & Rent', icon: 'Home', type: 'EXPENSE' as const },
  { name: 'Other Expense', icon: 'MoreHorizontal', type: 'EXPENSE' as const },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', type: 'INCOME' as const },
  { name: 'Freelance', icon: 'Laptop', type: 'INCOME' as const },
  { name: 'Business', icon: 'TrendingUp', type: 'INCOME' as const },
  { name: 'Investment', icon: 'PieChart', type: 'INCOME' as const },
  { name: 'Gift', icon: 'Gift', type: 'INCOME' as const },
  { name: 'Other Income', icon: 'DollarSign', type: 'INCOME' as const },
];

export class AuthService {
  static async register(data: { name: string; email: string; password: string }, req?: Request) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create user and initialize default categories in a single transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          currency: 'USD',
        },
      });

      // Seed personal default categories for the new user
      const defaultCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((c) => ({
        userId: newUser.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        isDefault: true,
      }));

      await tx.category.createMany({
        data: defaultCategories,
      });

      return newUser;
    });

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      req,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: { email: string; password: string }, req?: Request) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      req,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const incomingHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: incomingHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      // Possible reuse attack: revoke all tokens for this user if compromised
      if (storedToken?.revoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId },
          data: { revoked: true },
        });
      }
      throw new UnauthorizedError('Refresh token revoked or invalid');
    }

    // Generate new token pair (refresh token rotation)
    const newAccessToken = signAccessToken({ userId: storedToken.user.id, email: storedToken.user.email });
    const newRefreshToken = signRefreshToken({ userId: storedToken.user.id, email: storedToken.user.email });
    const newHash = hashToken(newRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revoked: true,
          replacedByToken: newHash,
        },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newHash,
          userId: storedToken.user.id,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken?: string, userId?: string, req?: Request) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }

    if (userId) {
      await logAudit({
        userId,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: userId,
        req,
      });
    }
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, data: { name?: string; currency?: string }, req?: Request) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit({
      userId,
      action: 'PROFILE_UPDATED',
      entity: 'User',
      entityId: userId,
      req,
    });

    return updated;
  }

  static async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
    req?: Request
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Invalidate all existing sessions/refresh tokens upon password change
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      }),
    ]);

    await logAudit({
      userId,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: userId,
      req,
    });

    return { message: 'Password updated successfully. Please log in again.' };
  }
}
