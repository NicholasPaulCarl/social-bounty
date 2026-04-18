import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LedgerAccount,
  LedgerEntryType,
} from '@prisma/client';
import {
  AdminVisibilityFailureListResponse,
  TransactionGroupDetail,
  UserRole,
  VisibilityFailureRow,
  VisibilityHistoryRow,
} from '@social-bounty/shared';
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
    private readonly config: ConfigService,
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

  /**
   * Platform-wide StitchPayout listing for SUPER_ADMIN triage. Paginated,
   * newest-first, joined with User so operators see hunter identity alongside
   * status and retry diagnostics. bigint cents serialised as strings.
   */
  async listPayouts(page = 1, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = Math.max((page - 1) * take, 0);
    const [rows, total] = await Promise.all([
      this.prisma.stitchPayout.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          userId: true,
          amountCents: true,
          currency: true,
          status: true,
          attempts: true,
          lastError: true,
          nextRetryAt: true,
          createdAt: true,
          stitchPayoutId: true,
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.stitchPayout.count(),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        email: r.user?.email ?? '',
        firstName: r.user?.firstName ?? '',
        lastName: r.user?.lastName ?? '',
        amountCents: r.amountCents.toString(),
        currency: r.currency,
        status: r.status,
        attempts: r.attempts,
        lastError: r.lastError,
        nextRetryAt: r.nextRetryAt ? r.nextRetryAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        stitchPayoutId: r.stitchPayoutId,
      })),
      meta: {
        page,
        limit: take,
        total,
        totalPages: Math.max(Math.ceil(total / take), 1),
      },
    };
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
   * DEV-ONLY: seed a fully-cleared hunter_net_payable position for a user so
   * the payout job can pick them up immediately, bypassing brand-funding and
   * approval. Refuses to run when PAYMENTS_PROVIDER === 'stitch_live'.
   *
   * The ledger group is balanced by debiting compensating_entry — it does NOT
   * represent real economic activity and is intended only for smoke-testing
   * the outbound payout loop.
   */
  async devSeedPayable(
    input: { userId: string; faceValueCents: bigint },
    actor: { sub: string; role: string },
  ) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can seed payable');
    }
    const provider = this.config.get<string>('PAYMENTS_PROVIDER', 'none');
    if (provider === 'stitch_live') {
      throw new ForbiddenException(
        'devSeedPayable is disabled when PAYMENTS_PROVIDER=stitch_live',
      );
    }
    if (input.faceValueCents <= 0n) {
      throw new BadRequestException('faceValueCents must be positive');
    }
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new BadRequestException('userId not found');

    // Unique-per-call reference so repeated seeds work for the same user.
    const referenceId = `devseed:${input.userId}:${Date.now()}`;
    // clearanceReleaseAt in the past so the clearance job picks it up immediately.
    const releaseAt = new Date(Date.now() - 60 * 1000);

    return this.ledger.postTransactionGroup({
      actionType: 'compensating_entry',
      referenceId,
      referenceType: 'DevSeed',
      description: `DEV seed hunter_net_payable ${input.faceValueCents} for ${input.userId}`,
      postedBy: actor.sub,
      allowDuringKillSwitch: true,
      legs: [
        {
          // Parking account for the debit side — a compensating entry the
          // reconciliation engine will flag as out-of-band on purpose.
          account: LedgerAccount.brand_reserve,
          type: LedgerEntryType.DEBIT,
          amountCents: input.faceValueCents,
        },
        {
          account: LedgerAccount.hunter_net_payable,
          type: LedgerEntryType.CREDIT,
          amountCents: input.faceValueCents,
          userId: input.userId,
          clearanceReleaseAt: releaseAt,
        },
      ],
      audit: {
        actorId: actor.sub,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'DEV_SEED_PAYABLE',
        entityType: 'User',
        entityId: input.userId,
        reason: 'Dev-only seed for payout smoke test',
        afterState: {
          faceValueCents: input.faceValueCents.toString(),
          clearanceReleaseAt: releaseAt.toISOString(),
        },
      },
    });
  }

  /**
   * Fetch a ledger transaction group + its entries + linked AuditLog row.
   *
   * Drill-down view for the Admin Finance Reconciliation Dashboard. Values are
   * normalised into the shared `TransactionGroupDetail` shape: BigInt → string,
   * Date → ISO string. Throws NotFoundException on unknown id.
   */
  async getTransactionGroup(id: string): Promise<TransactionGroupDetail> {
    const group = await this.prisma.ledgerTransactionGroup.findUnique({
      where: { id },
      include: { entries: { orderBy: { createdAt: 'asc' } } },
    });
    if (!group) {
      throw new NotFoundException(`LedgerTransactionGroup ${id} not found`);
    }

    const auditLog = group.auditLogId
      ? await this.prisma.auditLog.findUnique({ where: { id: group.auditLogId } })
      : null;

    return {
      group: {
        id: group.id,
        referenceId: group.referenceId,
        actionType: group.actionType,
        description: group.description,
        createdAt: group.createdAt.toISOString(),
        auditLogId: group.auditLogId ?? null,
      },
      entries: group.entries.map((e) => ({
        id: e.id,
        account: e.account,
        type: e.type as 'DEBIT' | 'CREDIT',
        amountCents: e.amount.toString(),
        currency: e.currency,
        status: e.status,
        userId: e.userId ?? null,
        brandId: e.brandId ?? null,
        bountyId: e.bountyId ?? null,
        submissionId: e.submissionId ?? null,
        referenceId: e.referenceId,
        referenceType: e.referenceType,
        actionType: e.actionType,
        externalReference: e.externalReference ?? null,
        parentEntryId: e.parentEntryId ?? null,
        clearanceReleaseAt: e.clearanceReleaseAt
          ? e.clearanceReleaseAt.toISOString()
          : null,
        metadata: (e.metadata as Record<string, unknown> | null) ?? null,
        postedBy: e.postedBy,
        createdAt: e.createdAt.toISOString(),
      })),
      auditLog: auditLog
        ? {
            id: auditLog.id,
            actorId: auditLog.actorId,
            actorRole: auditLog.actorRole,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            beforeState:
              (auditLog.beforeState as Record<string, unknown> | null) ?? null,
            afterState:
              (auditLog.afterState as Record<string, unknown> | null) ?? null,
            reason: auditLog.reason ?? null,
            createdAt: auditLog.createdAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * Phase 3B: list submissions whose `consecutiveVisibilityFailures > 0`.
   *
   * Surfaces the post-approval auto-refund flow (ADR 0010) for SUPER_ADMIN
   * triage: every row exposes the bounty / brand / hunter triple, the
   * latest scrape error, and a count of historical re-check attempts so
   * operators can drill into a per-URL timeline.
   *
   * Single Prisma query with includes — no N+1. The history aggregate uses
   * Prisma's `_count` on the relation; `latestErrorMessage` is plucked from
   * the most recent FAILED row across `urlScrapes.histories` (we sort the
   * one-per-urlScrape histories client-side after eager loading because the
   * "first failed across N urlScrape children" semantics aren't expressible
   * as a single relation predicate).
   */
  async listVisibilityFailures(
    page = 1,
    limit = 25,
  ): Promise<AdminVisibilityFailureListResponse> {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = Math.max((page - 1) * take, 0);

    // Single findMany + count round-trip. We pull each urlScrape with its
    // latest history row (take: 1, ordered desc by checkedAt) AND a _count
    // of all histories so the row can show "history (N)". The latest
    // FAILED message across all urlScrapes is then computed in the mapper.
    const [rows, total] = await Promise.all([
      this.prisma.submission.findMany({
        where: { consecutiveVisibilityFailures: { gt: 0 } },
        orderBy: [
          { consecutiveVisibilityFailures: 'desc' },
          { lastVisibilityCheckAt: 'desc' },
        ],
        skip,
        take,
        include: {
          bounty: {
            select: {
              id: true,
              title: true,
              brand: { select: { id: true, name: true } },
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
          urlScrapes: {
            select: {
              id: true,
              scrapeStatus: true,
              errorMessage: true,
              updatedAt: true,
            },
          },
          // _count.histories aggregates across the urlScrape children,
          // giving the per-submission history row count for the UI badge.
          _count: { select: { urlScrapeHistories: true } },
        },
      }),
      this.prisma.submission.count({
        where: { consecutiveVisibilityFailures: { gt: 0 } },
      }),
    ]);

    const data: VisibilityFailureRow[] = rows.map((s) => {
      // Pick the most recent FAILED row's errorMessage. Fall back to the
      // most recent non-null error across all urlScrapes if none are
      // currently FAILED (rare — only happens if the row has been reset
      // mid-flight). Returns null if no error has ever been recorded.
      const failed = s.urlScrapes
        .filter((u) => u.scrapeStatus === 'FAILED' && u.errorMessage)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      const latestErrorMessage =
        failed[0]?.errorMessage ??
        s.urlScrapes
          .filter((u) => u.errorMessage)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
          ?.errorMessage ??
        null;

      const hunterName =
        `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim() ||
        s.userId;

      return {
        submissionId: s.id,
        bountyId: s.bounty.id,
        bountyTitle: s.bounty.title,
        brandId: s.bounty.brand.id,
        brandName: s.bounty.brand.name,
        hunterId: s.userId,
        hunterName,
        approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
        lastVisibilityCheckAt: s.lastVisibilityCheckAt
          ? s.lastVisibilityCheckAt.toISOString()
          : null,
        consecutiveVisibilityFailures: s.consecutiveVisibilityFailures,
        latestErrorMessage,
        historyRowCount: s._count.urlScrapeHistories,
      };
    });

    return {
      data,
      meta: {
        page,
        limit: take,
        total,
        totalPages: Math.max(Math.ceil(total / take), 1),
      },
    };
  }

  /**
   * Phase 3B: per-submission visibility re-check history.
   *
   * Returns every SubmissionUrlScrapeHistory row for one submission,
   * newest-first. Throws NotFoundException when the submission id is
   * unknown so the UI can render a clean 404 rather than an empty list
   * silently. JSON columns are passed through as-is (already plain objects
   * from Prisma's JSON deserialisation), Dates serialised to ISO strings.
   */
  async listVisibilityHistory(
    submissionId: string,
  ): Promise<VisibilityHistoryRow[]> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });
    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    const rows = await this.prisma.submissionUrlScrapeHistory.findMany({
      where: { submissionId },
      orderBy: { checkedAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      urlScrapeId: r.urlScrapeId,
      url: r.url,
      channel: r.channel,
      format: r.format,
      scrapeStatus: r.scrapeStatus,
      scrapeResult: (r.scrapeResult as Record<string, unknown> | null) ?? null,
      verificationChecks:
        (r.verificationChecks as Array<Record<string, unknown>> | null) ??
        null,
      errorMessage: r.errorMessage ?? null,
      checkedAt: r.checkedAt.toISOString(),
    }));
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
