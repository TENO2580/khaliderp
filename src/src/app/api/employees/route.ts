import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
  });

  return jsonResponse({ data: employees });
}
