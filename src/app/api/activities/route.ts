import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25'), 1), 500);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const moduleParam = searchParams.get('module')?.trim() || '';
    const actionParam = searchParams.get('action')?.trim() || '';
    const userId = searchParams.get('userId')?.trim() || '';
    const startDate = searchParams.get('startDate')?.trim() || '';
    const endDate = searchParams.get('endDate')?.trim() || '';

    // Build Prisma where filter
    const where: any = {};

    if (moduleParam && moduleParam !== 'ALL') {
      where.module = { equals: moduleParam, mode: 'insensitive' };
    }

    if (actionParam && actionParam !== 'ALL') {
      where.action = actionParam.toUpperCase();
    }

    if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { referenceId: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [activities, total, stats] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
      // Aggregate activity types across the entire database or filtered range
      Promise.all([
        prisma.activityLog.count({ where: { action: 'LOGIN' } }),
        prisma.activityLog.count({ where: { action: 'CREATED' } }),
        prisma.activityLog.count({ where: { action: 'DELETED' } }),
        prisma.activityLog.count({ where: { action: 'UPDATED' } }),
      ]),
    ]);

    const [loginsCount, createdCount, deletedCount, updatedCount] = stats;

    return jsonResponse({
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalActivities: total,
        logins: loginsCount,
        created: createdCount,
        deleted: deletedCount,
        updated: updatedCount,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch activities:', err);
    return errorResponse(err.message || 'Failed to fetch activities', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error) return error;

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return errorResponse('Only administrators can clear activity logs', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const olderThanDays = searchParams.get('days');

    if (id) {
      await prisma.activityLog.delete({ where: { id } });
      return jsonResponse({ success: true, message: 'Activity log deleted' });
    }

    if (olderThanDays) {
      const days = parseInt(olderThanDays);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      return jsonResponse({
        success: true,
        message: `Deleted ${result.count} logs older than ${days} days`,
      });
    }

    return errorResponse('Specify an id or days parameter', 400);
  } catch (err: any) {
    console.error('Failed to delete activity logs:', err);
    return errorResponse(err.message || 'Failed to delete activity logs', 500);
  }
}
