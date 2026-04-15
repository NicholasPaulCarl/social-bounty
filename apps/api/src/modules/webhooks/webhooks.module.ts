import { Module } from '@nestjs/common';
import { StitchWebhookController } from './stitch-webhook.controller';
import { SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

@Module({
  controllers: [StitchWebhookController],
  providers: [SvixVerifier, WebhookEventService, WebhookRouterService],
  exports: [WebhookEventService, SvixVerifier, WebhookRouterService],
})
export class WebhooksModule {}
