import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'tripidio-jwt-secret-key-change-in-production-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tripidio-refresh-secret-key-change-in-production-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function jsonResponse(data: any, status = 200, message?: string) {
  return NextResponse.json(
    {
      success: status >= 200 && status < 300,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400, errors?: any) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

/**
 * Authenticate incoming NextRequest on Vercel Serverless
 */
export async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: errorResponse('Authentication required. Missing token.', 401) };
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return {
        user: null,
        error: errorResponse('Your account is not authorized to access Tripidio ERP.', 403),
      };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: errorResponse('Invalid or expired authentication token.', 401) };
  }
}

/**
 * Check if authenticated user has required role
 */
export function authorizeRole(user: any, allowedRoles: string[]) {
  if (allowedRoles.includes('*') || user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}
