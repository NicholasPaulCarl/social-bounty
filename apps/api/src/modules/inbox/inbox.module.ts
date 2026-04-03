import { Module, forwardRef } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { NotificationsService } from './notifications.service';
import { ConversationsService } from './conversations.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [forwardRef(() => SubscriptionsModule)],
  controllers: [InboxController],
  providers: [NotificationsService, ConversationsService],
  exports: [NotificationsService, ConversationsService],
})
export class InboxModule {}
