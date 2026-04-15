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
    this.logger.log(
      `routing ${event.provider} event ${event.eventType} (id=${event.externalEventId})`,
    );
    switch (event.eventType) {
      case 'payment.settled': {
        const handler = this.moduleRef.get(BrandFundingHandler, { strict: false });
        await handler.onPaymentSettled(payload);
        return;
      }
      case 'payment.failed': {
        const handler = this.moduleRef.get(BrandFundingHandler, { strict: false });
        await handler.onPaymentFailed(payload);
        return;
      }
      case 'refund.processed': {
        const refunds = this.moduleRef.get(RefundsService, { strict: false });
        const refundId = this.extractStitchRefundId(payload);
        if (refundId) await refunds.onStitchRefundProcessed(refundId);
        return;
      }
      case 'payout.settled': {
        const payouts = this.moduleRef.get(PayoutsService, { strict: false });
        const payoutId = this.extractStitchPayoutId(payload);
        if (payoutId) await payouts.onPayoutSettled(payoutId);
        return;
      }
      case 'payout.failed': {
        const payouts = this.moduleRef.get(PayoutsService, { strict: false });
        const payoutId = this.extractStitchPayoutId(payload);
        if (payoutId) {
          const reason = this.extractReason(payload) ?? 'unknown';
          await payouts.onPayoutFailed(payoutId, reason);
        }
        return;
      }
      default:
        this.logger.debug(`no handler wired for event type ${event.eventType}`);
    }
  }

  private extractStitchRefundId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const refund = (data.refund as Record<string, unknown>) ?? data;
    const id = refund.id ?? refund.refundId;
    return typeof id === 'string' ? id : undefined;
  }

  private extractStitchPayoutId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payout = (data.payout as Record<string, unknown>) ??
      (data.withdrawal as Record<string, unknown>) ??
      data;
    const id = payout.id ?? payout.payoutId ?? payout.withdrawalId;
    return typeof id === 'string' ? id : undefined;
  }

  private extractReason(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payout = (data.payout as Record<string, unknown>) ??
      (data.withdrawal as Record<string, unknown>) ??
      data;
    const reason = payout.failureReason ?? payout.reason ?? payout.error;
    return typeof reason === 'string' ? reason : undefined;
  }
}
