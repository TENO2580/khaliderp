import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

const JWT_SECRET = process.env.JWT_SECRET || 'tripidio-jwt-secret-key-change-in-production-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tripidio-refresh-secret-key-change-in-production-2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, googleId, name, avatar } = body;

    if (!email) {
      return errorResponse('Email is required for authentication', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is in the authorized users database
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    // Whitelist Enforcement: Reject unauthorized Google accounts
    if (!user) {
      return errorResponse(
        'Your Google account is not authorized to access Tripidio ERP. Please contact the system administrator.',
        403
      );
    }

    if (!user.isActive) {
      return errorResponse('Your account is deactivated. Contact system administrator.', 403);
    }

    // On first successful login: save Google ID, avatar, display name, and last login timestamp
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        name: user.name || name || normalizedEmail.split('@')[0],
        lastLoginAt: new Date(),
      },
    });

    const accessToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: updatedUser.id },
      data: { refreshToken },
    });

    return jsonResponse(
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
        },
        accessToken,
        refreshToken,
      },
      200,
      'Google authentication successful'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Google Auth Error', 500);
  }
}
