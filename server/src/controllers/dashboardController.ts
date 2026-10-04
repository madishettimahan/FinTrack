import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getDashboardData(req.user!.id);
      return sendSuccess(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
