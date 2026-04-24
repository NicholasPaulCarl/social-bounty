import { Module, forwardRef } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionLifecycleScheduler } from './subscription-lifecycle.scheduler';

/**
 * Subscriptions (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: `UpgradeService` deleted (was Stitch-specific
 * recurring-consent flow). TradeSafe has no recurring-subscription
 * primitive — Pro tier upgrade is paused pending a subscription-capable
 * PSP decision (see ADR 0011 §7 alternative (c)). The lifecycle
 * scheduler remains provider-agnostic (tier snapshot, auto-downgrade,
 * grace period).
 */
@Module({
  imports: [forwardRef(() => InboxModule), forwardRef(() => LedgerModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionLifecycleScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
