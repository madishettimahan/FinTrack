import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getNotifications(req.user!.id);
      return sendSuccess(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
