import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { TransactionData } from './tradesafe-graphql.operations';

/**
 * Domain handler for TradeSafe *transaction* callbacks (Plan item 1.2 /
 * Phase 1d of ADR 0011's unified-rail pivot).
 *
 * NOT to be confused with {@link TradeSafeWebhookHandler} — that one handles
 * the Svix-formatted outbound events (beneficiary linked / payout settled /
 * payout failed) per R34 (ADR 0009). This handler sits on TradeSafe's
 * *native* callback path: TradeSafe POSTs a small JSON on every transaction
 * state change, and the controller uses the body only to extract the
 * transaction id, then re-fetches canonical state via
 * {@link TradeSafeGraphQLClient.getTransaction}. That re-fetched payload is
 * what this handler receives.
 *
 * Phase 1 scope (this file):
 *   - Log the full state snapshot at INFO.
 *   - Write an AuditLog row capturing the current transaction/allocation
 *     states for forensics. Hard Rule #3 + Financial Non-Negotiable #6.
 *
 * Phase 3/4 scope (future):
 *   - Map `transaction.state` / `allocation.state` transitions onto ledger
 *     writes: FUNDS_RECEIVED → brand_funded, FUNDS_RELEASED → hunter_paid,
 *     CANCELLED / DISPUTE → compensating entries. Those writes go through
 *     `LedgerService.postTransactionGroup` with action-types that pair
 *     with the TradeSafe transaction id as the idempotency key.
 *
 * The handler is intentionally side-effect-light today: TradeSafe's
 * at-least-once delivery + the controller's `UNIQUE(provider,
 * externalEventId)` row mean we may be called multiple times for the same
 * logical event. Writing nothing but an AuditLog keeps the blast radius of
 * a replay small until Phase 3 pins the ledger semantics.
 */
@Injectable()
export class TradeSafeTransactionCallbackHandler {
  private readonly logger = new Logger(TradeSafeTransactionCallbackHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Handle a re-fetched TradeSafe transaction. `transaction` is the full
   * GraphQL response (may be `null` if TradeSafe returns no row — we defend
   * against that case here even though the controller also checks).
   */
  async handle(transaction: TransactionData['transaction']): Promise<void> {
    if (!transaction) {
      this.logger.warn(
        'tradesafe transaction callback handler received null transaction; no-op',
      );
      return;
    }

    const allocationSummary = transaction.allocations.map((a) => ({
      id: a.id,
      state: a.state,
      value: a.value,
    }));

    this.logger.log(
      `tradesafe transaction ${transaction.id} state=${transaction.state} ref=${transaction.reference ?? 'n/a'} allocations=${JSON.stringify(allocationSummary)}`,
    );

    // AuditLog is required per Hard Rule #3 and Financial Non-Negotiable #6.
    // Actor id is the system-actor row (FK on `audit_logs.actorId`). If
    // SYSTEM_ACTOR_ID isn't set (dev mode), skip the audit write
    // rather than crash — mirrors `TradeSafeCallbackController.systemActorId`
    // and `ReconciliationService.systemActorId`.
    const actorId = this.systemActorId();
    if (!actorId) {
      this.logger.debug(
        'SYSTEM_ACTOR_ID unset; skipping AuditLog for transaction callback',
      );
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          actorRole: UserRole.SUPER_ADMIN,
          action: 'TRADESAFE_TRANSACTION_CALLBACK',
          entityType: 'TradeSafeTransaction',
          entityId: transaction.id,
          afterState: {
            state: transaction.state,
            reference: transaction.reference,
            allocations: allocationSummary,
          } as Prisma.InputJsonValue,
          reason:
            'TradeSafe transaction-state callback received + re-fetched (plan.md Phase 1d).',
        },
      });
    } catch (err) {
      // Audit failures are logged but do NOT fail the webhook — the
      // `webhook_events` row is the primary record of receipt. Mirrors the
      // OAuth callback controller's best-effort audit pattern.
      this.logger.error(
        `tradesafe transaction callback audit log failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private systemActorId(): string | null {
    return this.config.get<string>('SYSTEM_ACTOR_ID', '') || null;
  }
}
