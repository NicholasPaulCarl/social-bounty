import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { NotificationsService } from './notifications.service';
import { ConversationsService } from './conversations.service';

@Module({
  controllers: [InboxController],
  providers: [NotificationsService, ConversationsService],
  exports: [NotificationsService, ConversationsService],
})
export class InboxModule {}
