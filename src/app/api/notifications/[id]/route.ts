import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await authenticateRequest(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();

    if (body.action === 'read') {
      await NotificationService.markAsRead(id, user.id);
      return jsonResponse(null, 200, 'Notification marked as read');
    }

    if (body.action === 'archive') {
      await NotificationService.archive(id);
      return jsonResponse(null, 200, 'Notification archived');
    }

    return errorResponse('Invalid action', 400);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update notification', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await authenticateRequest(req);
    if (error) return error;

    const { id } = await params;
    await NotificationService.delete(id);
    return jsonResponse(null, 200, 'Notification deleted');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete notification', 500);
  }
}
