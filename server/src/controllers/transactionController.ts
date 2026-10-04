import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transactionService.js';
import { sendSuccess } from '../utils/response.js';

export class TransactionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TransactionService.getTransactions(req.user!.id, req.query as any);
      return sendSuccess(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionService.getTransactionById(req.user!.id, req.params.id);
      return sendSuccess(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionService.createTransaction(req.user!.id, req.body, req);
      return sendSuccess(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await TransactionService.updateTransaction(req.user!.id, req.params.id, req.body, req);
      return sendSuccess(res, updated, 'Transaction updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TransactionService.deleteTransaction(req.user!.id, req.params.id, req);
      return sendSuccess(res, result, 'Transaction deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
