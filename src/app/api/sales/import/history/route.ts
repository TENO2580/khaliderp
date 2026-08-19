import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const module = url.searchParams.get('module') || 'ORDERS';
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.importHistory.findMany({
        where: { module },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          importId: true,
          module: true,
          fileName: true,
          fileSize: true,
          status: true,
          totalRows: true,
          createdCount: true,
          updatedCount: true,
          skippedCount: true,
          failedCount: true,
          mode: true,
          mappingUsed: true,
          summary: true,
          userName: true,
          createdAt: true,
        },
      }),
      prisma.importHistory.count({ where: { module } }),
    ]);

    return jsonResponse({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch import history', 500);
  }
}
