import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

/**
 * Outbound payouts (ADR 0011 — TradeSafe unified rail).
 *
 * **Phase 4 deferred (2026-04-24):** the `stitch_beneficiaries` and
 * `stitch_payouts` tables were dropped as part of the single-rail
 * Stitch-deletion cutover. The proper TradeSafe-native payout tables
 * (and the submission-approval → auto-release trigger wiring) land
 * with Phase 4. This service is a stub that fails loud on write
 * attempts and returns empty lists on reads.
 *
 * Imports stay wired so Nest DI graph doesn't collapse — the service
 * is still referenced from ReconciliationService, SubscriptionsService,
 * the scheduler, and PayoutsController, all of which will get
 * rebuilt alongside Phase 4.
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  async runBatch(_batchSize = 100): Promise<{ initiated: number; skipped: number; failed: number }> {
    this.logger.warn('payouts.runBatch: Phase 4 deferred — no-op');
    return { initiated: 0, skipped: 0, failed: 0 };
  }

  async initiatePayout(_userId: string, _beneficiaryId: string, _amountCents: bigint): Promise<void> {
    throw new NotImplementedException(
      'Outbound payouts are Phase 4 of the TradeSafe cutover (ADR 0011) and are not yet wired. PAYOUTS_ENABLED must stay false until the submission-approval → auto-payout flow lands.',
    );
  }

  async retryBatch(_batchSize = 50): Promise<{ retried: number }> {
    this.logger.warn('payouts.retryBatch: Phase 4 deferred — no-op');
    return { retried: 0 };
  }

  async listForUser(_userId: string) {
    // Empty list — no payout rows exist in the DB post-Stitch-deletion,
    // and Phase 4 tables aren't scaffolded yet. Returning [] keeps the
    // UI stable (participant /settings/payouts renders "no payouts yet").
    return [];
  }

  async adminRetry(_payoutId: string, _actor: { role: string; sub: string }) {
    throw new NotImplementedException(
      'Outbound payouts are Phase 4 of the TradeSafe cutover (ADR 0011).',
    );
  }
}
