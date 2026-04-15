import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  LedgerAccount,
  LedgerEntryType,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService, PostLedgerLeg } from '../ledger/ledger.service';

export interface OverrideEntryInput {
  reason: string;
  legs: PostLedgerLeg[];
  description: string;
}

@Injectable()
export class FinanceAdminService {
  private readonly logger = new Logger(FinanceAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async overview() {
    const [
      totalsByAccount,
      openExceptions,
      killSwitchRow,
      recentGroups,
    ] = await Promise.all([
      this.prisma.ledgerEntry.groupBy({
        by: ['account', 'type'],
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.recurringIssue.count({ where: { resolved: false } }),
      this.prisma.systemSetting.findUnique({
        where: { key: 'financial.kill_switch.active' },
      }),
      this.prisma.ledgerTransactionGroup.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { entries: { select: { account: true, type: true, amount: true } } },
      }),
    ]);

    const balances = new Map<string, bigint>();
    for (const row of totalsByAccount) {
      const key = row.account;
      const current = balances.get(key) ?? 0n;
      const delta = row.type === LedgerEntryType.CREDIT
        ? (row._sum.amount ?? 0n)
        : -(row._sum.amount ?? 0n);
      balances.set(key, current + delta);
    }

    return {
      killSwitchActive: killSwitchRow?.value === 'true',
      openExceptions,
      balancesByAccount: Object.fromEntries(
        Array.from(balances.entries()).map(([k, v]) => [k, v.toString()]),
      ),
      recentGroups: recentGroups.map((g) => ({
        id: g.id,
        referenceId: g.referenceId,
        actionType: g.actionType,
        description: g.description,
        createdAt: g.createdAt.toISOString(),
        totalCents: g.entries
          .filter((e) => e.type === LedgerEntryType.CREDIT)
          .reduce((s, e) => s + e.amount, 0n)
          .toString(),
      })),
    };
  }

  async inboundList(limit = 50) {
    return this.prisma.stitchPaymentLink.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { bounty: { select: { id: true, title: true, brandId: true } } },
    });
  }

  async reserves() {
    const bounties = await this.prisma.bounty.findMany({
      where: { faceValueCents: { not: null } },
      select: {
        id: true,
        title: true,
        brandId: true,
        faceValueCents: true,
        paymentStatus: true,
      },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    });
    const rows = await Promise.all(
      bounties.map(async (b) => {
        const c = await this.prisma.ledgerEntry.aggregate({
          where: { bountyId: b.id, account: LedgerAccount.brand_reserve, type: 'CREDIT' },
          _sum: { amount: true },
        });
        const d = await this.prisma.ledgerEntry.aggregate({
          where: { bountyId: b.id, account: LedgerAccount.brand_reserve, type: 'DEBIT' },
          _sum: { amount: true },
        });
        const balance = (c._sum.amount ?? 0n) - (d._sum.amount ?? 0n);
        return {
          bountyId: b.id,
          title: b.title,
          brandId: b.brandId,
          paymentStatus: b.paymentStatus,
          faceValueCents: (b.faceValueCents ?? 0n).toString(),
          reserveBalanceCents: balance.toString(),
          drift: balance !== (b.faceValueCents ?? 0n) && balance !== 0n,
        };
      }),
    );
    return rows;
  }

  async earningsPayouts() {
    const stats = await this.prisma.ledgerEntry.groupBy({
      by: ['account', 'type'],
      where: {
        account: {
          in: [
            LedgerAccount.hunter_pending,
            LedgerAccount.hunter_net_payable,
            LedgerAccount.hunter_available,
            LedgerAccount.hunter_paid,
            LedgerAccount.payout_in_transit,
          ],
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    const result: Record<string, string> = {};
    for (const row of stats) {
      const key = row.account;
      const current = BigInt(result[key] ?? '0');
      const delta = row.type === LedgerEntryType.CREDIT
        ? (row._sum.amount ?? 0n)
        : -(row._sum.amount ?? 0n);
      result[key] = (current + delta).toString();
    }
    return result;
  }

  async listRefunds() {
    return this.prisma.refund.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listExceptions() {
    return this.prisma.recurringIssue.findMany({
      orderBy: [{ resolved: 'asc' }, { lastSeenAt: 'desc' }],
      take: 200,
    });
  }

  async auditTrail(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: {
        OR: [
          { entityType: 'Refund' },
          { entityType: 'StitchPayout' },
          { entityType: 'Bounty', action: { contains: 'FUND' } },
          { entityType: 'Submission', action: { contains: 'LEDGER' } },
          { action: { contains: 'KILL_SWITCH' } },
          { action: { contains: 'OVERRIDE' } },
        ],
      },
    });
  }

  async toggleKillSwitch(
    active: boolean,
    reason: string,
    actor: { sub: string; role: string },
  ) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only SUPER_ADMIN can toggle the kill switch');
    }
    await this.ledger.setKillSwitch(active, actor.sub);
    await this.prisma.auditLog.create({
      data: {
        actorId: actor.sub,
        actorRole: UserRole.SUPER_ADMIN,
        action: active ? 'KILL_SWITCH_ACTIVATED' : 'KILL_SWITCH_DEACTIVATED',
        entityType: 'System',
        entityId: 'financial.kill_switch',
        reason,
        afterState: { active },
      },
    });
    return { active };
  }

  /**
   * Write a compensating ledger group. Allowed even when the Kill Switch is active —
   * overrides are how Super Admins restore balance after an incident.
   */
  async postOverride(input: OverrideEntryInput, actor: { sub: string; role: string }) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only SUPER_ADMIN can post overrides');
    }
    const referenceId = `override:${new Date().toISOString()}:${actor.sub.slice(0, 8)}`;
    return this.ledger.postTransactionGroup({
      actionType: 'compensating_entry',
      referenceId,
      referenceType: 'Override',
      description: input.description,
      postedBy: actor.sub,
      allowDuringKillSwitch: true,
      legs: input.legs,
      audit: {
        actorId: actor.sub,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'FINANCIAL_OVERRIDE',
        entityType: 'LedgerEntry',
        entityId: referenceId,
        reason: input.reason,
      },
    });
  }
}
