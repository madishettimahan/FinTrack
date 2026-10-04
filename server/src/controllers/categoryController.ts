import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as 'INCOME' | 'EXPENSE' | undefined;
      const categories = await CategoryService.getCategories(req.user!.id, type);
      return sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.user!.id, req.body);
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await CategoryService.updateCategory(req.user!.id, req.params.id, req.body);
      return sendSuccess(res, updated, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.deleteCategory(req.user!.id, req.params.id);
      return sendSuccess(res, result, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
