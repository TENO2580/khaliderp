import { Request, Response, NextFunction } from 'express';
import { PERMISSIONS, ROLE_HIERARCHY } from '../config/constants';
import { errorResponse } from '../utils/response';

/**
 * Role-based access control middleware
 * Checks if the user's role has the required permission
 *
 * Usage:
 *   authorize('customers:read')
 *   authorize('customers:create')
 *   authorize('customers:*')
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || [];

    // Admin has wildcard access
    if (userPermissions.includes('*')) {
      next();
      return;
    }

    const hasPermission = requiredPermissions.every((required) => {
      // Direct match
      if (userPermissions.includes(required)) return true;

      // Wildcard match: 'customers:*' matches 'customers:read'
      const [module] = required.split(':');
      if (userPermissions.includes(`${module}:*`)) return true;

      // Category wildcard: 'reports:*' matches 'reports:sales'
      return false;
    });

    if (!hasPermission) {
      errorResponse(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}

/**
 * Check minimum role level
 * Useful for simple role-based guards without granular permissions
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(res, 'Insufficient role level', 403);
      return;
    }

    next();
  };
}
