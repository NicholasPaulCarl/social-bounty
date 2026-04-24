import { Module } from '@nestjs/common';
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
 * Imports {@link TradeSafeModule} so {@link WebhookRouterService} can
 * resolve {@link TradeSafeWebhookHandler} via `ModuleRef.get`.
 *
 * Domain-handler wiring for inbound/outbound flows (brand funding,
 * payouts, refunds, subscriptions) is reachable through the app-level
 * DI graph via `moduleRef.get(..., { strict: false })` in the router.
 */
@Module({
  imports: [TradeSafeModule],
  controllers: [TradeSafeTransactionCallbackController],
  providers: [WebhookEventService, WebhookRouterService],
  exports: [WebhookEventService, WebhookRouterService],
})
export class WebhooksModule {}
