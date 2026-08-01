import prisma from '@/lib/db';
import { UserRole, NotificationPriority, NotificationModule } from '@prisma/client';

export interface CreateNotificationParams {
  companyId?: string;
  branchId?: string;
  userId?: string;
  role?: UserRole;
  module: NotificationModule;
  category: string;
  priority?: NotificationPriority;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  link?: string;
  icon?: string;
  color?: string;
  createdById?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationParams) {
    if (!data.userId && !data.role) {
      throw new Error('Notification must be targeted to a user or a role');
    }

    return await prisma.notification.create({
      data: {
        ...data,
        priority: data.priority || 'MEDIUM',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  /**
   * Broadcast a notification to multiple users based on a role
   * For extremely large userbases, this might need background job queueing,
   * but targeting by role directly works nicely since we can just create a single role-based notification.
   */
  static async broadcastToRole(role: UserRole, data: Omit<CreateNotificationParams, 'role' | 'userId'>) {
    // Instead of creating one notification per user, we create one notification targeted to the role.
    // The query layer handles showing it to users with this role.
    return await prisma.notification.create({
      data: {
        ...data,
        role,
        priority: data.priority || 'MEDIUM',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id,
        // Optional security: verify it belongs to user OR user's role
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Archive a notification
   */
  static async archive(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  /**
   * Delete a notification
   */
  static async delete(id: string) {
    return await prisma.notification.delete({
      where: { id },
    });
  }
}
