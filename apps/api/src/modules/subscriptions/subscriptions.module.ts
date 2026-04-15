import { Module, forwardRef } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionLifecycleScheduler } from './subscription-lifecycle.scheduler';

@Module({
  // LedgerModule is wrapped in forwardRef: LedgerModule imports SubscriptionsModule
  // (ApprovalLedgerService needs SubscriptionsService for tier lookup), and
  // SubscriptionsService now depends on LedgerService for subscription_charged
  // ledger posts. forwardRef breaks the cycle at Nest DI resolution.
  imports: [forwardRef(() => InboxModule), forwardRef(() => LedgerModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionLifecycleScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
