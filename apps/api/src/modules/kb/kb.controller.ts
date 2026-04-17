import { Controller, Get, Param } from '@nestjs/common';
import { UserRole, KbSystemIssueRow } from '@social-bounty/shared';
import { Roles } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { KbService } from './kb.service';

@Controller('admin/kb')
@Roles(UserRole.SUPER_ADMIN)
export class KbController {
  constructor(
    private readonly kb: KbService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('confidence')
  async confidence() {
    return this.kb.confidenceScores();
  }

  /**
   * Per-system KB drill-down. Returns every RecurringIssue row whose
   * metadata.system matches the path param, ordered by most recent
   * occurrence first. Drives the /admin/finance/insights/[system] page.
   *
   * Security: @Roles(SUPER_ADMIN) is inherited from the controller-level
   * decorator above.
   */
  @Get('insights/:system')
  async systemInsights(@Param('system') system: string): Promise<KbSystemIssueRow[]> {
    const rows = await this.prisma.recurringIssue.findMany({
      where: {
        metadata: { path: ['system'], equals: system } as any,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      signature: r.signature,
      title: r.title,
      severity: r.severity,
      occurrences: r.occurrences,
      ineffectiveFix: r.ineffectiveFix,
      resolved: r.resolved,
      firstSeenAt: r.firstSeenAt.toISOString(),
      lastSeenAt: r.lastSeenAt.toISOString(),
      kbEntryRef: r.kbEntryRef,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    }));
  }
}
