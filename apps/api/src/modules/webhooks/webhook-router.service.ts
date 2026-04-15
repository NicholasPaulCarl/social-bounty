import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WebhookEvent } from '@prisma/client';
import { BrandFundingHandler } from '../payments/brand-funding.handler';
import { RefundsService } from '../refunds/refunds.service';
import { PayoutsService } from '../payouts/payouts.service';

/**
 * Dispatches a verified, recorded webhook event to the appropriate domain handler.
 *
 * Phase 1: wires Stitch inbound (payment.settled, payment.failed, refund.processed).
 * Phase 2: wires Stitch outbound (payout.settled, payout.failed).
 *
 * Uses ModuleRef to resolve handlers lazily so the webhook module doesn't depend
 * on every payment-adjacent module at compile time.
 */
@Injectable()
export class WebhookRouterService {
  private readonly logger = new Logger(WebhookRouterService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  async dispatch(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    // Stitch sends { type: "LINK" | "WITHDRAWAL" | "REFUND", status: "PAID" | "SETTLED" | "FAILED" | ... }
    // We route on (type, status) rather than eventType alone.
    const resource = this.readString(payload.type) ?? event.eventType;
    const status = this.readString(payload.status) ?? '';
    this.logger.log(
      `routing ${event.provider} ${resource}/${status} (id=${event.externalEventId})`,
    );

    if (resource === 'LINK') {
      const handler = this.moduleRef.get(BrandFundingHandler, { strict: false });
      if (status === 'PAID' || status === 'SETTLED') {
        await handler.onPaymentSettled(payload);
        return;
      }
      if (status === 'FAILED' || status === 'EXPIRED') {
        await handler.onPaymentFailed(payload);
        return;
      }
    }
    if (resource === 'WITHDRAWAL') {
      const payouts = this.moduleRef.get(PayoutsService, { strict: false });
      const payoutId = this.extractStitchPayoutId(payload);
      if (!payoutId) return;
      if (status === 'PAID' || status === 'SETTLED') {
        await payouts.onPayoutSettled(payoutId);
        return;
      }
      if (status === 'FAILED') {
        await payouts.onPayoutFailed(payoutId, this.extractReason(payload) ?? 'unknown');
        return;
      }
    }
    if (resource === 'REFUND' && (status === 'PROCESSED' || status === 'COMPLETED')) {
      const refunds = this.moduleRef.get(RefundsService, { strict: false });
      const refundId = this.extractStitchRefundId(payload);
      if (refundId) await refunds.onStitchRefundProcessed(refundId);
      return;
    }
    this.logger.debug(`no handler wired for ${resource}/${status}`);
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

  private extractStitchRefundId(payload: Record<string, unknown>): string | undefined {
    const id = payload.refundId ?? payload.id;
    return typeof id === 'string' ? id : undefined;
  }

  private extractStitchPayoutId(payload: Record<string, unknown>): string | undefined {
    const id = payload.withdrawalId ?? payload.payoutId ?? payload.id;
    return typeof id === 'string' ? id : undefined;
  }

  private extractReason(payload: Record<string, unknown>): string | undefined {
    const reason = payload.failureReason ?? payload.reason ?? payload.error;
    return typeof reason === 'string' ? reason : undefined;
  }
}
