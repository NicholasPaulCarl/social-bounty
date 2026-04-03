import { Module, forwardRef } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionLifecycleScheduler } from './subscription-lifecycle.scheduler';

@Module({
  imports: [forwardRef(() => InboxModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionLifecycleScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
