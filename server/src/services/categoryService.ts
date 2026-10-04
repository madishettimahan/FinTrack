import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

export class CategoryService {
  static async getCategories(userId: string, type?: 'INCOME' | 'EXPENSE') {
    const where: any = {
      OR: [
        { userId },
        { isDefault: true, userId: null },
      ],
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return categories;
  }

  static async createCategory(
    userId: string,
    data: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string }
  ) {
    // Check if category with same name exists for this user
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: data.name, mode: 'insensitive' },
        type: data.type,
      },
    });

    if (existing) {
      throw new BadRequestError(`A ${data.type.toLowerCase()} category with this name already exists`);
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type,
        icon: data.icon || 'Tag',
        isDefault: false,
      },
    });

    return category;
  }

  static async updateCategory(
    userId: string,
    id: string,
    data: { name?: string; icon?: string }
  ) {
    const category = await prisma.category.findFirst({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.isDefault || category.userId !== userId) {
      throw new ForbiddenError('You can only modify your own custom categories');
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.icon && { icon: data.icon }),
      },
    });

    return updated;
  }

  static async deleteCategory(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.isDefault || category.userId !== userId) {
      throw new ForbiddenError('You can only delete your own custom categories');
    }

    // Check if category has transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new BadRequestError(
        `Cannot delete category: it is used by ${transactionCount} transaction(s). Reassign them first.`
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
