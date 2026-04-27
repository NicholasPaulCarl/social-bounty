import { Module, forwardRef } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { LedgerModule } from '../ledger/ledger.module';
import { FinanceModule } from '../finance/finance.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TradeSafeCallbackController } from './tradesafe-callback.controller';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';
import { TradeSafeTokenService } from './tradesafe-token.service';
import { TradeSafePaymentsService } from './tradesafe-payments.service';
import { TradeSafeTransactionCallbackHandler } from './tradesafe-transaction-callback.handler';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

/**
 * TradeSafe module (ADR 0011 — single-rail inbound + outbound).
 *
 * Exports:
 *  - {@link TradeSafeGraphQLClient} — typed GraphQL client + OAuth token
 *    cache (ADR 0011 §1). Consumed by {@link TradeSafePaymentsService}
 *    for inbound bounty funding and by the webhook callback handlers
 *    for authoritative state re-fetch.
 *  - {@link TradeSafeTokenService} — idempotent party-token onboarding;
 *    one TradeSafe token per User row (`users.tradeSafeTokenId`).
 *  - {@link TradeSafePaymentsService} — `createBountyFunding` (Phase 3
 *    inbound). Brand → TradeSafe escrow → hunter, AGENT party = platform.
 *  - {@link TradeSafeWebhookHandler} — `handleFundsReceived` ledger
 *    handler. Wired into the URL-secret callback route by
 *    `TradeSafeTransactionCallbackController` (state-specific dispatch).
 *  - {@link TradeSafeTransactionCallbackHandler} — audit-only sibling
 *    handler that runs on every callback regardless of state.
 *
 * Controllers:
 *  - {@link TradeSafeCallbackController} — hosts
 *    `GET /api/v1/auth/tradesafe/callback`, the OAuth return leg of the
 *    hunter beneficiary-link flow (ADR 0009 §5). Lives here rather than
 *    under `auth/` because the behaviour is TradeSafe-specific; the
 *    `auth/` segment in the URL is namespace, not module organisation.
 *
 * Phase 4 outbound payouts (auto-release on submission approval) are
 * deferred. {@link PayoutsService} stubs throw `NotImplementedException`
 * until that work lands; the legacy `TradeSafeClient` HTTP client +
 * `TradeSafePayoutAdapter` + `PayoutProviderFactory` were deleted on
 * 2026-04-27 (no live caller post-Phase-3 cutover).
 *
 * LedgerModule is imported via `forwardRef` because TradeSafeModule is
 * imported by WebhooksModule, and LedgerModule's own import chain
 * (LedgerModule → FinanceModule → WebhooksModule) would otherwise close
 * the cycle and leave LedgerModule undefined at scan time. Mirrors the
 * pattern LedgerModule uses for its SubscriptionsModule dependency
 * (`ledger.module.ts:11`).
 */
@Module({
  imports: [
    RedisModule,
    forwardRef(() => LedgerModule),
    forwardRef(() => FinanceModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [TradeSafeCallbackController],
  providers: [
    TradeSafeGraphQLClient,
    TradeSafeTokenService,
    TradeSafePaymentsService,
    TradeSafeTransactionCallbackHandler,
    TradeSafeWebhookHandler,
  ],
  exports: [
    TradeSafeGraphQLClient,
    TradeSafeTokenService,
    TradeSafePaymentsService,
    TradeSafeTransactionCallbackHandler,
    TradeSafeWebhookHandler,
  ],
})
export class TradeSafeModule {}
