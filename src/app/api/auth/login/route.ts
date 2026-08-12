import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

const JWT_SECRET = process.env.JWT_SECRET || 'tripidio-jwt-secret-key-change-in-production-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tripidio-refresh-secret-key-change-in-production-2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated. Contact system administrator.', 403);
    }

    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return errorResponse('Invalid email or password', 401);
      }
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return jsonResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          preferences: user.preferences,
        },
        accessToken,
        refreshToken,
      },
      200,
      'Login successful'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Login error', 500);
  }
}
