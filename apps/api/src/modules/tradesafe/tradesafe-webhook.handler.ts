import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  LedgerAccount,
  LedgerEntryType,
  PaymentStatus,
  StitchPayoutStatus,
  TradeSafeTransactionState,
} from '@prisma/client';
import {
  AUDIT_ACTIONS,
  LEDGER_ACTION_TYPES,
  UserRole,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

/**
 * TradeSafe webhook handler (ADR 0009 §6, R34 — 2026-04-18).
 *
 * Mirrors the shape of {@link BrandFundingHandler} / {@link PayoutsService}
 * Stitch-side handlers. Three distinct event flows — all idempotent, all
 * audit-logged, all kill-switch-respecting.
 *
 * Event → handler mapping (wired by {@link WebhookRouterService}):
 *
 *   tradesafe.beneficiary.linked   → onBeneficiaryLinked
 *   tradesafe.payout.settled       → onPayoutSettled
 *   tradesafe.payout.failed        → onPayoutFailed
 *
 * Idempotency anchors:
 *   - Beneficiary linked — no ledger write (pre-financial). AuditLog
 *     idempotency falls out of the `WebhookEvent.UNIQUE(provider,
 *     externalEventId)` constraint in the controller; we additionally
 *     no-op if the beneficiary row is already `verifiedAt`-set.
 *   - Payout settled/failed — ledger group via
 *     `UNIQUE(referenceId=tradesafePayoutId, actionType)` (ADR 0005).
 *
 * Event-payload shapes here are the plausible minimum per ADR 0009 §6.
 * The actual field names are pinned by TradeSafe's sandbox docs, which
 * are not yet available (R24 external blocker). Every `TODO(R34): verify
 * event name/shape with TradeSafe` marker identifies a spot that may
 * need adjustment once sandbox lands.
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
   * System-actor for AuditLog rows written by webhook-driven ledger posts.
   * Mirrors `PayoutsService.systemActorId` — a real users.id row (FK on
   * AuditLog.actorId enforces).
   */
  private systemActorId(): string {
    const id = this.config.get<string>('STITCH_SYSTEM_ACTOR_ID', '');
    if (!id) {
      throw new Error(
        'STITCH_SYSTEM_ACTOR_ID is not set; TradeSafe webhook handlers cannot write AuditLog rows',
      );
    }
    return id;
  }

  /**
   * Hunter's TradeSafe beneficiary account finished verification / linking.
   * No ledger write — beneficiary linking is pre-financial. Updates the
   * `StitchBeneficiary.verifiedAt` timestamp and writes an AuditLog entry.
   *
   * Idempotency: we look up by either `externalBeneficiaryId` (our
   * `stitchBeneficiaryId` column, which TradeSafe echoes back as the
   * provider-minted id) or the echoed `externalReference` (our internal
   * userId — matches the shape of `TradeSafeCreateBeneficiaryRequest`).
   * If the row is already `verifiedAt`-set we no-op.
   *
   * TODO(R34): verify event name + payload shape with TradeSafe once
   * sandbox docs land. Current plausible-minimum shape:
   *   {
   *     type: 'tradesafe.beneficiary.linked',
   *     data: {
   *       id: '<tradesafe-beneficiary-id>',     // provider-minted id
   *       externalReference: '<hunter-user-id>', // we echo userId on create
   *       status: 'VERIFIED'
   *     }
   *   }
   */
  async onBeneficiaryLinked(payload: Record<string, unknown>): Promise<void> {
    const { tradesafeBeneficiaryId, externalReference } =
      this.extractBeneficiaryData(payload);

    if (!tradesafeBeneficiaryId && !externalReference) {
      this.logger.warn(
        'tradesafe.beneficiary.linked: missing both beneficiary id and externalReference; ignoring',
      );
      return;
    }

    // Lookup priority: externalBeneficiaryId (provider-minted) first, then
    // externalReference → userId (handles the case where our local-fallback
    // `local:<userId>` placeholder is still in the row).
    let beneficiary = tradesafeBeneficiaryId
      ? await this.prisma.stitchBeneficiary.findUnique({
          where: { stitchBeneficiaryId: tradesafeBeneficiaryId },
        })
      : null;

    if (!beneficiary && externalReference) {
      beneficiary = await this.prisma.stitchBeneficiary.findUnique({
        where: { userId: externalReference },
      });
    }

    if (!beneficiary) {
      this.logger.warn(
        `tradesafe.beneficiary.linked: unknown beneficiary (id=${tradesafeBeneficiaryId ?? 'n/a'}, externalRef=${externalReference ?? 'n/a'})`,
      );
      return;
    }

    // Idempotent fast-path: already verified → no-op. The webhook-event
    // UNIQUE(provider, externalEventId) constraint is the primary defence,
    // but Svix's at-least-once delivery + a failed markProcessed would
    // re-dispatch this handler; the row-level check is defence-in-depth.
    if (beneficiary.verifiedAt) {
      this.logger.log(
        `tradesafe.beneficiary.linked: beneficiary ${beneficiary.id} already verified at ${beneficiary.verifiedAt.toISOString()}; no-op`,
      );
      return;
    }

    const actorId = this.systemActorId();
    const now = new Date();

    // Update + audit in a single $transaction. We do NOT post to the ledger
    // (no money movement), but AuditLog is required per Non-Negotiable #6.
    // If the update or audit throws, the whole tx rolls back — neither
    // half-written.
    await this.prisma.$transaction(async (tx) => {
      // Guard against a racy second update — if another handler already
      // flipped verifiedAt between our fast-path check and this write, the
      // fallthrough row will still read as non-null, so we overwrite-to-
      // same-value and audit. Acceptable; the ledger isn't touched.
      await tx.stitchBeneficiary.update({
        where: { id: beneficiary!.id },
        data: {
          verifiedAt: now,
          // If TradeSafe returned a fresh provider id that didn't match our
          // stored `stitchBeneficiaryId`, update it. Common when the row was
          // created with a `local:<userId>` fallback before TradeSafe issued
          // the real id.
          ...(tradesafeBeneficiaryId &&
          tradesafeBeneficiaryId !== beneficiary!.stitchBeneficiaryId
            ? { stitchBeneficiaryId: tradesafeBeneficiaryId }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          actorRole: UserRole.SUPER_ADMIN,
          action: 'BENEFICIARY_LINKED',
          entityType: 'StitchBeneficiary',
          entityId: beneficiary!.id,
          afterState: {
            tradesafeBeneficiaryId:
              tradesafeBeneficiaryId ?? beneficiary!.stitchBeneficiaryId,
            verifiedAt: now.toISOString(),
          },
        },
      });
    });

    this.logger.log(
      `tradesafe.beneficiary.linked processed beneficiary=${beneficiary.id} userId=${beneficiary.userId}`,
    );
  }

  /**
   * Outbound payout settled — funds have left platform custody and arrived
   * in the hunter's bank account. Posts the canonical `payout_in_transit →
   * hunter_paid` ledger group with `actionType=tradesafe_payout_settled`,
   * then flips the `StitchPayout` row status to SETTLED.
   *
   * Idempotency: UNIQUE(referenceId=tradesafePayoutId, actionType) via
   * LedgerService. A Svix replay OR an honest re-delivery from TradeSafe
   * produces a single ledger group; second attempt returns `{idempotent:
   * true}` and leaves the DB unchanged.
   *
   * Kill-switch: LedgerService.postTransactionGroup checks
   * `SystemSetting.financial.kill_switch.active` and throws
   * `KillSwitchActiveError` if on. We do NOT pass `allowDuringKillSwitch`
   * — per ADR 0006 that bypass is scoped strictly to
   * `FinanceAdminService.postOverride` + `devSeedPayable`.
   *
   * TODO(R34): verify event name + payload shape with TradeSafe.
   * Current plausible-minimum:
   *   {
   *     type: 'tradesafe.payout.settled',
   *     data: { id: '<tradesafe-payout-id>' }
   *   }
   * The handler reads the TradeSafe payout id and looks up our local
   * `StitchPayout` row by `stitchPayoutId`. The row was populated with
   * the provider-returned id at `PayoutsService.initiatePayout` (line
   * 218) / `retryBatch` (line 301).
   */
  async onPayoutSettled(payload: Record<string, unknown>): Promise<void> {
    const tradesafePayoutId = this.extractPayoutId(payload);
    if (!tradesafePayoutId) {
      this.logger.warn(
        'tradesafe.payout.settled: missing payout id; ignoring',
      );
      return;
    }

    const payout = await this.prisma.stitchPayout.findUnique({
      where: { stitchPayoutId: tradesafePayoutId },
    });
    if (!payout) {
      this.logger.warn(
        `tradesafe.payout.settled: unknown tradesafePayoutId=${tradesafePayoutId}`,
      );
      return;
    }

    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: LEDGER_ACTION_TYPES.TRADESAFE_PAYOUT_SETTLED,
      referenceId: tradesafePayoutId,
      referenceType: 'StitchPayout',
      description: `TradeSafe payout settled: ${payout.id}`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.payout_in_transit,
          type: LedgerEntryType.DEBIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: tradesafePayoutId,
        },
        {
          account: LedgerAccount.hunter_paid,
          type: LedgerEntryType.CREDIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: tradesafePayoutId,
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'PAYOUT_SETTLED',
        entityType: 'StitchPayout',
        entityId: payout.id,
        afterState: {
          tradesafePayoutId,
          amountCents: payout.amountCents.toString(),
        },
      },
    });

    await this.prisma.stitchPayout.update({
      where: { id: payout.id },
      data: { status: StitchPayoutStatus.SETTLED },
    });

    this.logger.log(
      `tradesafe.payout.settled processed payout=${payout.id} tradesafePayoutId=${tradesafePayoutId}`,
    );
  }

  /**
   * Outbound payout failed — funds either never left platform custody or
   * were returned. Posts a compensating `payout_in_transit → hunter_available`
   * ledger group with `actionType=tradesafe_payout_failed` so the hunter's
   * balance returns to spendable, then flips the `StitchPayout` row status.
   *
   * Not an ADR 0006 bypass: this is a forward event (the provider told us
   * the payout failed in ordinary operation), not a post-hoc correction by
   * Finance admin. The kill-switch check still applies.
   *
   * Retry policy on the payout row follows `PayoutsService.onPayoutFailed`
   * exactly — attempts incremented, RETRY_PENDING transition at 3+.
   *
   * TODO(R34): verify event name + payload shape with TradeSafe.
   * Current plausible-minimum:
   *   {
   *     type: 'tradesafe.payout.failed',
   *     data: {
   *       id: '<tradesafe-payout-id>',
   *       failureReason: '<text>'
   *     }
   *   }
   */
  async onPayoutFailed(payload: Record<string, unknown>): Promise<void> {
    const tradesafePayoutId = this.extractPayoutId(payload);
    if (!tradesafePayoutId) {
      this.logger.warn(
        'tradesafe.payout.failed: missing payout id; ignoring',
      );
      return;
    }

    const reason = this.extractReason(payload) ?? 'unknown';
    const payout = await this.prisma.stitchPayout.findUnique({
      where: { stitchPayoutId: tradesafePayoutId },
    });
    if (!payout) {
      this.logger.warn(
        `tradesafe.payout.failed: unknown tradesafePayoutId=${tradesafePayoutId}`,
      );
      return;
    }

    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: LEDGER_ACTION_TYPES.TRADESAFE_PAYOUT_FAILED,
      referenceId: tradesafePayoutId,
      referenceType: 'StitchPayout',
      description: `TradeSafe payout failed: ${reason}`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.payout_in_transit,
          type: LedgerEntryType.DEBIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: tradesafePayoutId,
        },
        {
          account: LedgerAccount.hunter_available,
          type: LedgerEntryType.CREDIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: tradesafePayoutId,
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'PAYOUT_FAILED',
        entityType: 'StitchPayout',
        entityId: payout.id,
        reason,
        afterState: {
          tradesafePayoutId,
          amountCents: payout.amountCents.toString(),
        },
      },
    });

    const attempts = payout.attempts + 1;
    await this.prisma.stitchPayout.update({
      where: { id: payout.id },
      data: {
        status:
          attempts >= 3
            ? StitchPayoutStatus.RETRY_PENDING
            : StitchPayoutStatus.FAILED,
        attempts,
        lastAttemptAt: new Date(),
        lastError: reason,
        nextRetryAt:
          attempts >= 3
            ? null
            : new Date(Date.now() + 2 ** attempts * 60 * 60 * 1000),
      },
    });

    this.logger.log(
      `tradesafe.payout.failed processed payout=${payout.id} tradesafePayoutId=${tradesafePayoutId} reason=${reason}`,
    );
  }

  /**
   * Brand funding settled on TradeSafe's escrow (ADR 0011 §5 inbound
   * lifecycle). Posts the canonical `brand_cash_received → brand_reserve`
   * ledger group, flips the bounty DRAFT → LIVE + PENDING → PAID, and
   * records an AuditLog entry inside the same Prisma transaction.
   *
   * Idempotency anchors (Financial Non-Negotiables §4 #2, #7):
   *   - `WebhookEvent.UNIQUE(provider, externalEventId)` guard (callback
   *     controller): second delivery of the same event is a no-op.
   *   - `LedgerTransactionGroup.UNIQUE(referenceId=transactionId,
   *     actionType='TRADESAFE_FUNDS_RECEIVED')`: any double-write reaches
   *     the row and returns `{idempotent: true}` without re-posting.
   *
   * Kill-switch: routed through `LedgerService.postTransactionGroup`
   * which enforces `isKillSwitchActive()`. Inbound is gated separately
   * from outbound per ADR 0006 + 0011 §5.
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
    // commit-or-rollback unit per Financial Non-Negotiable §4 #3).
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

  // ─── payload extraction helpers ────────────────────────────────────

  private extractBeneficiaryData(payload: Record<string, unknown>): {
    tradesafeBeneficiaryId?: string;
    externalReference?: string;
  } {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const tradesafeBeneficiaryId =
      this.readString(data.id) ??
      this.readString(data.beneficiaryId) ??
      this.readString(data.tradesafeBeneficiaryId);
    const externalReference =
      this.readString(data.externalReference) ??
      this.readString(data.userId);
    return { tradesafeBeneficiaryId, externalReference };
  }

  private extractPayoutId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    return (
      this.readString(data.id) ??
      this.readString(data.payoutId) ??
      this.readString(data.tradesafePayoutId)
    );
  }

  private extractReason(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    return (
      this.readString(data.failureReason) ??
      this.readString(data.reason) ??
      this.readString(data.error)
    );
  }

  private readString(v: unknown): string | undefined {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  }
}
