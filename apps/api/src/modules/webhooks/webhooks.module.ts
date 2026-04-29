import { Module, forwardRef } from '@nestjs/common';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { TradeSafeTransactionCallbackController } from './tradesafe-transaction-callback.controller';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

/**
 * Webhook ingestion (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch inbound + Svix verifier deleted. TradeSafe's
 * native callback (URL-path-secreted) and its Svix-format outbound
 * webhook handlers are the only two live paths.
 *
 * Imports {@link TradeSafeModule} via `forwardRef` because the live
 * dependency cycle closes around this edge:
 *   TradeSafeModule → FinanceModule (forwardRef ✓)
 *   FinanceModule → WebhooksModule (direct)
 *   WebhooksModule → TradeSafeModule (this edge)
 * One side of any cycle has to defer; this is the natural place — the
 * router resolves {@link TradeSafeWebhookHandler} at request time via
 * `moduleRef.get(..., { strict: false })`, so the deferred reference
 * never short-circuits a real call. The cycle stayed dormant until
 * 2026-04-29 when KYB Wave 1 made BrandsModule a direct importer of
 * TradeSafeModule (`brands.module.ts`), changing Nest's scan order
 * and exposing the previously-unobserved `undefined` import.
 *
 * Domain-handler wiring for inbound/outbound flows (brand funding,
 * payouts, refunds, subscriptions) is reachable through the app-level
 * DI graph via `moduleRef.get(..., { strict: false })` in the router.
 */
@Module({
  imports: [forwardRef(() => TradeSafeModule)],
  controllers: [TradeSafeTransactionCallbackController],
  providers: [WebhookEventService, WebhookRouterService],
  exports: [WebhookEventService, WebhookRouterService],
})
export class WebhooksModule {}
