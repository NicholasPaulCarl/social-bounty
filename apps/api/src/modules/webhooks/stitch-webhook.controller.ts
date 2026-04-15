import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider } from '@prisma/client';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators';
import { SvixVerificationError, SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

@Controller('webhooks')
export class StitchWebhookController {
  private readonly logger = new Logger(StitchWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly verifier: SvixVerifier,
    private readonly events: WebhookEventService,
    private readonly router: WebhookRouterService,
  ) {}

  @Public()
  @Post('stitch')
  @HttpCode(200)
  async receive(@Req() req: RawBodyRequest<Request>): Promise<{ received: true; duplicate: boolean }> {
    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('missing raw body');
    }

    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (typeof svixId !== 'string' || typeof svixTimestamp !== 'string' || typeof svixSignature !== 'string') {
      throw new BadRequestException('missing svix headers');
    }

    const secret = this.config.get<string>('STITCH_WEBHOOK_SECRET', '');
    try {
      this.verifier.verify(
        rawBody,
        { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
        secret,
      );
    } catch (err) {
      if (err instanceof SvixVerificationError) {
        this.logger.warn(`svix verification failed: ${err.message}`);
        throw new UnauthorizedException('signature verification failed');
      }
      throw err;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('payload is not valid JSON');
    }

    const eventType =
      (typeof payload.type === 'string' && payload.type) ||
      (typeof payload.eventType === 'string' && payload.eventType) ||
      'unknown';

    const tsSeconds = Number.parseInt(svixTimestamp, 10);
    const { event, isDuplicate } = await this.events.recordOrFetch({
      provider: WebhookProvider.STITCH,
      externalEventId: svixId,
      eventType,
      payload,
      signatureHeader: svixSignature,
      svixTimestamp: Number.isFinite(tsSeconds) ? new Date(tsSeconds * 1000) : undefined,
    });

    if (isDuplicate) {
      return { received: true, duplicate: true };
    }

    // Phase 0: router is a no-op; Phase 1 wires domain handlers.
    // Errors are caught and recorded so a buggy handler never turns one event
    // into a retry storm (Svix will redeliver on non-2xx anyway).
    try {
      await this.router.dispatch(event, payload);
      await this.events.markProcessed(event.id, {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.events.markFailed(event.id, message, event.attempts + 1);
      this.logger.error(`webhook dispatch failed for ${svixId}: ${message}`);
    }

    return { received: true, duplicate: false };
  }
}
