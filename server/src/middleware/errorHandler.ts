import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { config } from '../config/environment.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational errors (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details ? [err.details] : []);
    return;
  }

  // Prisma Unique Constraint Error (P2002)
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    sendError(res, `A record with this ${target} already exists`, 409);
    return;
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    sendError(res, 'Record not found or already deleted', 404);
    return;
  }

  // Prisma foreign key constraint failure
  if (err.code === 'P2003') {
    sendError(res, 'Invalid reference: referenced entity does not exist', 400);
    return;
  }

  // Generic/Unknown errors
  console.error('[UNCAUGHT_ERROR]:', err);

  const message = config.nodeEnv === 'production' 
    ? 'Internal server error occurred. Please try again later.'
    : err.message || 'Internal server error';

  const errors = config.nodeEnv === 'development' && err.stack ? [{ stack: err.stack }] : [];

  sendError(res, message, 500, errors);
};
