import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LedgerAccount,
  LedgerEntryType,
  StitchPayoutStatus,
} from '@prisma/client';
import { LEDGER_ACTION_TYPES, UserRole } from '@social-bounty/shared';
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
