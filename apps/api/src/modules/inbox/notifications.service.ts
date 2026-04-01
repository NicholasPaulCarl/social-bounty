import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  NotificationType,
  PAGINATION_DEFAULTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    referenceType?: string,
    referenceId?: string,
    actionUrl?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        actionUrl: actionUrl ?? null,
      },
    });

    return this.formatResponse(notification);
  }

  async listNotifications(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      type?: NotificationType;
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }
    if (params.type) {
      where.type = params.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: data.map((n) => this.formatResponse(n)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return this.formatResponse(updated);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const [notifications, messages] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.getUnreadMessageCount(userId),
    ]);

    return {
      notifications,
      messages,
      total: notifications + messages,
    };
  }

  private async getUnreadMessageCount(userId: string): Promise<number> {
    // Count conversations where there are messages after the user's lastReadAt
    const participations =
      await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: {
          conversationId: true,
          lastReadAt: true,
        },
      });

    if (participations.length === 0) return 0;

    let unreadCount = 0;
    for (const p of participations) {
      const where: any = {
        conversationId: p.conversationId,
        senderId: { not: userId },
        deletedAt: null,
      };
      if (p.lastReadAt) {
        where.createdAt = { gt: p.lastReadAt };
      }
      const count = await this.prisma.message.count({ where });
      unreadCount += count;
    }

    return unreadCount;
  }

  private formatResponse(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
