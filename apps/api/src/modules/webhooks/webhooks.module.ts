import { Module } from '@nestjs/common';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { StitchWebhookController } from './stitch-webhook.controller';
import { TradeSafeWebhookController } from './tradesafe-webhook.controller';
import { SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

/**
 * Imports {@link TradeSafeModule} so {@link WebhookRouterService} can resolve
 * {@link TradeSafeWebhookHandler} via `ModuleRef.get` (R34, 2026-04-18).
 *
 * Stitch-side handlers (`BrandFundingHandler`, `PayoutsService`,
 * `RefundsService`, `UpgradeService`) are reachable through the app-level DI
 * graph because their modules are imported at the `AppModule` root; we do NOT
 * import each of those modules here because it would create circular imports
 * (`PaymentsModule` already imports `WebhooksModule` transitively). TradeSafe
 * is different: it sits lower in the graph and needs this explicit edge.
 */
@Module({
  imports: [TradeSafeModule],
  controllers: [StitchWebhookController, TradeSafeWebhookController],
  providers: [SvixVerifier, WebhookEventService, WebhookRouterService],
  exports: [WebhookEventService, SvixVerifier, WebhookRouterService],
})
export class WebhooksModule {}
