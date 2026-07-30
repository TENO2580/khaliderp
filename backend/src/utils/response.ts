import { Response } from 'express';

/**
 * Standardized success response
 */
export function successResponse(res: Response, data: unknown, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standardized error response
 */
export function errorResponse(res: Response, message = 'Internal Server Error', statusCode = 500, errors?: unknown) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * Created response (201)
 */
export function createdResponse(res: Response, data: unknown, message = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

/**
 * No content response (204)
 */
export function noContentResponse(res: Response) {
  return res.status(204).send();
}
