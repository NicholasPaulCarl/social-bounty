import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobRunStatus, LedgerAccount, LedgerEntryType, Prisma } from '@prisma/client';
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
   * Runs the Phase 1 subset of reconciliation checks:
   *  1. Every transaction group balances (sum credits == sum debits).
   *  2. No duplicate (referenceId, actionType) pairs with >1 group.
   *  3. Reserve vs bounty consistency: sum(brand_reserve) per bounty == faceValueCents.
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
    const bounties = await this.prisma.bounty.findMany({
      where: { faceValueCents: { not: null }, paymentStatus: 'PAID' },
      select: { id: true, faceValueCents: true },
    });
    const findings: ReconciliationFinding[] = [];
    for (const b of bounties) {
      const agg = await this.prisma.ledgerEntry.aggregate({
        where: {
          bountyId: b.id,
          account: LedgerAccount.brand_reserve,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      });
      const debitAgg = await this.prisma.ledgerEntry.aggregate({
        where: {
          bountyId: b.id,
          account: LedgerAccount.brand_reserve,
          status: 'COMPLETED',
          type: LedgerEntryType.DEBIT,
        },
        _sum: { amount: true },
      });
      const creditAgg = await this.prisma.ledgerEntry.aggregate({
        where: {
          bountyId: b.id,
          account: LedgerAccount.brand_reserve,
          status: 'COMPLETED',
          type: LedgerEntryType.CREDIT,
        },
        _sum: { amount: true },
      });
      const credits = creditAgg._sum.amount ?? 0n;
      const debits = debitAgg._sum.amount ?? 0n;
      const reserveBalance = credits - debits;
      const face = b.faceValueCents ?? 0n;
      // Healthy states: reserveBalance == faceValueCents (bounty LIVE and un-drawn) OR
      //                  reserveBalance == 0 (bounty fully drawn via approvals or refund).
      if (reserveBalance !== face && reserveBalance !== 0n) {
        findings.push({
          category: 'reserve-drift',
          signature: `reserve:${b.id}`,
          system: 'ledger',
          errorCode: `reserve:${b.id}`,
          severity: 'warning',
          title: `Bounty reserve drift on ${b.id}`,
          detail: {
            bountyId: b.id,
            faceValueCents: face.toString(),
            reserveBalanceCents: reserveBalance.toString(),
            sumDeprecated: agg._sum.amount?.toString() ?? '0',
          },
        });
      }
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
