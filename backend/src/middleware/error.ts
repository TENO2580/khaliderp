import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Global error handler — catches all unhandled errors
 */
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('🔥 Error:', err);

  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  // Prisma-specific errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        errorResponse(res, `Duplicate value for field: ${prismaError.meta?.target}`, 409);
        return;
      case 'P2025':
        errorResponse(res, 'Record not found', 404);
        return;
      case 'P2003':
        errorResponse(res, 'Related record not found (foreign key violation)', 400);
        return;
      default:
        errorResponse(res, 'Database error', 500);
        return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse(res, 'Invalid token', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    errorResponse(res, 'Token expired', 401);
    return;
  }

  // Default server error
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  errorResponse(res, message, 500);
}
