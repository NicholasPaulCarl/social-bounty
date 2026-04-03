import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConversationsService } from '../conversations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  ConversationContext,
  SubscriptionTier,
  INBOX_CONSTANTS,
} from '@social-bounty/shared';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prisma: any;
  let subscriptionsService: { getActiveTier: jest.Mock };

  // ── Fixtures ──────────────────────────────────────────

  const userId = 'user-1';
  const otherUserId = 'user-2';
  const convId = 'conv-1';
  const now = new Date('2026-03-01T12:00:00.000Z');

  const mockConversation = {
    id: convId,
    context: ConversationContext.BOUNTY,
    referenceType: 'Bounty',
    referenceId: 'bounty-1',
    subject: 'Test Conversation',
    createdBy: userId,
    isPriority: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    participants: [
      {
        id: 'cp-1',
        conversationId: convId,
        userId,
        lastReadAt: now,
        user: { id: userId, firstName: 'Alice', lastName: 'Smith', role: 'PARTICIPANT' },
      },
      {
        id: 'cp-2',
        conversationId: convId,
        userId: otherUserId,
        lastReadAt: null,
        user: { id: otherUserId, firstName: 'Bob', lastName: 'Jones', role: 'BUSINESS_ADMIN' },
      },
    ],
    messages: [
      {
        id: 'msg-1',
        conversationId: convId,
        senderId: userId,
        body: 'Hello',
        attachmentUrl: null,
        attachmentName: null,
        isSystemMessage: false,
        editedAt: null,
        deletedAt: null,
        createdAt: now,
        sender: { id: userId, firstName: 'Alice', lastName: 'Smith' },
      },
    ],
  };

  const mockParticipantRecord = {
    id: 'cp-1',
    conversationId: convId,
    userId,
    lastReadAt: now,
  };

  // ── Setup ─────────────────────────────────────────────

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      conversation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      conversationParticipant: {
        create: jest.fn(),
        createMany: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    subscriptionsService = {
      getActiveTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  // ── createConversation ────────────────────────────────

  describe('createConversation', () => {
    const baseDto = {
      context: ConversationContext.BOUNTY,
      referenceType: 'Bounty',
      referenceId: 'bounty-1',
      subject: 'Test Conversation',
      initialMessage: 'Hello there',
      participantIds: [otherUserId],
    };

    it('should create a conversation with participants and initial message', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: otherUserId }]);
      const createdConv = { id: convId, ...baseDto, createdBy: userId, isPriority: false };
      prisma.conversation.create.mockResolvedValue(createdConv);
      prisma.conversationParticipant.create.mockResolvedValue({});
      prisma.conversationParticipant.createMany.mockResolvedValue({ count: 1 });
      prisma.message.create.mockResolvedValue({});

      // getConversation lookup (called at end of createConversation)
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.createConversation(userId, baseDto);

      expect(result.id).toBe(convId);
      expect(result.subject).toBe('Test Conversation');
      expect(result.messages).toHaveLength(1);
      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: 'Test Conversation',
            createdBy: userId,
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid participant IDs', async () => {
      prisma.user.findMany.mockResolvedValue([]); // none found

      await expect(
        service.createConversation(userId, {
          ...baseDto,
          participantIds: ['invalid-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not add creator twice if included in participantIds', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: userId }, { id: otherUserId }]);
      const createdConv = { id: convId, createdBy: userId, isPriority: false };
      prisma.conversation.create.mockResolvedValue(createdConv);
      prisma.conversationParticipant.create.mockResolvedValue({});
      prisma.conversationParticipant.createMany.mockResolvedValue({ count: 1 });
      prisma.message.create.mockResolvedValue({});
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await service.createConversation(userId, {
        ...baseDto,
        participantIds: [userId, otherUserId],
      });

      // createMany should only include otherUserId (creator excluded)
      expect(prisma.conversationParticipant.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ userId: otherUserId })],
      });
    });

    it('should set isPriority=true for SUPPORT context when user is PRO tier', async () => {
      subscriptionsService.getActiveTier.mockResolvedValue(SubscriptionTier.PRO);
      prisma.user.findMany.mockResolvedValue([]);
      const createdConv = { id: convId, createdBy: userId, isPriority: true };
      prisma.conversation.create.mockResolvedValue(createdConv);
      prisma.conversationParticipant.create.mockResolvedValue({});
      prisma.message.create.mockResolvedValue({});
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        isPriority: true,
        context: ConversationContext.SUPPORT,
      });

      await service.createConversation(userId, {
        context: ConversationContext.SUPPORT,
        subject: 'Help needed',
        initialMessage: 'I need support',
      });

      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPriority: true }),
        }),
      );
    });

    it('should set isPriority=false for SUPPORT context when user is FREE tier', async () => {
      subscriptionsService.getActiveTier.mockResolvedValue(SubscriptionTier.FREE);
      prisma.user.findMany.mockResolvedValue([]);
      const createdConv = { id: convId, createdBy: userId, isPriority: false };
      prisma.conversation.create.mockResolvedValue(createdConv);
      prisma.conversationParticipant.create.mockResolvedValue({});
      prisma.message.create.mockResolvedValue({});
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await service.createConversation(userId, {
        context: ConversationContext.SUPPORT,
        subject: 'Help needed',
        initialMessage: 'I need support',
      });

      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPriority: false }),
        }),
      );
    });

    it('should work with no participantIds (empty array default)', async () => {
      const createdConv = { id: convId, createdBy: userId, isPriority: false };
      prisma.conversation.create.mockResolvedValue(createdConv);
      prisma.conversationParticipant.create.mockResolvedValue({});
      prisma.message.create.mockResolvedValue({});
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.createConversation(userId, {
        context: ConversationContext.BOUNTY,
        subject: 'Solo thread',
        initialMessage: 'Just me',
      });

      expect(result.id).toBe(convId);
      expect(prisma.conversationParticipant.createMany).not.toHaveBeenCalled();
    });
  });

  // ── listConversations ─────────────────────────────────

  describe('listConversations', () => {
    it('should return empty result when user has no conversations', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const result = await service.listConversations(userId, {});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return paginated conversations with unread counts', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: convId, lastReadAt: now },
      ]);

      const convWithRelations = {
        ...mockConversation,
        messages: [
          {
            body: 'Latest message',
            createdAt: now,
            deletedAt: null,
          },
        ],
      };

      prisma.conversation.findMany.mockResolvedValue([convWithRelations]);
      prisma.conversation.count.mockResolvedValue(1);
      prisma.message.count.mockResolvedValue(2); // 2 unread

      const result = await service.listConversations(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(convId);
      expect(result.data[0].unreadCount).toBe(2);
      expect(result.data[0].lastMessage).toBe('Latest message');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should use default pagination when no params are provided', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: convId, lastReadAt: now },
      ]);
      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.conversation.count.mockResolvedValue(0);

      const result = await service.listConversations(userId, {});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20); // PAGINATION_DEFAULTS.LIMIT
    });

    it('should handle conversations with no messages', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: convId, lastReadAt: now },
      ]);

      const convNoMessages = {
        ...mockConversation,
        messages: [],
      };

      prisma.conversation.findMany.mockResolvedValue([convNoMessages]);
      prisma.conversation.count.mockResolvedValue(1);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.listConversations(userId, {});

      expect(result.data[0].lastMessage).toBeNull();
      expect(result.data[0].lastMessageAt).toBeNull();
    });
  });

  // ── getConversation ───────────────────────────────────

  describe('getConversation', () => {
    it('should return a conversation with messages and participants', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.getConversation(convId, userId);

      expect(result.id).toBe(convId);
      expect(result.subject).toBe('Test Conversation');
      expect(result.participants).toHaveLength(2);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].senderName).toBe('Alice Smith');
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversation(convId, 'stranger-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversation('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should show "[Message deleted]" for deleted messages', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        messages: [
          {
            ...mockConversation.messages[0],
            deletedAt: now,
            body: 'Secret message',
          },
        ],
      });

      const result = await service.getConversation(convId, userId);

      expect(result.messages[0].body).toBe('[Message deleted]');
    });
  });

  // ── sendMessage ───────────────────────────────────────

  describe('sendMessage', () => {
    it('should send a message in a conversation', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.message.count.mockResolvedValue(0); // no recent messages
      const createdMessage = {
        id: 'msg-2',
        conversationId: convId,
        senderId: userId,
        body: 'New message',
        attachmentUrl: null,
        attachmentName: null,
        isSystemMessage: false,
        editedAt: null,
        deletedAt: null,
        createdAt: now,
        sender: { id: userId, firstName: 'Alice', lastName: 'Smith' },
      };
      prisma.message.create.mockResolvedValue(createdMessage);
      prisma.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage(convId, userId, 'New message');

      expect(result.id).toBe('msg-2');
      expect(result.body).toBe('New message');
      expect(result.senderName).toBe('Alice Smith');
      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: convId },
          data: expect.objectContaining({ updatedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage(convId, 'stranger-id', 'Hello'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when rate limit is exceeded', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.message.count.mockResolvedValue(INBOX_CONSTANTS.MESSAGE_RATE_LIMIT_PER_HOUR);

      await expect(
        service.sendMessage(convId, userId, 'Spam'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow sending when under rate limit', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.message.count.mockResolvedValue(INBOX_CONSTANTS.MESSAGE_RATE_LIMIT_PER_HOUR - 1);
      const createdMessage = {
        id: 'msg-3',
        conversationId: convId,
        senderId: userId,
        body: 'Under limit',
        attachmentUrl: null,
        attachmentName: null,
        isSystemMessage: false,
        editedAt: null,
        deletedAt: null,
        createdAt: now,
        sender: { id: userId, firstName: 'Alice', lastName: 'Smith' },
      };
      prisma.message.create.mockResolvedValue(createdMessage);
      prisma.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage(convId, userId, 'Under limit');

      expect(result.body).toBe('Under limit');
    });

    it('should trim message body', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.message.count.mockResolvedValue(0);
      const createdMessage = {
        id: 'msg-4',
        conversationId: convId,
        senderId: userId,
        body: 'Trimmed',
        attachmentUrl: null,
        attachmentName: null,
        isSystemMessage: false,
        editedAt: null,
        deletedAt: null,
        createdAt: now,
        sender: { id: userId, firstName: 'Alice', lastName: 'Smith' },
      };
      prisma.message.create.mockResolvedValue(createdMessage);
      prisma.conversation.update.mockResolvedValue({});

      await service.sendMessage(convId, userId, '  Trimmed  ');

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ body: 'Trimmed' }),
        }),
      );
    });
  });

  // ── markConversationRead ──────────────────────────────

  describe('markConversationRead', () => {
    it('should update lastReadAt for the participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(mockParticipantRecord);
      prisma.conversationParticipant.update.mockResolvedValue({});

      const result = await service.markConversationRead(convId, userId);

      expect(result.message).toBe('Conversation marked as read');
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cp-1' },
          data: { lastReadAt: expect.any(Date) },
        }),
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.markConversationRead(convId, 'stranger-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── editMessage ───────────────────────────────────────

  describe('editMessage', () => {
    const recentMessage = {
      id: 'msg-1',
      conversationId: convId,
      senderId: userId,
      body: 'Original',
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(), // just now
    };

    it('should edit a message within the edit window', async () => {
      prisma.message.findUnique.mockResolvedValue(recentMessage);
      const updatedMessage = {
        ...recentMessage,
        body: 'Edited body',
        editedAt: new Date(),
        attachmentUrl: null,
        attachmentName: null,
        isSystemMessage: false,
        sender: { id: userId, firstName: 'Alice', lastName: 'Smith' },
      };
      prisma.message.update.mockResolvedValue(updatedMessage);

      const result = await service.editMessage('msg-1', userId, 'Edited body');

      expect(result.body).toBe('Edited body');
      expect(result.editedAt).toBeDefined();
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.editMessage('nonexistent', userId, 'Edit'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prisma.message.findUnique.mockResolvedValue(recentMessage);

      await expect(
        service.editMessage('msg-1', 'other-user', 'Edit'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if message is deleted', async () => {
      prisma.message.findUnique.mockResolvedValue({
        ...recentMessage,
        deletedAt: now,
      });

      await expect(
        service.editMessage('msg-1', userId, 'Edit'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if edit window has passed', async () => {
      const oldMessage = {
        ...recentMessage,
        createdAt: new Date(Date.now() - (INBOX_CONSTANTS.MESSAGE_EDIT_WINDOW_MINUTES + 1) * 60 * 1000),
      };
      prisma.message.findUnique.mockResolvedValue(oldMessage);

      await expect(
        service.editMessage('msg-1', userId, 'Late edit'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── deleteMessage ─────────────────────────────────────

  describe('deleteMessage', () => {
    const existingMessage = {
      id: 'msg-1',
      senderId: userId,
      deletedAt: null,
    };

    it('should soft-delete a message', async () => {
      prisma.message.findUnique.mockResolvedValue(existingMessage);
      prisma.message.update.mockResolvedValue({});

      const result = await service.deleteMessage('msg-1', userId);

      expect(result.message).toBe('Message deleted successfully');
      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteMessage('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prisma.message.findUnique.mockResolvedValue(existingMessage);

      await expect(
        service.deleteMessage('msg-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already deleted', async () => {
      prisma.message.findUnique.mockResolvedValue({
        ...existingMessage,
        deletedAt: now,
      });

      await expect(
        service.deleteMessage('msg-1', userId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
