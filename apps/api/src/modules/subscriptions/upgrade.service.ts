import {
  Injectable,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LedgerAccount,
  LedgerEntryType,
  StitchSubscriptionMandateStatus,
  SubscriptionStatus as PrismaSubscriptionStatus,
  SubscriptionPaymentStatus,
  SubscriptionTier as PrismaSubscriptionTier,
} from '@prisma/client';
import {
  SubscriptionTier,
  SubscriptionEntityType,
  UserRole,
  SUBSCRIPTION_CONSTANTS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { StitchClient } from '../stitch/stitch.client';
import { PRICING } from './subscription.constants';

export interface InitiateUpgradeResult {
  /**
   * Stitch-hosted URL the client must redirect to for card-consent capture.
   */
  authorizationUrl: string;
  /**
   * Our internal StitchSubscription row id (not Stitch's subscriptionId),
   * surfaced so the client can poll / correlate on return.
   */
  mandateId: string;
  /**
   * Mandate status at the moment initiate was called. Always PENDING on a
   * brand-new mandate. If the user already has an AUTHORISED mandate we
   * short-circuit: no new Stitch call, we return the existing URL.
   */
  status: StitchSubscriptionMandateStatus;
}

/**
 * Drives the live card-consent upgrade flow.
 *
 * This service is additive: the legacy `subscribe()` path on SubscriptionsService
 * is still wired for test / fixture setup. The Upgrade UI calls
 * `initiateUpgrade()` → we create a Stitch /api/v1/subscriptions mandate and
 * return the hosted URL. Stitch sends webhooks as the mandate is authorised
 * and each period's charge is captured — those land in processConsentAuthorised
 * / processRecurringCharge.
 *
 * Financial Non-Negotiables (§4):
 *  #1 balanced: postTransactionGroup asserts sum(debits)==sum(credits).
 *  #2 idempotent: LedgerTransactionGroup UNIQUE(referenceId, actionType),
 *     referenceId=stitchPaymentId, actionType='subscription_charged'.
 *  #3 transaction-group integrity: ledger post is one $transaction.
 *  #4 integer minor units: amounts in cents.
 *  #5 append-only: only INSERTs on the ledger.
 *  #6 AuditLog: LedgerService writes in the same tx; we also write separate
 *     AUDIT entries for INITIATE / AUTHORISE / FAIL so the user-facing flow
 *     is audited even when no ledger post happens.
 *  #7 retry-safe: webhook handlers are idempotent.
 *  #8 platform custody: not applicable (subscription money is platform revenue).
 *  #9 plan snapshot: StitchSubscription.tierSnapshot + SubscriptionPayment.tierSnapshot
 *     captured at mandate creation / charge time. In-flight bounties never
 *     re-priced on tier change (enforced in bounty creation, unchanged here).
 *  #10 global fee: subscription revenue is one account; the 3.5% global fee
 *     applies to bounty flows, not subscription flows (payment-gateway.md §12
 *     — "monthly recurring", no 3.5% on recurring). We add optional legs for
 *     processing/bank fees only when Stitch reports them (> 0).
 *
 * Leg-shape note (R25, closed 2026-04-15 batch 14B):
 *   Both brand-funding (`stitch_payment_settled`) and subscription_charged use
 *   CONDITIONAL posting for `processing_expense` / `bank_charges`: the leg is
 *   only emitted when Stitch reports a positive fee amount. This is canonical
 *   and REQUIRED — `LedgerService.postTransactionGroup` rejects
 *   `amountCents <= 0n` (ledger.service.ts:108), so a "zero-amount leg" is not
 *   a representable state. A zero or omitted fee from Stitch both resolve to
 *   "no leg posted"; both shapes are balanced, both reconcile cleanly.
 *   Gross / expense reporting is handled in the Finance dashboard by joining
 *   over `gateway_clearing` DEBITs and the net `subscription_revenue` CREDIT.
 */
@Injectable()
export class UpgradeService {
  private readonly logger = new Logger(UpgradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly stitch: StitchClient,
    private readonly config: ConfigService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  private systemActorId(): string {
    const id = this.config.get<string>('STITCH_SYSTEM_ACTOR_ID', '') ?? '';
    if (!id) {
      throw new Error(
        'STITCH_SYSTEM_ACTOR_ID is not set; subscription upgrade webhook cannot write AuditLog rows',
      );
    }
    return id;
  }

  // ─── Initiate ────────────────────────────────────────

  /**
   * Kick off the live upgrade flow.
   *
   * 1. Validate target tier + caller role.
   * 2. Ensure caller has no active PRO sub already (idempotent short-circuit
   *    if a PENDING mandate already exists for the same subscription).
   * 3. Create/reuse our Subscription row in PENDING (tier FREE, status FREE
   *    until Stitch webhook confirms AUTHORISED — Non-Negotiable #9 snapshot
   *    happens on the StitchSubscription row now, on the payment row later).
   * 4. Call Stitch POST /api/v1/subscriptions.
   * 5. Persist the StitchSubscription + audit-log the initiation.
   * 6. Return the hosted URL to the UI.
   */
  async initiateUpgrade(
    actor: {
      userId: string;
      role: UserRole;
      brandId?: string;
      ipAddress?: string | null;
      fullName: string;
      email: string;
    },
    targetTier: SubscriptionTier,
  ): Promise<InitiateUpgradeResult> {
    if (targetTier !== SubscriptionTier.PRO) {
      throw new BadRequestException('Only PRO upgrade is supported');
    }
    if (!this.stitch.isEnabled()) {
      throw new BadRequestException('Card billing is not enabled on this environment');
    }

    const isHunter = actor.role === UserRole.PARTICIPANT;
    if (!isHunter && !actor.brandId) {
      throw new BadRequestException('Brand context is required for business-admin upgrade');
    }
    const entityType = isHunter ? SubscriptionEntityType.HUNTER : SubscriptionEntityType.BRAND;
    const priceMajor = PRICING[entityType];
    const amountCents = BigInt(Math.round(priceMajor * 100));

    // Find or create the platform-side Subscription row (so Stitch mandate has
    // a home immediately — we flip it to ACTIVE on the webhook).
    const existing = isHunter
      ? await this.prisma.subscription.findFirst({
          where: { userId: actor.userId, entityType },
          include: { stitchSubscription: true },
        })
      : await this.prisma.subscription.findFirst({
          where: { brandId: actor.brandId, entityType },
          include: { stitchSubscription: true },
        });

    if (existing && existing.tier === PrismaSubscriptionTier.PRO &&
        (existing.status === PrismaSubscriptionStatus.ACTIVE ||
         existing.status === PrismaSubscriptionStatus.PAST_DUE)) {
      throw new BadRequestException('Already on PRO tier');
    }

    // Idempotent short-circuit: pending mandate for the same subscription →
    // return the same hosted URL so the user can resume the flow. Non-Negotiable
    // #7: retry-safe. We do NOT issue a new Stitch subscription.
    if (existing?.stitchSubscription &&
        existing.stitchSubscription.mandateStatus === StitchSubscriptionMandateStatus.PENDING) {
      this.logger.log(
        `Upgrade initiate: returning pending mandate ${existing.stitchSubscription.id} (idempotent)`,
      );
      return {
        authorizationUrl: existing.stitchSubscription.hostedConsentUrl,
        mandateId: existing.stitchSubscription.id,
        status: existing.stitchSubscription.mandateStatus,
      };
    }

    const subscriptionId = existing
      ? existing.id
      : (
          await this.prisma.subscription.create({
            data: {
              ...(isHunter ? { userId: actor.userId } : { brandId: actor.brandId }),
              entityType,
              tier: PrismaSubscriptionTier.FREE,
              status: PrismaSubscriptionStatus.FREE,
              priceAmount: priceMajor,
            },
          })
        ).id;

    const now = new Date();
    // 1 year max horizon — Stitch rejects endDate > 3y; 1y is a safe default
    // and the mandate is cancelled when the user cancels the subscription.
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const merchantReference = `sub:${subscriptionId}:${now.getTime()}`;

    const stitchSub = await this.stitch.createSubscription({
      amountCents,
      initialAmountCents: amountCents,
      merchantReference,
      payerFullName: actor.fullName,
      payerEmail: actor.email,
      payerId: actor.userId,
      startDate: now,
      endDate,
      recurrence: {
        frequency: 'Monthly',
        interval: 1,
        byMonthDay: Math.min(now.getUTCDate(), 28),
      },
    });

    const mandate = await this.prisma.stitchSubscription.create({
      data: {
        subscriptionId,
        stitchSubscriptionId: stitchSub.id,
        stitchPaymentAuthorizationId: stitchSub.paymentAuthorizationRequestId ?? null,
        hostedConsentUrl: stitchSub.authorizationUrl,
        merchantReference,
        amountCents,
        tierSnapshot: PrismaSubscriptionTier.PRO,
        mandateStatus: StitchSubscriptionMandateStatus.PENDING,
      },
    });

    this.auditService?.log({
      actorId: actor.userId,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADE_INITIATED,
      entityType: ENTITY_TYPES.SUBSCRIPTION,
      entityId: subscriptionId,
      afterState: {
        mandateId: mandate.id,
        stitchSubscriptionId: stitchSub.id,
        tier: SubscriptionTier.PRO,
        entityType,
      },
      ipAddress: actor.ipAddress ?? null,
    });

    this.logger.log(
      `Upgrade initiated: subscription=${subscriptionId} stitch=${stitchSub.id} tier=PRO`,
    );

    return {
      authorizationUrl: stitchSub.authorizationUrl,
      mandateId: mandate.id,
      status: StitchSubscriptionMandateStatus.PENDING,
    };
  }

  // ─── Cancel the user's live Stitch mandate ───────────

  async cancelMandate(subscriptionId: string): Promise<void> {
    const mandate = await this.prisma.stitchSubscription.findUnique({
      where: { subscriptionId },
    });
    if (!mandate) return;
    if (mandate.mandateStatus === StitchSubscriptionMandateStatus.CANCELLED) return;

    try {
      await this.stitch.cancelStitchSubscription(mandate.stitchSubscriptionId);
    } catch (err) {
      this.logger.warn(
        `cancelMandate: Stitch cancel failed for ${mandate.stitchSubscriptionId} — continuing (${err instanceof Error ? err.message : String(err)})`,
      );
    }
    await this.prisma.stitchSubscription.update({
      where: { id: mandate.id },
      data: { mandateStatus: StitchSubscriptionMandateStatus.CANCELLED },
    });
  }

  // ─── Webhook: consent authorised ─────────────────────

  /**
   * CONSENT/AUTHORIZED webhook handler. Flips the mandate to AUTHORISED.
   * Does NOT post the ledger group yet — the ledger post happens when
   * SUBSCRIPTION/PAID (or SUBSCRIPTION/SETTLED) arrives, which carries the
   * concrete stitchPaymentId we use as the idempotency key.
   */
  async processConsentAuthorised(payload: Record<string, unknown>): Promise<void> {
    const stitchSubId = this.extractStitchSubscriptionId(payload);
    const consentId = this.extractConsentId(payload);
    if (!stitchSubId && !consentId) {
      this.logger.warn('consent.authorized: missing subscription + consent ids');
      return;
    }

    const mandate = stitchSubId
      ? await this.prisma.stitchSubscription.findUnique({
          where: { stitchSubscriptionId: stitchSubId },
        })
      : await this.prisma.stitchSubscription.findUnique({
          where: { stitchPaymentAuthorizationId: consentId! },
        });

    if (!mandate) {
      this.logger.warn(`consent.authorized: no mandate for stitch=${stitchSubId ?? consentId}`);
      return;
    }

    if (mandate.mandateStatus === StitchSubscriptionMandateStatus.AUTHORISED) {
      return; // idempotent
    }

    await this.prisma.stitchSubscription.update({
      where: { id: mandate.id },
      data: {
        mandateStatus: StitchSubscriptionMandateStatus.AUTHORISED,
        stitchPaymentAuthorizationId:
          mandate.stitchPaymentAuthorizationId ?? consentId ?? null,
      },
    });

    this.auditService?.log({
      actorId: this.systemActorId(),
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADE_AUTHORISED,
      entityType: ENTITY_TYPES.SUBSCRIPTION,
      entityId: mandate.subscriptionId,
      afterState: {
        mandateId: mandate.id,
        stitchSubscriptionId: mandate.stitchSubscriptionId,
      },
    });

    this.logger.log(
      `Mandate AUTHORISED: subscription=${mandate.subscriptionId} stitch=${mandate.stitchSubscriptionId}`,
    );
  }

  // ─── Webhook: recurring charge captured ──────────────

  /**
   * SUBSCRIPTION/PAID (or SETTLED) webhook handler. Creates / updates the
   * SubscriptionPayment row with plan-snapshot (Non-Negotiable #9), posts
   * the balanced ledger group (idempotent on stitchPaymentId), and flips
   * the platform Subscription to ACTIVE + extends the billing period.
   */
  async processRecurringCharge(payload: Record<string, unknown>): Promise<void> {
    const stitchSubId = this.extractStitchSubscriptionId(payload);
    const stitchPaymentId = this.extractStitchPaymentId(payload);
    const paidAmountCents = this.extractAmount(payload);
    const { processingFeeCents, bankChargeCents } = this.extractFees(payload);

    if (!stitchSubId || !stitchPaymentId) {
      this.logger.warn('subscription.paid: missing subscription or payment id');
      return;
    }

    const mandate = await this.prisma.stitchSubscription.findUnique({
      where: { stitchSubscriptionId: stitchSubId },
    });
    if (!mandate) {
      this.logger.warn(`subscription.paid: no mandate for stitch=${stitchSubId}`);
      return;
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { id: mandate.subscriptionId },
    });
    if (!sub) {
      this.logger.warn(`subscription.paid: no platform subscription for mandate=${mandate.id}`);
      return;
    }

    // The charge amount Stitch reports IS what hit the brand/user. We trust
    // the webhook amount for the ledger debit, but we still record the
    // mandate's snapshot so a bad webhook amount doesn't silently re-price.
    const chargedCents =
      paidAmountCents !== undefined && paidAmountCents > 0n
        ? paidAmountCents
        : mandate.amountCents;

    const tierAtCharge =
      (mandate.tierSnapshot as SubscriptionTier) ?? SubscriptionTier.PRO;

    // Billing period: start = now, end = +30 days (monthly).
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + SUBSCRIPTION_CONSTANTS.BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000,
    );

    // Upsert the SubscriptionPayment. providerPaymentId is UNIQUE on the
    // table (migration 20260415190000) so a webhook replay returns the
    // existing row — Non-Negotiable #7.
    const existingPayment = await this.prisma.subscriptionPayment.findUnique({
      where: { providerPaymentId: stitchPaymentId },
    });

    const payment = existingPayment
      ? existingPayment
      : await this.prisma.$transaction(async (tx) => {
          const createdPayment = await tx.subscriptionPayment.create({
            data: {
              subscriptionId: mandate.subscriptionId,
              amount: Number(chargedCents) / 100,
              status: SubscriptionPaymentStatus.SUCCEEDED,
              provider: 'stitch',
              providerPaymentId: stitchPaymentId,
              billingPeriodStart: now,
              billingPeriodEnd: periodEnd,
              paidAt: now,
              tierSnapshot: PrismaSubscriptionTier.PRO,
            },
          });

          // Flip the platform subscription to ACTIVE and extend the period.
          // Plan snapshot on the payment row handles Non-Negotiable #9; the
          // subscription row's tier reflects the currently-active tier.
          await tx.subscription.update({
            where: { id: mandate.subscriptionId },
            data: {
              tier: PrismaSubscriptionTier.PRO,
              status: PrismaSubscriptionStatus.ACTIVE,
              priceAmount: Number(chargedCents) / 100,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
              gracePeriodEndsAt: null,
              failedPaymentCount: 0,
              provider: 'stitch',
              providerSubId: mandate.stitchSubscriptionId,
            },
          });

          return createdPayment;
        });

    // Ledger post (idempotent on stitchPaymentId). Kept OUTSIDE the status
    // update tx: Non-Negotiable #2 covers replays; reconciliation picks up
    // any rare ledger-only failure. LedgerService writes its own AuditLog
    // row in-tx (Non-Negotiable #6).
    const processingFee = processingFeeCents ?? 0n;
    const bankCharge = bankChargeCents ?? 0n;
    const subscriptionRevenue = chargedCents - processingFee - bankCharge;
    if (subscriptionRevenue < 0n) {
      this.logger.error(
        `subscription.paid: fees exceed charge (charge=${chargedCents} fees=${processingFee + bankCharge}) — aborting ledger post`,
      );
      return;
    }

    try {
      await this.ledger.postTransactionGroup({
        actionType: 'subscription_charged',
        referenceId: stitchPaymentId,
        referenceType: 'SubscriptionPayment',
        description: `Subscription charged: ${mandate.subscriptionId} (PRO)`,
        postedBy: 'stitch-webhook',
        legs: [
          {
            account: LedgerAccount.gateway_clearing,
            type: LedgerEntryType.DEBIT,
            amountCents: chargedCents,
            userId: sub.userId ?? null,
            brandId: sub.brandId ?? null,
            metadata: {
              subscriptionId: mandate.subscriptionId,
              stitchSubscriptionId: mandate.stitchSubscriptionId,
              paymentId: payment.id,
              tier: tierAtCharge,
            },
          },
          {
            account: LedgerAccount.subscription_revenue,
            type: LedgerEntryType.CREDIT,
            amountCents: subscriptionRevenue,
            userId: sub.userId ?? null,
            brandId: sub.brandId ?? null,
            metadata: {
              subscriptionId: mandate.subscriptionId,
              paymentId: payment.id,
              tier: tierAtCharge,
            },
          },
          ...(processingFee > 0n
            ? [
                {
                  account: LedgerAccount.processing_expense,
                  type: LedgerEntryType.CREDIT,
                  amountCents: processingFee,
                  userId: sub.userId ?? null,
                  brandId: sub.brandId ?? null,
                },
              ]
            : []),
          ...(bankCharge > 0n
            ? [
                {
                  account: LedgerAccount.bank_charges,
                  type: LedgerEntryType.CREDIT,
                  amountCents: bankCharge,
                  userId: sub.userId ?? null,
                  brandId: sub.brandId ?? null,
                },
              ]
            : []),
        ],
        audit: {
          actorId: this.systemActorId(),
          actorRole: UserRole.SUPER_ADMIN,
          action: 'SUBSCRIPTION_CHARGED',
          entityType: 'SubscriptionPayment',
          entityId: payment.id,
          afterState: {
            subscriptionId: mandate.subscriptionId,
            tier: tierAtCharge,
            amountCents: chargedCents.toString(),
            stitchPaymentId,
          },
        },
      });
    } catch (err) {
      this.logger.error(
        `subscription.paid: ledger post failed for payment=${payment.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // Let the webhook controller mark the event FAILED for retry.
    }

    this.logger.log(
      `Subscription charged: subscription=${mandate.subscriptionId} stitchPayment=${stitchPaymentId} amount=${chargedCents}`,
    );
  }

  async processChargeFailed(payload: Record<string, unknown>): Promise<void> {
    const stitchSubId = this.extractStitchSubscriptionId(payload);
    if (!stitchSubId) return;
    const mandate = await this.prisma.stitchSubscription.findUnique({
      where: { stitchSubscriptionId: stitchSubId },
    });
    if (!mandate) return;

    const reason = this.extractReason(payload) ?? 'unknown';
    await this.prisma.stitchSubscription.update({
      where: { id: mandate.id },
      data: {
        mandateStatus: StitchSubscriptionMandateStatus.FAILED,
        lastErrorMessage: reason.slice(0, 500),
      },
    });

    this.auditService?.log({
      actorId: this.systemActorId(),
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADE_FAILED,
      entityType: ENTITY_TYPES.SUBSCRIPTION,
      entityId: mandate.subscriptionId,
      afterState: { reason },
    });
  }

  // ─── Field extraction helpers ────────────────────────

  private extractStitchSubscriptionId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const sub = (data.subscription as Record<string, unknown>) ?? data;
    const id =
      this.readString(sub.subscriptionId) ??
      this.readString(sub.id) ??
      this.readString(data.subscriptionId);
    return id;
  }

  private extractStitchPaymentId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payment = (data.payment as Record<string, unknown>) ?? data;
    return (
      this.readString(payment.paymentId) ??
      this.readString(payment.id) ??
      this.readString(data.paymentId)
    );
  }

  private extractConsentId(payload: Record<string, unknown>): string | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    return (
      this.readString(data.consentRequestId) ??
      this.readString(data.paymentAuthorizationRequestId) ??
      this.readString(data.id)
    );
  }

  private extractAmount(payload: Record<string, unknown>): bigint | undefined {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payment = (data.payment as Record<string, unknown>) ?? data;
    const raw = payment.amount ?? data.amount;
    return this.readBigInt(raw);
  }

  private extractFees(payload: Record<string, unknown>): {
    processingFeeCents?: bigint;
    bankChargeCents?: bigint;
  } {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payment = (data.payment as Record<string, unknown>) ?? data;
    const fees = (payment.fees as Array<Record<string, unknown>>) ?? [];
    let processing = 0n;
    let bank = 0n;
    for (const fee of fees) {
      const amt = this.readBigInt(fee.amount);
      if (amt == null) continue;
      if (this.readString(fee.type) === 'BANK_CHARGE') bank += amt;
      else processing += amt;
    }
    return {
      processingFeeCents: processing > 0n ? processing : undefined,
      bankChargeCents: bank > 0n ? bank : undefined,
    };
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
    return typeof v === 'string' ? v : undefined;
  }

  private readBigInt(v: unknown): bigint | undefined {
    if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.round(v));
    if (typeof v === 'string' && /^-?\d+$/.test(v)) return BigInt(v);
    if (typeof v === 'bigint') return v;
    return undefined;
  }
}
