import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  PAGINATION_DEFAULTS,
  INBOX_CONSTANTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private prisma: PrismaService) {}

  async createConversation(
    userId: string,
    dto: {
      context: string;
      referenceType?: string;
      referenceId?: string;
      subject: string;
      initialMessage: string;
      participantIds?: string[];
    },
  ) {
    // Validate participant IDs exist
    const participantIds = dto.participantIds ?? [];
    if (participantIds.length > 0) {
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingUsers.map((u) => u.id));
      const invalid = participantIds.filter((id) => !existingIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Invalid participant IDs: ${invalid.join(', ')}`,
        );
      }
    }

    const conversation = await this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          context: dto.context as any,
          referenceType: dto.referenceType ?? null,
          referenceId: dto.referenceId ?? null,
          subject: dto.subject.trim(),
          createdBy: userId,
        },
      });

      // Add creator as participant
      await tx.conversationParticipant.create({
        data: {
          conversationId: conv.id,
          userId,
          lastReadAt: new Date(),
        },
      });

      // Add other participants
      const otherParticipants = participantIds.filter((id) => id !== userId);
      if (otherParticipants.length > 0) {
        await tx.conversationParticipant.createMany({
          data: otherParticipants.map((pId) => ({
            conversationId: conv.id,
            userId: pId,
          })),
        });
      }

      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderId: userId,
          body: dto.initialMessage.trim(),
        },
      });

      return conv;
    });

    return this.getConversation(conversation.id, userId);
  }

  async listConversations(
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    // Get conversations the user participates in
    const participantConvIds =
      await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true, lastReadAt: true },
      });

    const convIdMap = new Map(
      participantConvIds.map((p) => [p.conversationId, p.lastReadAt]),
    );
    const convIds = Array.from(convIdMap.keys());

    if (convIds.length === 0) {
      return {
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where = { id: { in: convIds }, isArchived: false };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const data = await Promise.all(
      conversations.map(async (conv) => {
        const lastReadAt = convIdMap.get(conv.id);
        const unreadWhere: any = {
          conversationId: conv.id,
          senderId: { not: userId },
          deletedAt: null,
        };
        if (lastReadAt) {
          unreadWhere.createdAt = { gt: lastReadAt };
        }
        const unreadCount = await this.prisma.message.count({
          where: unreadWhere,
        });

        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          subject: conv.subject,
          context: conv.context,
          lastMessage: lastMessage?.body ?? null,
          lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
          unreadCount,
          participants: conv.participants.map((p) => ({
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
          })),
          createdAt: conv.createdAt.toISOString(),
        };
      }),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(conversationId: string, userId: string) {
    const participant =
      await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      id: conversation.id,
      subject: conversation.subject,
      context: conversation.context,
      referenceType: conversation.referenceType,
      referenceId: conversation.referenceId,
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        role: p.user.role,
      })),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: `${m.sender.firstName} ${m.sender.lastName}`,
        body: m.deletedAt ? '[Message deleted]' : m.body,
        attachmentUrl: m.attachmentUrl,
        attachmentName: m.attachmentName,
        isSystemMessage: m.isSystemMessage,
        editedAt: m.editedAt?.toISOString() ?? null,
        deletedAt: m.deletedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  async sendMessage(conversationId: string, userId: string, body: string) {
    // Verify participant
    const participant =
      await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Rate limiting: check messages in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessages = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: userId,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentMessages >= INBOX_CONSTANTS.MESSAGE_RATE_LIMIT_PER_HOUR) {
      throw new BadRequestException(
        `Rate limit exceeded. Maximum ${INBOX_CONSTANTS.MESSAGE_RATE_LIMIT_PER_HOUR} messages per hour.`,
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: body.trim(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      isSystemMessage: message.isSystemMessage,
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async editMessage(messageId: string, userId: string, body: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Check 15-minute edit window
    const editWindowMs =
      INBOX_CONSTANTS.MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
    const elapsed = Date.now() - message.createdAt.getTime();
    if (elapsed > editWindowMs) {
      throw new BadRequestException(
        `Messages can only be edited within ${INBOX_CONSTANTS.MESSAGE_EDIT_WINDOW_MINUTES} minutes of sending`,
      );
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        body: body.trim(),
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      id: updated.id,
      senderId: updated.senderId,
      senderName: `${updated.sender.firstName} ${updated.sender.lastName}`,
      body: updated.body,
      attachmentUrl: updated.attachmentUrl,
      attachmentName: updated.attachmentName,
      isSystemMessage: updated.isSystemMessage,
      editedAt: updated.editedAt?.toISOString() ?? null,
      deletedAt: updated.deletedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.deletedAt) {
      throw new BadRequestException('Message already deleted');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Message deleted successfully' };
  }

  async markConversationRead(conversationId: string, userId: string) {
    const participant =
      await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

    return { message: 'Conversation marked as read' };
  }
}
