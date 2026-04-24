import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WebhookEvent, WebhookProvider } from '@prisma/client';
import { TradeSafeWebhookHandler } from '../tradesafe/tradesafe-webhook.handler';

/**
 * Webhook event dispatcher (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch + Svix routing removed. All inbound/outbound
 * events flow through TradeSafe's native callback and its Svix-format
 * outbound webhooks:
 *
 *   - tradesafe.funds.received        → handleFundsReceived
 *     (brand-funding settlement — ADR 0011 §5 inbound lifecycle)
 *   - tradesafe.beneficiary.linked    → onBeneficiaryLinked
 *   - tradesafe.payout.settled        → onPayoutSettled
 *   - tradesafe.payout.failed         → onPayoutFailed
 *
 * Uses ModuleRef to resolve the handler lazily so the webhook module
 * doesn't depend on TradeSafe internals at compile time.
 */
@Injectable()
export class WebhookRouterService {
  private readonly logger = new Logger(WebhookRouterService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  async dispatch(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    if (event.provider !== WebhookProvider.TRADESAFE) {
      this.logger.warn(
        `webhook-router received non-TRADESAFE event (provider=${event.provider}) — ignoring post-ADR-0011`,
      );
      return;
    }

    const eventType =
      this.readString(payload.type) ?? event.eventType ?? '';
    this.logger.log(
      `routing tradesafe ${eventType} (id=${event.externalEventId})`,
    );

    const handler = this.moduleRef.get(TradeSafeWebhookHandler, { strict: false });

    if (eventType === 'tradesafe.funds.received') {
      await handler.handleFundsReceived(payload);
      return;
    }
    if (eventType === 'tradesafe.beneficiary.linked') {
      await handler.onBeneficiaryLinked(payload);
      return;
    }
    if (eventType === 'tradesafe.payout.settled') {
      await handler.onPayoutSettled(payload);
      return;
    }
    if (eventType === 'tradesafe.payout.failed') {
      await handler.onPayoutFailed(payload);
      return;
    }

    this.logger.debug(
      `no handler wired for tradesafe event ${eventType} (id=${event.externalEventId})`,
    );
  }

  async replay(eventId: string, prisma: { webhookEvent: { findUnique: Function } }): Promise<{ replayed: boolean }> {
    const event = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (!event) return { replayed: false };
    await this.dispatch(event as unknown as WebhookEvent, event.payload as Record<string, unknown>);
    return { replayed: true };
  }

  private readString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
  }
}
