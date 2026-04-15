import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
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
}

@Injectable()
export class KbService {
  private readonly logger = new Logger(KbService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      const updated = await this.prisma.recurringIssue.update({
        where: { id: existing.id },
        data: {
          occurrences: { increment: 1 },
          lastSeenAt: new Date(),
          severity: input.severity,
          metadata: input.metadata as any,
        },
      });
      this.logger.warn(
        `recurrence bumped: ${input.category}/${signature} occurrences=${updated.occurrences}`,
      );
      return { isNew: false, issue: updated };
    }

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
   * Confidence score per system, per admin-dashboard.md §6:
   *   score = 100 - 20*openCritical - 10*openHigh - 5*recurrences_90d - 5*failedRecon_7d
   * clamped to [0, 100].
   */
  async confidenceScores(): Promise<ConfidenceScoreBreakdown[]> {
    const systems = await this.distinctSystems();
    const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results: ConfidenceScoreBreakdown[] = [];
    for (const system of systems) {
      const [criticalOpen, highOpen, recurrences, failedRecon] = await Promise.all([
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
      ]);

      const raw = 100 - 20 * criticalOpen - 10 * highOpen - 5 * recurrences - 5 * failedRecon;
      const score = Math.max(0, Math.min(100, raw));
      results.push({ system, score, criticalOpen, highOpen, recurrences90d: recurrences, failedRecon7d: failedRecon });
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
