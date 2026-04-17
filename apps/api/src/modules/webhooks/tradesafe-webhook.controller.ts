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
import { KbService } from '../kb/kb.service';
import { SvixVerificationError, SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

/**
 * Inbound webhook receiver for TradeSafe (ADR 0009 scaffold).
 *
 * Follows the StitchWebhookController pattern exactly:
 *   - Svix-verified via a TradeSafe-specific webhook secret.
 *   - Upserts `WebhookEvent(provider='TRADESAFE', …)` with the `(provider,
 *     externalEventId)` unique index providing idempotency (Non-Negotiable #7).
 *   - Dispatch is a no-op today — the router currently has no
 *     `tradesafe.*` arms wired (ADR 0010 / Phase 2 will add them).
 *   - Duplicates short-circuit with `{ received: true, duplicate: true }` and
 *     never invoke the router.
 *   - Dispatch errors are caught, recorded, and routed through KbService so
 *     a buggy handler cannot turn one Svix event into a retry storm.
 *
 * NOTE: The signature scheme for live TradeSafe is unknown until ADR 0010
 * (open question 8). The adapter assumes Svix-compatible headers because
 * that is the shape the rest of the project already speaks. If TradeSafe
 * ships a proprietary HMAC, a sibling verifier module will be added without
 * changing this controller's shape.
 */
@Controller('webhooks')
export class TradeSafeWebhookController {
  private readonly logger = new Logger(TradeSafeWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly verifier: SvixVerifier,
    private readonly events: WebhookEventService,
    private readonly router: WebhookRouterService,
    private readonly kb: KbService,
  ) {}

  @Public()
  @Post('tradesafe')
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true; duplicate: boolean }> {
    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('missing raw body');
    }

    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (
      typeof svixId !== 'string' ||
      typeof svixTimestamp !== 'string' ||
      typeof svixSignature !== 'string'
    ) {
      throw new BadRequestException('missing svix headers');
    }

    const secret = this.config.get<string>('TRADESAFE_WEBHOOK_SECRET', '');
    try {
      this.verifier.verify(
        rawBody,
        { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
        secret,
      );
    } catch (err) {
      if (err instanceof SvixVerificationError) {
        this.logger.warn(`tradesafe svix verification failed: ${err.message}`);
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
      provider: WebhookProvider.TRADESAFE,
      externalEventId: svixId,
      eventType,
      payload,
      signatureHeader: svixSignature,
      svixTimestamp: Number.isFinite(tsSeconds) ? new Date(tsSeconds * 1000) : undefined,
    });

    if (isDuplicate) {
      return { received: true, duplicate: true };
    }

    // Phase 1 (ADR 0009): no TradeSafe domain handlers wired yet. Router
    // call is kept so that when ADR 0010 adds dispatch arms, this controller
    // needs no change. Errors are caught so a future handler bug cannot turn
    // one Svix event into a retry storm.
    try {
      await this.router.dispatch(event, payload);
      await this.events.markProcessed(event.id, {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.events.markFailed(event.id, message, event.attempts + 1);
      this.logger.error(`tradesafe webhook dispatch failed for ${svixId}: ${message}`);
      await this.kb
        .recordRecurrence({
          category: 'webhook-failure',
          system: 'webhooks',
          errorCode: event.eventType,
          severity: 'warning',
          title: `TradeSafe webhook ${event.eventType} failed`,
          metadata: {
            svixId,
            errorMessage: message,
            system: 'webhooks',
            provider: 'tradesafe',
          },
        })
        .catch((kbErr) =>
          this.logger.warn(
            `KB record failed: ${kbErr instanceof Error ? kbErr.message : String(kbErr)}`,
          ),
        );
    }

    return { received: true, duplicate: false };
  }
}
