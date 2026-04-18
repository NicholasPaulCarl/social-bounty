import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { LedgerModule } from '../ledger/ledger.module';
import { TradeSafeCallbackController } from './tradesafe-callback.controller';
import { TradeSafeClient } from './tradesafe.client';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

/**
 * TradeSafe module (ADR 0009).
 *
 * Exports:
 *  - {@link TradeSafeClient} — outbound HTTP client, consumed by
 *    {@link PayoutProviderFactory} → {@link TradeSafePayoutAdapter}.
 *  - {@link TradeSafeWebhookHandler} — inbound webhook domain handlers
 *    (R34, 2026-04-18). Resolved lazily by {@link WebhookRouterService}
 *    via `ModuleRef` so the webhook module doesn't need to know about the
 *    TradeSafe internals at compile time — same pattern the router uses
 *    for {@link BrandFundingHandler} / {@link PayoutsService} /
 *    {@link RefundsService} / {@link UpgradeService}.
 *
 * Controllers:
 *  - {@link TradeSafeCallbackController} — R33 (2026-04-18), hosts
 *    `GET /api/v1/auth/tradesafe/callback`, the OAuth return leg of the
 *    hunter beneficiary-link flow (ADR 0009 §5). Lives here rather than
 *    under `auth/` because the behaviour is TradeSafe-specific; the
 *    `auth/` segment in the URL is namespace, not module organisation.
 *
 * The module itself stays unaware of the scheduler/retry state machine —
 * that lives in `payouts.service.ts`.
 */
@Module({
  imports: [RedisModule, LedgerModule],
  controllers: [TradeSafeCallbackController],
  providers: [TradeSafeClient, TradeSafeWebhookHandler],
  exports: [TradeSafeClient, TradeSafeWebhookHandler],
})
export class TradeSafeModule {}
