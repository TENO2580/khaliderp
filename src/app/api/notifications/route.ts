import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationModule, NotificationPriority } from '@prisma/client';
import { NotificationService } from '@/lib/services/NotificationService';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(req);
    if (error) return error;

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const cursor = url.searchParams.get('cursor');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const moduleStr = url.searchParams.get('module');
    const priorityStr = url.searchParams.get('priority');

    // Build the query where clause
    const where: any = {
      OR: [
        { userId: user.id },
        { role: user.role }
      ]
    };

    if (unreadOnly) {
      where.isRead = false;
    }
    
    if (moduleStr) {
      where.module = moduleStr as NotificationModule;
    }

    if (priorityStr) {
      where.priority = priorityStr as NotificationPriority;
    }

    // Exclude archived/deleted notifications from normal views
    where.isArchived = false;

    // Fetch items
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there is a next page
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    // Get unread count for badge
    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { userId: user.id },
          { role: user.role }
        ],
        isRead: false,
        isArchived: false,
      }
    });

    return jsonResponse({
      data: notifications,
      pagination: {
        nextCursor,
        limit,
        unreadCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return errorResponse(error.message || 'Failed to fetch notifications', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(req);
    if (error) return error;

    const body = await req.json();
    
    if (body.action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: user.id },
            { role: user.role }
          ],
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      return jsonResponse(null, 200, 'All notifications marked as read');
    }

    return errorResponse('Invalid action', 400);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update notifications', 500);
  }
}
