import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { sendSuccess } from '../utils/response.js';

export class SubscriptionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.getSubscriptions(req.user!.id);
      return sendSuccess(res, result, 'Subscriptions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.createSubscription(req.user!.id, req.body);
      return sendSuccess(res, subscription, 'Subscription created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SubscriptionService.updateSubscription(req.user!.id, req.params.id, req.body);
      return sendSuccess(res, updated, 'Subscription updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.deleteSubscription(req.user!.id, req.params.id);
      return sendSuccess(res, result, 'Subscription deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
