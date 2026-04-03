import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@social-bounty/shared';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  // ── Fixtures ──────────────────────────────────────────

  const userId = 'user-1';
  const otherUserId = 'user-2';
  const now = new Date('2026-03-01T12:00:00.000Z');

  const mockNotification = {
    id: 'notif-1',
    userId,
    type: NotificationType.SUBMISSION_APPROVED,
    title: 'Submission Approved',
    body: 'Your submission was approved',
    referenceType: 'Submission',
    referenceId: 'sub-1',
    actionUrl: '/submissions/sub-1',
    isRead: false,
    readAt: null,
    createdAt: now,
  };

  // ── Setup ─────────────────────────────────────────────

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      conversationParticipant: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      message: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ── createNotification ────────────────────────────────

  describe('createNotification', () => {
    it('should create a notification with all fields', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        userId,
        NotificationType.SUBMISSION_APPROVED,
        'Submission Approved',
        'Your submission was approved',
        'Submission',
        'sub-1',
        '/submissions/sub-1',
      );

      expect(result.id).toBe('notif-1');
      expect(result.type).toBe(NotificationType.SUBMISSION_APPROVED);
      expect(result.title).toBe('Submission Approved');
      expect(result.body).toBe('Your submission was approved');
      expect(result.referenceType).toBe('Submission');
      expect(result.referenceId).toBe('sub-1');
      expect(result.actionUrl).toBe('/submissions/sub-1');
      expect(result.isRead).toBe(false);
      expect(result.createdAt).toBe(now.toISOString());
    });

    it('should create a notification with optional fields omitted', async () => {
      const minimalNotification = {
        ...mockNotification,
        referenceType: null,
        referenceId: null,
        actionUrl: null,
      };
      prisma.notification.create.mockResolvedValue(minimalNotification);

      const result = await service.createNotification(
        userId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'System Update',
        'Platform maintenance scheduled',
      );

      expect(result.referenceType).toBeNull();
      expect(result.referenceId).toBeNull();
      expect(result.actionUrl).toBeNull();

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'System Update',
          body: 'Platform maintenance scheduled',
          referenceType: null,
          referenceId: null,
          actionUrl: null,
        }),
      });
    });
  });

  // ── listNotifications (getUserNotifications) ──────────

  describe('listNotifications', () => {
    it('should return paginated notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.listNotifications(userId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('notif-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should return empty result when no notifications exist', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.listNotifications(userId, {});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should use default pagination when no params are provided', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.listNotifications(userId, {});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20); // PAGINATION_DEFAULTS.LIMIT
    });

    it('should filter by isRead when specified', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.listNotifications(userId, { isRead: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId, isRead: false }),
        }),
      );
    });

    it('should filter by type when specified', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.listNotifications(userId, {
        type: NotificationType.NEW_MESSAGE,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            type: NotificationType.NEW_MESSAGE,
          }),
        }),
      );
    });

    it('should cap limit at MAX_LIMIT', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.listNotifications(userId, { limit: 500 });

      expect(result.meta.limit).toBe(100); // PAGINATION_DEFAULTS.MAX_LIMIT
    });
  });

  // ── markAsRead ────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      const readNotification = {
        ...mockNotification,
        isRead: true,
        readAt: now,
      };
      prisma.notification.update.mockResolvedValue(readNotification);

      const result = await service.markAsRead(userId, 'notif-1');

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        service.markAsRead(userId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: otherUserId,
      });

      await expect(
        service.markAsRead(userId, 'notif-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── markAllAsRead ─────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(userId);

      expect(result.message).toBe('All notifications marked as read');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should succeed even when there are no unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(userId);

      expect(result.message).toBe('All notifications marked as read');
    });
  });

  // ── getUnreadCount ────────────────────────────────────

  describe('getUnreadCount', () => {
    it('should return combined unread counts for notifications and messages', async () => {
      prisma.notification.count.mockResolvedValue(3);
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-1', lastReadAt: now },
        { conversationId: 'conv-2', lastReadAt: null },
      ]);
      // Two conversations: 2 unread + 1 unread
      prisma.message.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await service.getUnreadCount(userId);

      expect(result.notifications).toBe(3);
      expect(result.messages).toBe(3); // 2 + 1
      expect(result.total).toBe(6); // 3 + 3
    });

    it('should return zero messages when user has no conversations', async () => {
      prisma.notification.count.mockResolvedValue(0);
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const result = await service.getUnreadCount(userId);

      expect(result.notifications).toBe(0);
      expect(result.messages).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should count unread messages across all conversations', async () => {
      prisma.notification.count.mockResolvedValue(0);
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-1', lastReadAt: now },
      ]);
      prisma.message.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(result.messages).toBe(5);
      expect(result.total).toBe(5);
    });

    it('should handle conversation with null lastReadAt (all messages unread)', async () => {
      prisma.notification.count.mockResolvedValue(0);
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-1', lastReadAt: null },
      ]);
      prisma.message.count.mockResolvedValue(10);

      const result = await service.getUnreadCount(userId);

      // When lastReadAt is null, the where clause should not include createdAt filter
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          conversationId: 'conv-1',
          senderId: { not: userId },
          deletedAt: null,
        }),
      });
      expect(result.messages).toBe(10);
    });

    it('should filter by createdAt > lastReadAt when lastReadAt is set', async () => {
      prisma.notification.count.mockResolvedValue(0);
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-1', lastReadAt: now },
      ]);
      prisma.message.count.mockResolvedValue(2);

      await service.getUnreadCount(userId);

      expect(prisma.message.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          conversationId: 'conv-1',
          senderId: { not: userId },
          deletedAt: null,
          createdAt: { gt: now },
        }),
      });
    });
  });
});
