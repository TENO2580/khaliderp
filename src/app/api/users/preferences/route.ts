import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: body
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        preferences: true
      }
    });

    return jsonResponse(updatedUser, 200, 'Preferences updated successfully');
  } catch (err: any) {
    console.error("Failed to update preferences:", err);
    return errorResponse(err.message || 'Failed to update preferences', 500);
  }
}
