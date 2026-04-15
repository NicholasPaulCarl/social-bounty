import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface SignatureInput {
  category: string;
  system: string;
  errorCode?: string;
  context?: Record<string, unknown>;
}

export interface ConfidenceScoreBreakdown {
  system: string;
  score: number;
  criticalOpen: number;
  highOpen: number;
  recurrences90d: number;
  failedRecon7d: number;
  ineffectiveFixCount: number;
}

// Phase 4 exit criterion window: a resolved KB entry is auto-flagged as an
// "Ineffective Fix" only if both (a) it was resolved within the last 90 days
// and (b) the new recurrence lands within 90 days of that resolution.
const INEFFECTIVE_FIX_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class KbService {
  private readonly logger = new Logger(KbService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  /**
   * Stable signature for a recurring issue: same (category, system, errorCode)
   * always collapse into the same RecurringIssue row.
   */
  signature(input: SignatureInput): string {
    const payload = [input.category, input.system, input.errorCode ?? ''].join('|');
    return createHash('sha256').update(payload).digest('hex').slice(0, 16);
  }

  /**
   * Called by reconciliation / webhook failure paths. Creates a new RecurringIssue
   * or bumps the counter on an existing one. Returns {isNew, issue}.
   *
   * Phase 4 exit criterion: when the existing row is a previously-resolved KB
   * entry and the recurrence lands within 90d of its resolution, also
   * auto-flag it as an "Ineffective Fix" via flagIneffectiveFix().
   *
   * Note: the first-occurrence branch (create) never flags — there is no prior
   * resolved entry to invalidate. Auto-flagging requires a pre-existing
   * resolved row, which by construction cannot have been created in the same
   * recordRecurrence() call.
   */
  async recordRecurrence(input: {
    category: string;
    system: string;
    title: string;
    severity: 'info' | 'warning' | 'critical';
    errorCode?: string;
    metadata?: Record<string, unknown>;
  }) {
    const signature = this.signature({
      category: input.category,
      system: input.system,
      errorCode: input.errorCode,
    });
    const existing = await this.prisma.recurringIssue.findUnique({
      where: { category_signature: { category: input.category, signature } },
    });

    if (existing) {
      const now = new Date();
      const updated = await this.prisma.recurringIssue.update({
        where: { id: existing.id },
        data: {
          occurrences: { increment: 1 },
          lastSeenAt: now,
          severity: input.severity,
          metadata: input.metadata as any,
        },
      });
      this.logger.warn(
        `recurrence bumped: ${input.category}/${signature} occurrences=${updated.occurrences}`,
      );

      // Auto-flag if this is a recurrence on a previously-resolved entry
      // within the 90d window. Only possible on the update branch — the
      // create branch below has no prior resolution to invalidate.
      //
      // R23 severity gate: an `info` recurrence is too weak a signal to
      // invalidate a resolved fix. Only `warning` and `critical` recurrences
      // can auto-flag Ineffective Fix. The occurrences counter and
      // lastSeenAt still bump for info-severity recurrences above — we just
      // don't escalate to flagging.
      if (
        existing.resolved &&
        existing.resolvedAt &&
        (input.severity === 'warning' || input.severity === 'critical')
      ) {
        const sinceResolved = now.getTime() - existing.resolvedAt.getTime();
        if (sinceResolved >= 0 && sinceResolved <= INEFFECTIVE_FIX_WINDOW_MS) {
          await this.flagIneffectiveFix(input.category, signature);
        }
      }

      return { isNew: false, issue: updated };
    }

    // First occurrence: create a new stub. By definition there is no prior
    // resolved entry for this (category, signature), so we do NOT auto-flag
    // in the same run that created the row.
    const created = await this.prisma.recurringIssue.create({
      data: {
        category: input.category,
        signature,
        title: input.title,
        severity: input.severity,
        metadata: input.metadata as any,
      },
    });
    this.logger.log(`new KB stub opened: ${input.category}/${signature}`);
    return { isNew: true, issue: created };
  }

  /**
   * Idempotently flags a RecurringIssue row as `ineffectiveFix=true` and
   * writes a matching AuditLog entry. If the row is already flagged, this
   * is a no-op (no duplicate AuditLog).
   *
   * Uses STITCH_SYSTEM_ACTOR_ID as the audit actor since this is triggered
   * by automated recurrence detection, not a human admin.
   */
  async flagIneffectiveFix(category: string, signature: string): Promise<void> {
    const row = await this.prisma.recurringIssue.findUnique({
      where: { category_signature: { category, signature } },
    });
    if (!row) return;
    if (row.ineffectiveFix) {
      // Already flagged — no-op, no duplicate AuditLog.
      return;
    }

    const actorId = this.config?.get<string>('STITCH_SYSTEM_ACTOR_ID', '') ?? '';
    const now = new Date();

    await this.prisma.recurringIssue.update({
      where: { id: row.id },
      data: {
        ineffectiveFix: true,
        ineffectiveFlaggedAt: now,
        ineffectiveFlaggedBy: actorId || null,
      },
    });

    if (actorId) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorId,
            actorRole: UserRole.SUPER_ADMIN,
            action: 'KB_INEFFECTIVE_FIX_FLAGGED',
            entityType: 'RecurringIssue',
            entityId: row.id,
            beforeState: { ineffectiveFix: false } as any,
            afterState: {
              ineffectiveFix: true,
              category,
              signature,
              resolvedAt: row.resolvedAt,
              flaggedAt: now,
            } as any,
            reason: 'recurrence detected within 90d of prior resolution',
          },
        });
      } catch (err) {
        this.logger.error(
          `failed to write ineffective-fix audit log: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      this.logger.warn(
        'STITCH_SYSTEM_ACTOR_ID not set — ineffective-fix flag applied but not audit-logged',
      );
    }

    this.logger.warn(
      `KB entry auto-flagged as Ineffective Fix: ${category}/${signature} (row ${row.id})`,
    );
  }

  /**
   * Confidence score per system, per admin-dashboard.md §6:
   *   score = 100 - 20*openCritical - 10*openHigh - 5*recurrences_90d - 5*failedRecon_7d
   * clamped to [0, 100].
   *
   * Also reports `ineffectiveFixCount` per system so the Insights UI can
   * render a red "Ineffective fix(es)" Tag when > 0.
   */
  async confidenceScores(): Promise<ConfidenceScoreBreakdown[]> {
    const systems = await this.distinctSystems();
    const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results: ConfidenceScoreBreakdown[] = [];
    for (const system of systems) {
      const [criticalOpen, highOpen, recurrences, failedRecon, ineffectiveFixCount] =
        await Promise.all([
          this.prisma.recurringIssue.count({
            where: {
              metadata: { path: ['system'], equals: system } as any,
              severity: 'critical',
              resolved: false,
            },
          }),
          this.prisma.recurringIssue.count({
            where: {
              metadata: { path: ['system'], equals: system } as any,
              severity: 'warning',
              resolved: false,
            },
          }),
          this.prisma.recurringIssue.count({
            where: {
              metadata: { path: ['system'], equals: system } as any,
              lastSeenAt: { gte: cutoff90d },
              occurrences: { gte: 2 },
            },
          }),
          this.prisma.jobRun.count({
            where: {
              jobName: { contains: 'reconciliation' },
              status: 'FAILED',
              startedAt: { gte: cutoff7d },
            },
          }),
          this.prisma.recurringIssue.count({
            where: {
              metadata: { path: ['system'], equals: system } as any,
              ineffectiveFix: true,
            },
          }),
        ]);

      const raw = 100 - 20 * criticalOpen - 10 * highOpen - 5 * recurrences - 5 * failedRecon;
      const score = Math.max(0, Math.min(100, raw));
      results.push({
        system,
        score,
        criticalOpen,
        highOpen,
        recurrences90d: recurrences,
        failedRecon7d: failedRecon,
        ineffectiveFixCount,
      });
    }
    return results;
  }

  private async distinctSystems(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ system: string }[]>`
      SELECT DISTINCT metadata->>'system' AS system
        FROM recurring_issues
       WHERE metadata ? 'system'
    `;
    return rows.map((r) => r.system).filter(Boolean);
  }
}
