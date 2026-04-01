import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, NotificationType } from '@social-bounty/shared';
import { NotificationsService } from './notifications.service';
import { ConversationsService } from './conversations.service';
import {
  SendMessageDto,
  EditMessageDto,
  CreateConversationDto,
} from './dto/inbox.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class InboxController {
  constructor(
    private notificationsService: NotificationsService,
    private conversationsService: ConversationsService,
  ) {}

  // ── Unread Count ───────────────────────────────────────

  @Get('inbox/unread-count')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  // ── Notifications ──────────────────────────────────────

  @Get('notifications')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRead') isRead?: string,
    @Query('type') type?: NotificationType,
  ) {
    return this.notificationsService.listNotifications(user.sub, {
      page,
      limit,
      isRead: isRead === undefined ? undefined : isRead === 'true',
      type,
    });
  }

  @Post('notifications/:id/read')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async markNotificationAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Post('notifications/read-all')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async markAllNotificationsAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  // ── Conversations ──────────────────────────────────────

  @Get('conversations')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.listConversations(user.sub, {
      page,
      limit,
    });
  }

  @Post('conversations')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation(user.sub, dto);
  }

  @Get('conversations/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.getConversation(id, user.sub);
  }

  @Post('conversations/:id/messages')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(id, user.sub, dto.body);
  }

  @Put('conversations/:id/messages/:msgId')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async editMessage(
    @Param('msgId') msgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EditMessageDto,
  ) {
    return this.conversationsService.editMessage(
      msgId,
      user.sub,
      dto.body,
    );
  }

  @Delete('conversations/:id/messages/:msgId')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async deleteMessage(
    @Param('msgId') msgId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.deleteMessage(msgId, user.sub);
  }

  @Post('conversations/:id/read')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async markConversationRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.markConversationRead(id, user.sub);
  }
}
