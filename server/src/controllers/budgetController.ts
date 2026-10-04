import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService.js';
import { sendSuccess } from '../utils/response.js';

export class BudgetController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const budgets = await BudgetService.getBudgets(req.user!.id, month, year);
      return sendSuccess(res, budgets, 'Budgets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const budget = await BudgetService.createBudget(req.user!.id, req.body);
      return sendSuccess(res, budget, 'Budget created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BudgetService.updateBudget(req.user!.id, req.params.id, req.body.amount);
      return sendSuccess(res, updated, 'Budget updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BudgetService.deleteBudget(req.user!.id, req.params.id);
      return sendSuccess(res, result, 'Budget deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
