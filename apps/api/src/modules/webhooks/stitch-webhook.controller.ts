import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider } from '@prisma/client';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@social-bounty/shared';
import { Public, Roles, Audited } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { KbService } from '../kb/kb.service';
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
    private readonly prisma: PrismaService,
    private readonly kb: KbService,
  ) {}

  /**
   * Dev-only: replay a stored webhook event through the router. Bypasses Svix
   * verification (the event was already verified when received). Guarded to
   * Super Admin + non-live providers so it's never callable in prod.
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('WEBHOOK_REPLAY', 'WebhookEvent')
  @Post('stitch/replay/:eventId')
  async replay(@Param('eventId') eventId: string) {
    const provider = this.config.get<string>('PAYMENTS_PROVIDER', 'none');
    if (provider === 'stitch_live') {
      throw new ForbiddenException('replay is disabled in stitch_live');
    }
    return this.router.replay(eventId, this.prisma);
  }

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
      // Feed the failure into the KB so repeated handler errors on the same
      // (provider, eventType) collapse into one RecurringIssue row with a
      // bumped occurrence counter. Same shape as reconciliation's call so the
      // admin dashboard's per-system confidence score can group on `system`.
      await this.kb
        .recordRecurrence({
          category: 'webhook-failure',
          system: 'webhooks',
          errorCode: event.eventType,
          severity: 'warning',
          title: `Webhook ${event.eventType} failed`,
          metadata: { svixId, errorMessage: message, system: 'webhooks' },
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
