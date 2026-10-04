import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/response.js';

export class AnalyticsController {
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getAnalytics(req.user!.id);
      return sendSuccess(res, data, 'Analytics data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
