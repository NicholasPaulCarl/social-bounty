import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  LedgerAccount,
  LedgerEntryType,
  PaymentStatus,
  TradeSafeTransactionState,
} from '@prisma/client';
import {
  AUDIT_ACTIONS,
  UserRole,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

/**
 * TradeSafe webhook handler (ADR 0011 §5 — single-rail inbound).
 *
 * Post-2026-04-24 Stitch removal: only the INBOUND event
 * `tradesafe.funds.received` is wired. Outbound events
 * (`beneficiary.linked`, `payout.settled`, `payout.failed`) are
 * Phase 4 territory — the handlers were deleted along with the
 * `stitch_beneficiaries` + `stitch_payouts` tables, and will be
 * rebuilt against proper TradeSafe payout tables when Phase 4
 * (submission-approval → auto-payout) lands.
 *
 * Idempotency anchors for the inbound path (Financial Non-Negotiables #2, #7):
 *   - `WebhookEvent.UNIQUE(provider, externalEventId)` guard in the callback
 *     controller: second delivery of the same event is a no-op.
 *   - `LedgerTransactionGroup.UNIQUE(referenceId=transactionId, actionType=
 *     'BOUNTY_FUNDED_VIA_TRADESAFE')`: any double-write returns
 *     `{idempotent: true}` without re-posting (ADR 0005).
 *
 * Kill-switch: routed through `LedgerService.postTransactionGroup` which
 * enforces `isKillSwitchActive()`.
 */
@Injectable()
export class TradeSafeWebhookHandler {
  private readonly logger = new Logger(TradeSafeWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Provider-agnostic system-actor for AuditLog rows written by webhook-driven
   * ledger posts. `SYSTEM_ACTOR_ID` is a real users.id row (the
   * AuditLog.actorId FK enforces referential integrity). Configured per
   * environment; fails loud at first webhook dispatch if absent.
   */
  private systemActorId(): string {
    const id = this.config.get<string>('SYSTEM_ACTOR_ID', '');
    if (!id) {
      throw new Error(
        'SYSTEM_ACTOR_ID is not set; TradeSafe webhook handlers cannot write AuditLog rows',
      );
    }
    return id;
  }

  /**
   * Brand funding settled on TradeSafe's escrow (ADR 0011 §5 inbound
   * lifecycle). Posts the canonical `brand_cash_received → brand_reserve`
   * ledger group, flips the bounty DRAFT → LIVE + PENDING → PAID, and
   * records an AuditLog entry inside the same Prisma transaction.
   */
  async handleFundsReceived(payload: Record<string, unknown>): Promise<void> {
    const transactionId = this.extractTransactionId(payload);
    if (!transactionId) {
      this.logger.warn(
        'tradesafe.funds.received: missing transaction id; ignoring',
      );
      return;
    }

    const txn = await this.prisma.tradeSafeTransaction.findUnique({
      where: { tradeSafeTransactionId: transactionId },
      include: { bounty: true },
    });
    if (!txn) {
      // Unknown transaction — either a replay of an expired row or a
      // fabrication. The callback controller guarantees the event has
      // passed the URL-secret gate, but we still cannot post ledger for
      // a bounty we don't recognise. Log + return.
      this.logger.warn(
        `tradesafe.funds.received: unknown transactionId=${transactionId}`,
      );
      return;
    }

    const bounty = txn.bounty;
    if (!bounty) {
      this.logger.warn(
        `tradesafe.funds.received: transaction ${transactionId} has no linked bounty; ignoring`,
      );
      return;
    }

    const actorId = this.systemActorId();
    // Ledger amounts are rebuilt from the bounty snapshot (Non-Negotiable #9
    // — in-flight transactions are never re-priced). The TradeSafe-side
    // `totalValueCents` is used only as a cross-check; any drift between the
    // two surfaces in reconciliation (check_tradesafe_vs_ledger).
    const faceValueCents = bounty.faceValueCents ?? txn.totalValueCents;
    const adminBps = bounty.brandAdminFeeRateBps ?? 0;
    const globalBps = bounty.globalFeeRateBps ?? 0;
    const adminFee = (faceValueCents * BigInt(adminBps)) / 10000n;
    const globalFee = (faceValueCents * BigInt(globalBps)) / 10000n;
    const cashInCents = faceValueCents + adminFee + globalFee;

    // Post the funding ledger group + AuditLog inside one Prisma tx,
    // flanked by the Bounty + TradeSafeTransaction state flip (single
    // commit-or-rollback unit per Financial Non-Negotiable #3).
    await this.prisma.$transaction(async (tx) => {
      await this.ledger.postTransactionGroup(
        {
          actionType: AUDIT_ACTIONS.BOUNTY_FUNDED_VIA_TRADESAFE,
          referenceId: transactionId,
          referenceType: 'TradeSafeTransaction',
          description: `TradeSafe bounty funding received: ${bounty.id}`,
          postedBy: actorId,
          currency: bounty.currency,
          legs: [
            {
              account: LedgerAccount.brand_cash_received,
              type: LedgerEntryType.DEBIT,
              amountCents: cashInCents,
              brandId: bounty.brandId,
              bountyId: bounty.id,
              externalReference: transactionId,
            },
            {
              account: LedgerAccount.brand_reserve,
              type: LedgerEntryType.CREDIT,
              amountCents: faceValueCents,
              brandId: bounty.brandId,
              bountyId: bounty.id,
            },
            ...(adminFee > 0n
              ? [
                  {
                    account: LedgerAccount.admin_fee_revenue,
                    type: LedgerEntryType.CREDIT,
                    amountCents: adminFee,
                    brandId: bounty.brandId,
                  },
                ]
              : []),
            ...(globalFee > 0n
              ? [
                  {
                    account: LedgerAccount.global_fee_revenue,
                    type: LedgerEntryType.CREDIT,
                    amountCents: globalFee,
                    brandId: bounty.brandId,
                  },
                ]
              : []),
          ],
          audit: {
            actorId,
            actorRole: UserRole.SUPER_ADMIN,
            action: AUDIT_ACTIONS.BOUNTY_FUNDED_VIA_TRADESAFE,
            entityType: 'Bounty',
            entityId: bounty.id,
            afterState: {
              tradeSafeTransactionId: transactionId,
              faceValueCents: faceValueCents.toString(),
              cashInCents: cashInCents.toString(),
            },
          },
        },
        tx,
      );

      await tx.tradeSafeTransaction.update({
        where: { id: txn.id },
        data: { state: TradeSafeTransactionState.FUNDS_RECEIVED },
      });

      // Only transition the bounty if still in DRAFT — second delivery of
      // the same callback must be a no-op on state as well as ledger.
      if (
        bounty.status === BountyStatus.DRAFT ||
        bounty.paymentStatus !== PaymentStatus.PAID
      ) {
        await tx.bounty.update({
          where: { id: bounty.id },
          data: {
            status: BountyStatus.LIVE,
            paymentStatus: PaymentStatus.PAID,
          },
        });
      }
    });

    this.logger.log(
      `tradesafe.funds.received processed bounty=${bounty.id} tradesafeTxn=${transactionId}`,
    );
  }

  private extractTransactionId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    return (
      this.readString(data.id) ??
      this.readString(data.transactionId) ??
      this.readString(data.tradesafeTransactionId)
    );
  }

  private readString(v: unknown): string | undefined {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  }
}
