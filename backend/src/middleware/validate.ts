import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

/**
 * Validation middleware using Zod schemas
 * Validates request body, query params, or route params
 *
 * Usage:
 *   validate(createCustomerSchema)
 *   validate(querySchema, 'query')
 *   validate(paramsSchema, 'params')
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Replace with validated/transformed data
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        errorResponse(res, 'Validation failed', 400, formattedErrors);
        return;
      }

      errorResponse(res, 'Validation error', 400);
    }
  };
}
