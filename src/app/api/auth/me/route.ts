import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;
  return jsonResponse(user);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { avatar } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    return jsonResponse(updatedUser);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update profile', 500);
  }
}
