import { Request, Response, NextFunction } from 'express';
import { GoalService } from '../services/goalService.js';
import { sendSuccess } from '../utils/response.js';

export class GoalController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const goals = await GoalService.getGoals(req.user!.id);
      return sendSuccess(res, goals, 'Savings goals retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await GoalService.getGoalById(req.user!.id, req.params.id);
      return sendSuccess(res, goal, 'Savings goal retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await GoalService.createGoal(req.user!.id, req.body);
      return sendSuccess(res, goal, 'Savings goal created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await GoalService.updateGoal(req.user!.id, req.params.id, req.body);
      return sendSuccess(res, updated, 'Savings goal updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async adjustMoney(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, operation } = req.body;
      const updated = await GoalService.adjustGoalMoney(req.user!.id, req.params.id, amount, operation);
      return sendSuccess(
        res,
        updated,
        operation === 'ADD' ? 'Funds added to goal successfully' : 'Funds withdrawn from goal successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GoalService.deleteGoal(req.user!.id, req.params.id);
      return sendSuccess(res, result, 'Savings goal deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
