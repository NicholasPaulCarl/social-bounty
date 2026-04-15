import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobRunStatus, Prisma } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { KbService } from '../kb/kb.service';

export interface ReconciliationFinding {
  category: string;
  /**
   * Legacy field retained for in-memory grouping during a single run. The
   * persisted signature is hashed by KbService from (category, system, errorCode)
   * — this string is only used in logs / report output.
   */
  signature: string;
  /** Logical system for KB grouping (ledger, reconciliation, …). */
  system: string;
  /** Distinct incident id (e.g. groupId, bountyId) — fed to KbService.signature. */
  errorCode: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: Record<string, unknown>;
}

export interface ReconciliationReport {
  runId: string;
  findings: ReconciliationFinding[];
  killSwitchActivated: boolean;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    @Optional() private readonly kb?: KbService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  /**
   * System actor for AuditLog writes by this job. AuditLog.actorId has a FK to
   * users.id — hard-coded strings fail the constraint. Returns null if env is
   * unset; callers treat that as "skip audit log but still activate the kill
   * switch" rather than aborting the whole job.
   */
  private systemActorId(): string | null {
    return this.config?.get<string>('STITCH_SYSTEM_ACTOR_ID', '') || null;
  }

  /**
   * Runs the full reconciliation check set (per `md-files/financial-architecture.md` §6
   * and `md-files/implementation-phases.md` Phase 2):
   *  1. Every transaction group balances (sum credits == sum debits).
   *  2. No duplicate (referenceId, actionType) pairs with >1 group.
   *  3. Reserve vs bounty consistency: sum(brand_reserve) per bounty == faceValueCents.
   *  4. Missing legs: every LedgerTransactionGroup has >= 2 LedgerEntry rows.
   *  5. Status consistency: Bounty.paymentStatus=PAID <=> stitch_payment_settled
   *     group; Submission.status=APPROVED <=> submission_approved group.
   *  6. Wallet projection drift: cached Wallet.balance (Rand) vs ledger projection
   *     (sum hunter_available credits − debits) per user.
   *  7. Stitch vs ledger: StitchPaymentLink.status=SETTLED requires a matching
   *     stitch_payment_settled group; StitchPayout.status=SETTLED requires a
   *     matching stitch_payout_settled group.
   *
   * All checks are read-only — they never move money — and are therefore
   * Kill-Switch-safe regardless of switch state.
   */
  async run(): Promise<ReconciliationReport> {
    const run = await this.prisma.jobRun.create({
      data: { jobName: 'reconciliation-subset', status: JobRunStatus.STARTED },
    });

    const findings: ReconciliationFinding[] = [];
    try {
      findings.push(...(await this.checkGroupBalance()));
      findings.push(...(await this.checkDuplicateGroups()));
      findings.push(...(await this.checkReserveVsBounty()));
      // Phase-2 batch 11A — checks 4–7. Appended at the end per agent
      // coordination contract; methods are defined at the bottom of the class.
      findings.push(...(await this.checkMissingLegs()));
      findings.push(...(await this.checkStatusConsistency()));
      findings.push(...(await this.checkWalletProjectionDrift()));
      findings.push(...(await this.checkStitchVsLedger()));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.jobRun.update({
        where: { id: run.id },
        data: { status: JobRunStatus.FAILED, finishedAt: new Date(), error: message },
      });
      throw err;
    }

    await this.persistFindings(findings);
    const hasCritical = findings.some((f) => f.severity === 'critical');
    let killSwitchActivated = false;
    if (hasCritical) {
      // Guard against re-tripping on every cron tick: only flip when OFF.
      const alreadyActive = await this.ledger.isKillSwitchActive();
      if (!alreadyActive) {
        const criticalFindings = findings.filter((f) => f.severity === 'critical');
        await this.ledger.setKillSwitch(true, 'reconciliation-job');
        killSwitchActivated = true;
        this.logger.error(
          `reconciliation found ${criticalFindings.length} critical finding(s); Kill Switch activated`,
        );

        // Audit log the activation (Hard Rule #3 + Non-Negotiable #6). If the
        // system actor id isn't configured we log and continue — the ledger
        // state change is already committed and the JobRun record carries the
        // full finding list for traceability.
        const actorId = this.systemActorId();
        if (actorId) {
          try {
            await this.prisma.auditLog.create({
              data: {
                actorId,
                actorRole: UserRole.SUPER_ADMIN,
                action: 'KILL_SWITCH_ACTIVATED',
                entityType: 'SystemSetting',
                entityId: 'financial.kill_switch.active',
                beforeState: { value: 'false' } as Prisma.InputJsonValue,
                afterState: {
                  value: 'true',
                  trigger: 'reconciliation-job',
                  runId: run.id,
                  criticalFindings: criticalFindings.length,
                } as Prisma.InputJsonValue,
                reason: `auto-activated after ${criticalFindings.length} critical reconciliation finding(s)`,
              },
            });
          } catch (err) {
            this.logger.error(
              `failed to write kill-switch audit log: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        } else {
          this.logger.warn(
            'STITCH_SYSTEM_ACTOR_ID not set — kill-switch activation not audit-logged',
          );
        }
      }
    }

    await this.prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: findings.length === 0 ? JobRunStatus.SUCCEEDED : JobRunStatus.PARTIAL,
        finishedAt: new Date(),
        itemsSeen: findings.length,
        itemsFailed: findings.filter((f) => f.severity === 'critical').length,
        details: {
          findings: findings.map((f) => ({ ...f, detail: f.detail as Prisma.InputJsonValue })),
        } as Prisma.InputJsonValue,
      },
    });

    return { runId: run.id, findings, killSwitchActivated };
  }

  private async checkGroupBalance(): Promise<ReconciliationFinding[]> {
    // GROUP BY transactionGroupId, assert sum(credits)=sum(debits)
    const rows = await this.prisma.$queryRaw<
      { transactionGroupId: string; debit_sum: bigint; credit_sum: bigint }[]
    >`
      SELECT "transactionGroupId",
             SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) AS debit_sum,
             SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS credit_sum
        FROM ledger_entries
       WHERE status = 'COMPLETED'
       GROUP BY "transactionGroupId"
      HAVING SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END)
           <> SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END)
    `;
    return rows.map((r) => ({
      category: 'ledger-imbalance',
      signature: `imbalance:${r.transactionGroupId}`,
      system: 'ledger',
      errorCode: `imbalance:${r.transactionGroupId}`,
      severity: 'critical',
      title: `Ledger group ${r.transactionGroupId} is unbalanced`,
      detail: {
        transactionGroupId: r.transactionGroupId,
        debitCents: r.debit_sum.toString(),
        creditCents: r.credit_sum.toString(),
      },
    }));
  }

  private async checkDuplicateGroups(): Promise<ReconciliationFinding[]> {
    const rows = await this.prisma.$queryRaw<
      { referenceId: string; actionType: string; n: bigint }[]
    >`
      SELECT "referenceId", "actionType", COUNT(*) AS n
        FROM ledger_transaction_groups
       GROUP BY "referenceId", "actionType"
      HAVING COUNT(*) > 1
    `;
    return rows.map((r) => ({
      category: 'duplicate-group',
      signature: `dup:${r.actionType}:${r.referenceId}`,
      system: 'ledger',
      errorCode: `dup:${r.actionType}:${r.referenceId}`,
      severity: 'critical',
      title: `Duplicate (referenceId, actionType) pair: ${r.actionType}:${r.referenceId}`,
      detail: { referenceId: r.referenceId, actionType: r.actionType, count: Number(r.n) },
    }));
  }

  private async checkReserveVsBounty(): Promise<ReconciliationFinding[]> {
    // Single GROUP BY query — collapses the previous O(B) loop of 2 aggregate
    // round-trips per bounty into one set-based scan. Semantics are identical
    // to the prior loop:
    //   - Only PAID bounties with a non-null faceValueCents are considered.
    //   - reserveBalance = SUM(CREDIT) − SUM(DEBIT) on brand_reserve / COMPLETED
    //     entries scoped to the bounty.
    //   - Healthy states: reserveBalance == faceValueCents (LIVE, un-drawn) OR
    //     reserveBalance == 0 (fully drawn via approvals or refund).
    //   - Anything else is a `reserve-drift` warning. Severity unchanged.
    //
    // The LEFT JOIN keeps PAID bounties with zero brand_reserve entries in the
    // result set so they get COALESCEd to balance=0 (a healthy "fully drawn"
    // state — same as the old loop's behaviour when both aggregate sums were
    // null). Drift filtering happens in the HAVING clause to keep the round-trip
    // payload tight: only drifted rows cross the wire.
    //
    // Indexes used: ledger_entries_bountyId_idx + bounties_paymentStatus_idx
    // (both already exist; no new migrations required).
    //
    // Perf: see docs/perf/2026-04-15-reconciliation-benchmarks.md §5.2 for
    // before/after numbers.
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        faceValueCents: bigint;
        reserve_balance: bigint;
      }[]
    >`
      SELECT b.id,
             b."faceValueCents" AS "faceValueCents",
             COALESCE(SUM(CASE WHEN le.type = 'CREDIT' THEN le.amount ELSE 0 END), 0)
               - COALESCE(SUM(CASE WHEN le.type = 'DEBIT'  THEN le.amount ELSE 0 END), 0)
               AS reserve_balance
        FROM bounties b
        LEFT JOIN ledger_entries le
          ON le."bountyId" = b.id
         AND le.account    = 'brand_reserve'::"LedgerAccount"
         AND le.status     = 'COMPLETED'::"LedgerEntryStatus"
       WHERE b."paymentStatus" = 'PAID'::"PaymentStatus"
         AND b."faceValueCents" IS NOT NULL
       GROUP BY b.id, b."faceValueCents"
      HAVING (COALESCE(SUM(CASE WHEN le.type = 'CREDIT' THEN le.amount ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN le.type = 'DEBIT'  THEN le.amount ELSE 0 END), 0))
             <> b."faceValueCents"
         AND (COALESCE(SUM(CASE WHEN le.type = 'CREDIT' THEN le.amount ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN le.type = 'DEBIT'  THEN le.amount ELSE 0 END), 0))
             <> 0
    `;

    const findings: ReconciliationFinding[] = [];
    for (const r of rows) {
      const face = r.faceValueCents ?? 0n;
      const reserveBalance = r.reserve_balance ?? 0n;
      findings.push({
        category: 'reserve-drift',
        signature: `reserve:${r.id}`,
        system: 'ledger',
        errorCode: `reserve:${r.id}`,
        severity: 'warning',
        title: `Bounty reserve drift on ${r.id}`,
        detail: {
          bountyId: r.id,
          faceValueCents: face.toString(),
          reserveBalanceCents: reserveBalance.toString(),
          // `sumDeprecated` retained for shape compatibility with the prior
          // implementation. The sum of credits-only is no longer queried
          // separately; we report the same `reserveBalance` magnitude here as
          // the closest semantic equivalent. Downstream consumers (KB, dashboard)
          // do not key off this field.
          sumDeprecated: reserveBalance.toString(),
        },
      });
    }
    return findings;
  }

  // ─── Phase-2 reconciliation checks 4–7 (batch 11A) ────────────────────────
  // All four methods below are read-only set-based scans. They do not write
  // to the ledger, do not move money, and therefore Kill-Switch state is
  // immaterial to safety. Findings are pushed to RecurringIssue via
  // persistFindings → KbService.recordRecurrence (single-writer, signature
  // hashed by KbService).

  /**
   * Check (4) — Missing legs.
   *
   * Every double-entry transaction group MUST carry at least two LedgerEntry
   * rows (one DEBIT, one CREDIT, often more). A group with 0 or 1 entries is
   * structurally corrupt: either an interrupted post (rolled-back transaction
   * left a header but no legs) or a developer error in
   * LedgerService.postTransactionGroup. Severity: critical — flips the Kill
   * Switch via the existing run() handler.
   *
   * SQL: LEFT JOIN groups → entries, count entries per group, HAVING < 2.
   * Big-O: O(G + E) — single GROUP BY scan.
   */
  private async checkMissingLegs(): Promise<ReconciliationFinding[]> {
    const rows = await this.prisma.$queryRaw<
      { transactionGroupId: string; leg_count: bigint; actionType: string; referenceId: string }[]
    >`
      SELECT g.id  AS "transactionGroupId",
             g."actionType",
             g."referenceId",
             COUNT(le.id) AS leg_count
        FROM ledger_transaction_groups g
        LEFT JOIN ledger_entries le
          ON le."transactionGroupId" = g.id
       GROUP BY g.id, g."actionType", g."referenceId"
      HAVING COUNT(le.id) < 2
    `;
    return rows.map((r) => ({
      category: 'missing-legs',
      signature: `missing-legs:${r.transactionGroupId}`,
      system: 'ledger',
      errorCode: `missing-legs:${r.transactionGroupId}`,
      severity: 'critical',
      title: `Ledger group ${r.transactionGroupId} has fewer than 2 legs`,
      detail: {
        transactionGroupId: r.transactionGroupId,
        legCount: Number(r.leg_count),
        actionType: r.actionType,
        referenceId: r.referenceId,
      },
    }));
  }

  /**
   * Check (5) — Status consistency.
   *
   * Cross-table invariants between business state and the ledger:
   *
   *   (a) Bounty.paymentStatus='PAID' ⇔ a `stitch_payment_settled` group
   *       exists for one of the bounty's StitchPaymentLink.stitchPaymentId
   *       values. Both directions raise a `warning` (not critical — a
   *       transient lag between webhook and DB write can produce the same
   *       symptom; the KB-confidence loop catches recurrence).
   *
   *   (b) Submission.status='APPROVED' ⇔ a `submission_approved` group
   *       exists with referenceId = submissionId.
   *
   * Big-O: O(B + S + G) — four set-based anti-joins.
   */
  private async checkStatusConsistency(): Promise<ReconciliationFinding[]> {
    const findings: ReconciliationFinding[] = [];

    // (a1) PAID bounty without any stitch_payment_settled group.
    // Match via StitchPaymentLink.stitchPaymentId (the canonical referenceId
    // for stitch_payment_settled per BrandFundingHandler).
    const paidWithoutGroup = await this.prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT b.id
        FROM bounties b
       WHERE b."paymentStatus" = 'PAID'::"PaymentStatus"
         AND NOT EXISTS (
           SELECT 1
             FROM stitch_payment_links spl
             JOIN ledger_transaction_groups g
               ON g."referenceId" = spl."stitchPaymentId"
              AND g."actionType"  = 'stitch_payment_settled'
            WHERE spl."bountyId" = b.id
              AND spl."stitchPaymentId" IS NOT NULL
         )
    `;
    for (const r of paidWithoutGroup) {
      findings.push({
        category: 'status-mismatch',
        signature: `status-mismatch:bounty:${r.id}`,
        system: 'ledger',
        errorCode: `status-mismatch:bounty:${r.id}`,
        severity: 'warning',
        title: `Bounty ${r.id} marked PAID but no stitch_payment_settled ledger group exists`,
        detail: { bountyId: r.id, direction: 'bounty-without-group' },
      });
    }

    // (a2) stitch_payment_settled group without a corresponding PAID bounty.
    const groupWithoutPaid = await this.prisma.$queryRaw<
      { groupId: string; referenceId: string; bountyId: string | null }[]
    >`
      SELECT g.id           AS "groupId",
             g."referenceId" AS "referenceId",
             spl."bountyId"  AS "bountyId"
        FROM ledger_transaction_groups g
        LEFT JOIN stitch_payment_links spl
          ON spl."stitchPaymentId" = g."referenceId"
        LEFT JOIN bounties b
          ON b.id = spl."bountyId"
       WHERE g."actionType" = 'stitch_payment_settled'
         AND (spl.id IS NULL OR b."paymentStatus" <> 'PAID'::"PaymentStatus")
    `;
    for (const r of groupWithoutPaid) {
      const bountyKey = r.bountyId ?? r.referenceId;
      findings.push({
        category: 'status-mismatch',
        signature: `status-mismatch:bounty:${bountyKey}`,
        system: 'ledger',
        errorCode: `status-mismatch:bounty:${bountyKey}`,
        severity: 'warning',
        title: `stitch_payment_settled group ${r.groupId} has no PAID bounty match`,
        detail: {
          transactionGroupId: r.groupId,
          stitchPaymentId: r.referenceId,
          bountyId: r.bountyId,
          direction: 'group-without-bounty',
        },
      });
    }

    // (b1) APPROVED submission without a submission_approved group.
    const approvedWithoutGroup = await this.prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT s.id
        FROM submissions s
       WHERE s.status = 'APPROVED'::"SubmissionStatus"
         AND NOT EXISTS (
           SELECT 1
             FROM ledger_transaction_groups g
            WHERE g."actionType"  = 'submission_approved'
              AND g."referenceId" = s.id
         )
    `;
    for (const r of approvedWithoutGroup) {
      findings.push({
        category: 'status-mismatch',
        signature: `status-mismatch:submission:${r.id}`,
        system: 'ledger',
        errorCode: `status-mismatch:submission:${r.id}`,
        severity: 'warning',
        title: `Submission ${r.id} APPROVED but no submission_approved ledger group exists`,
        detail: { submissionId: r.id, direction: 'submission-without-group' },
      });
    }

    // (b2) submission_approved group without an APPROVED submission.
    const groupWithoutApproved = await this.prisma.$queryRaw<
      { groupId: string; submissionId: string }[]
    >`
      SELECT g.id           AS "groupId",
             g."referenceId" AS "submissionId"
        FROM ledger_transaction_groups g
        LEFT JOIN submissions s
          ON s.id = g."referenceId"
       WHERE g."actionType" = 'submission_approved'
         AND (s.id IS NULL OR s.status <> 'APPROVED'::"SubmissionStatus")
    `;
    for (const r of groupWithoutApproved) {
      findings.push({
        category: 'status-mismatch',
        signature: `status-mismatch:submission:${r.submissionId}`,
        system: 'ledger',
        errorCode: `status-mismatch:submission:${r.submissionId}`,
        severity: 'warning',
        title: `submission_approved group ${r.groupId} has no APPROVED submission match`,
        detail: {
          transactionGroupId: r.groupId,
          submissionId: r.submissionId,
          direction: 'group-without-submission',
        },
      });
    }

    return findings;
  }

  /**
   * Check (6) — Wallet projection drift.
   *
   * Per ADR 0002 (`docs/adr/0002-wallet-read-model-projection.md`), `Wallet`
   * is kept as a *cached projection* over `LedgerEntry` (account =
   * 'hunter_available', status = COMPLETED). The legacy WalletService still
   * mutates `Wallet.balance` directly when crediting/debiting; the ledger is
   * the authoritative source. ADR 0002 explicitly mandates this drift check:
   * "A reconciliation check compares cached Wallet.balance against the
   * ledger projection and raises an exception on drift."
   *
   * Implementation:
   *   - Compute per-user ledger projection (BigInt cents) from
   *     hunter_available COMPLETED entries.
   *   - Compare against `Wallet.balance` (Decimal Rand) ×100.
   *   - Drift > 0 cents → `warning` finding (not critical: a single missed
   *     update is recoverable; persistent drift surfaces via KB recurrence).
   *
   * Skip rule: rows where no Wallet has been materialised (FULL JOIN's right
   * side null) are skipped per ADR 0002 — pre-ledger users out of scope, and
   * post-ledger users without a Wallet row simply read the ledger directly.
   *
   * Big-O: O(U + E_h) where U = users with wallets and E_h = hunter_available
   * ledger entries. Single CTE join, one round-trip.
   */
  private async checkWalletProjectionDrift(): Promise<ReconciliationFinding[]> {
    const rows = await this.prisma.$queryRaw<
      {
        userId: string;
        cached_balance_cents: bigint | null;
        projected_balance_cents: bigint | null;
        wallet_id: string | null;
      }[]
    >`
      WITH proj AS (
        SELECT le."userId" AS user_id,
               COALESCE(SUM(CASE WHEN le.type = 'CREDIT' THEN le.amount ELSE 0 END), 0)
                 - COALESCE(SUM(CASE WHEN le.type = 'DEBIT'  THEN le.amount ELSE 0 END), 0)
                 AS projected_cents
          FROM ledger_entries le
         WHERE le.account = 'hunter_available'::"LedgerAccount"
           AND le.status  = 'COMPLETED'::"LedgerEntryStatus"
           AND le."userId" IS NOT NULL
         GROUP BY le."userId"
      ),
      cache AS (
        SELECT w."userId" AS user_id,
               w.id       AS wallet_id,
               -- balance is Decimal Rand; convert to cents (×100) for comparison.
               (w.balance * 100)::bigint AS cached_cents
          FROM wallets w
      )
      SELECT COALESCE(c.user_id, p.user_id) AS "userId",
             c.cached_cents                  AS cached_balance_cents,
             p.projected_cents               AS projected_balance_cents,
             c.wallet_id                     AS wallet_id
        FROM cache c
        FULL OUTER JOIN proj p ON p.user_id = c.user_id
       WHERE COALESCE(c.cached_cents, 0) <> COALESCE(p.projected_cents, 0)
    `;

    const findings: ReconciliationFinding[] = [];
    for (const r of rows) {
      // Per ADR 0002, only users with a materialised Wallet row are in scope
      // for drift reporting. A null wallet_id means the ledger has activity
      // for a user without a cached Wallet — by ADR 0002 the ledger is
      // authoritative and the projection is computed on demand, so this is
      // not drift, just an absence of the optional cache.
      if (r.wallet_id === null) continue;
      const cached = r.cached_balance_cents ?? 0n;
      const projected = r.projected_balance_cents ?? 0n;
      findings.push({
        category: 'wallet-projection-drift',
        signature: `wallet-drift:${r.userId}`,
        system: 'ledger',
        errorCode: `wallet-drift:${r.userId}`,
        severity: 'warning',
        title: `Wallet cache drift for user ${r.userId}`,
        detail: {
          userId: r.userId,
          cachedBalanceCents: cached.toString(),
          projectedBalanceCents: projected.toString(),
          driftCents: (cached - projected).toString(),
        },
      });
    }
    return findings;
  }

  /**
   * Check (7) — Stitch vs ledger.
   *
   * For every Stitch artefact in a terminal "money moved" state, a
   * corresponding ledger group MUST exist:
   *
   *   StitchPaymentLink.status = SETTLED  ⇒ stitch_payment_settled group
   *     keyed on `stitchPaymentId`.
   *   StitchPayout.status = SETTLED       ⇒ stitch_payout_settled group
   *     keyed on `stitchPayoutId`.
   *
   * NOTE: the spec text uses the phrase "status='PAID'" but the Prisma enums
   * (`StitchPaymentLinkStatus`, `StitchPayoutStatus`) do not include PAID;
   * the terminal settlement state is `SETTLED` in both. We use SETTLED to
   * match the actual schema and runtime values written by
   * BrandFundingHandler / PayoutsService.
   *
   * Severity: critical (Stitch confirmed money moved but the ledger has no
   * record — the canonical "money is missing from books" case).
   *
   * Big-O: O(L + P) — two anti-joins with no per-row work.
   */
  private async checkStitchVsLedger(): Promise<ReconciliationFinding[]> {
    const findings: ReconciliationFinding[] = [];

    // (a) SETTLED StitchPaymentLink without stitch_payment_settled group.
    const orphanLinks = await this.prisma.$queryRaw<
      { id: string; stitchPaymentId: string | null; bountyId: string }[]
    >`
      SELECT spl.id                AS id,
             spl."stitchPaymentId" AS "stitchPaymentId",
             spl."bountyId"        AS "bountyId"
        FROM stitch_payment_links spl
       WHERE spl.status = 'SETTLED'::"StitchPaymentLinkStatus"
         AND spl."stitchPaymentId" IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
             FROM ledger_transaction_groups g
            WHERE g."actionType"  = 'stitch_payment_settled'
              AND g."referenceId" = spl."stitchPaymentId"
         )
    `;
    for (const r of orphanLinks) {
      const externalId = r.stitchPaymentId ?? r.id;
      findings.push({
        category: 'stitch-ledger-gap',
        signature: `stitch-ledger-gap:${externalId}`,
        system: 'ledger',
        errorCode: `stitch-ledger-gap:${externalId}`,
        severity: 'critical',
        title: `StitchPaymentLink ${r.id} SETTLED but no stitch_payment_settled ledger group`,
        detail: {
          stitchPaymentLinkId: r.id,
          stitchPaymentId: r.stitchPaymentId,
          bountyId: r.bountyId,
          kind: 'payment',
        },
      });
    }

    // (b) SETTLED StitchPayout without stitch_payout_settled group.
    const orphanPayouts = await this.prisma.$queryRaw<
      { id: string; stitchPayoutId: string | null; userId: string }[]
    >`
      SELECT sp.id                AS id,
             sp."stitchPayoutId" AS "stitchPayoutId",
             sp."userId"         AS "userId"
        FROM stitch_payouts sp
       WHERE sp.status = 'SETTLED'::"StitchPayoutStatus"
         AND sp."stitchPayoutId" IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
             FROM ledger_transaction_groups g
            WHERE g."actionType"  = 'stitch_payout_settled'
              AND g."referenceId" = sp."stitchPayoutId"
         )
    `;
    for (const r of orphanPayouts) {
      const externalId = r.stitchPayoutId ?? r.id;
      findings.push({
        category: 'stitch-ledger-gap',
        signature: `stitch-ledger-gap:${externalId}`,
        system: 'ledger',
        errorCode: `stitch-ledger-gap:${externalId}`,
        severity: 'critical',
        title: `StitchPayout ${r.id} SETTLED but no stitch_payout_settled ledger group`,
        detail: {
          stitchPayoutDbId: r.id,
          stitchPayoutId: r.stitchPayoutId,
          userId: r.userId,
          kind: 'payout',
        },
      });
    }

    return findings;
  }

  /**
   * Route RecurringIssue writes through KbService so reconciliation findings
   * share the same signature hashing + bump-vs-create semantics as webhook
   * failure findings. metadata.system is populated so the admin dashboard's
   * per-system confidence score can group correctly.
   *
   * Falls back to the legacy prisma.recurringIssue.upsert path only if KbService
   * isn't wired (which shouldn't happen in production — KbModule is @Global —
   * but keeps older unit tests green).
   */
  private async persistFindings(findings: ReconciliationFinding[]): Promise<void> {
    for (const f of findings) {
      if (this.kb) {
        await this.kb.recordRecurrence({
          category: f.category,
          system: f.system,
          errorCode: f.errorCode,
          title: f.title,
          severity: f.severity,
          metadata: { ...f.detail, system: f.system },
        });
      } else {
        await this.prisma.recurringIssue.upsert({
          where: { category_signature: { category: f.category, signature: f.signature } },
          create: {
            category: f.category,
            signature: f.signature,
            title: f.title,
            severity: f.severity,
            metadata: f.detail as Prisma.InputJsonValue,
          },
          update: {
            lastSeenAt: new Date(),
            occurrences: { increment: 1 },
            metadata: f.detail as Prisma.InputJsonValue,
            severity: f.severity,
          },
        });
      }
    }
  }
}
