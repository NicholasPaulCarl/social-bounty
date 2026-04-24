import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WebhookEvent, WebhookProvider } from '@prisma/client';
import { TradeSafeWebhookHandler } from '../tradesafe/tradesafe-webhook.handler';

/**
 * Webhook event dispatcher (ADR 0011 — TradeSafe unified rail).
 *
 * Post-2026-04-24 single-rail cutover: only the INBOUND event
 * `tradesafe.funds.received` is wired. Outbound events
 * (`beneficiary.linked`, `payout.settled`, `payout.failed`) are
 * Phase 4 territory — logged and no-op'd until the submission-approval
 * → auto-payout flow lands.
 *
 *   - tradesafe.funds.received        → handleFundsReceived (Phase 3 inbound)
 *   - tradesafe.beneficiary.linked    → log-only (Phase 4 deferred)
 *   - tradesafe.payout.settled        → log-only (Phase 4 deferred)
 *   - tradesafe.payout.failed         → log-only (Phase 4 deferred)
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

    // Phase 4 outbound events — landed in the router before the outbound
    // cutover ships. Log-and-return keeps Svix retries happy (200 OK) while
    // the proper handlers are built alongside TradeSafe payout tables.
    if (
      eventType === 'tradesafe.beneficiary.linked' ||
      eventType === 'tradesafe.payout.settled' ||
      eventType === 'tradesafe.payout.failed'
    ) {
      this.logger.warn(
        `phase-4-deferred: tradesafe ${eventType} received (id=${event.externalEventId}); outbound handlers land with Phase 4 (submission-approval → auto-payout)`,
      );
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
