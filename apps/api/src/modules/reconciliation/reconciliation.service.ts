import { Injectable, Logger } from '@nestjs/common';
import { JobRunStatus, LedgerAccount, LedgerEntryType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

export interface ReconciliationFinding {
  category: string;
  signature: string;
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
  ) {}

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
      const alreadyActive = await this.ledger.isKillSwitchActive();
      if (!alreadyActive) {
        await this.ledger.setKillSwitch(true, 'reconciliation-job');
        killSwitchActivated = true;
        this.logger.error(
          `reconciliation found ${findings.filter((f) => f.severity === 'critical').length} critical finding(s); Kill Switch activated`,
        );
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

  private async persistFindings(findings: ReconciliationFinding[]): Promise<void> {
    for (const f of findings) {
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
