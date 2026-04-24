import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { FinanceModule } from '../finance/finance.module';
import { LedgerModule } from '../ledger/ledger.module';

/**
 * Payments module (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch inbound deleted. Brand bounty-funding routes
 * through `TradeSafePaymentsService` (from `TradeSafeModule`) for
 * hosted-checkout creation, and settles via
 * `TradeSafeWebhookHandler.handleFundsReceived` on the callback path.
 */
@Module({
  imports: [
    SubscriptionsModule,
    forwardRef(() => TradeSafeModule),
    FinanceModule,
    LedgerModule,
  ],
  controllers: [PaymentsController],
  providers: [],
  exports: [],
})
export class PaymentsModule {}
