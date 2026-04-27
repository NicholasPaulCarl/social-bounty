import { Module } from '@nestjs/common';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { LedgerModule } from '../ledger/ledger.module';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiaryService } from './beneficiary.service';
import { PayoutsService } from './payouts.service';
import { PayoutsScheduler } from './payouts.scheduler';
import { PayoutsController } from './payouts.controller';

/**
 * Outbound-payout wiring (ADR 0011 — TradeSafe unified rail).
 *
 * Phase 4 deferred: `PayoutsService` is currently a stub throwing
 * `NotImplementedException`. The legacy `PayoutProviderFactory`,
 * `TradeSafePayoutAdapter`, `PayoutProvider` interface, and `TradeSafeClient`
 * HTTP client (~700 LoC across 7 files) were deleted on 2026-04-27 — they
 * had zero live callers post-Phase-3 cutover, since the service throws
 * before any caller could reach them. When Phase 4 lands (submission-
 * approval → auto-release via TradeSafe's `transactionCancel` /
 * `allocationAcceptDelivery` mutations on the existing GraphQL client),
 * the new wiring will go straight through `TradeSafeGraphQLClient` —
 * no factory + adapter indirection needed for a single rail.
 */
@Module({
  imports: [TradeSafeModule, LedgerModule, WalletModule],
  controllers: [PayoutsController],
  providers: [BeneficiaryService, PayoutsService, PayoutsScheduler],
  exports: [BeneficiaryService, PayoutsService],
})
export class PayoutsModule {}
