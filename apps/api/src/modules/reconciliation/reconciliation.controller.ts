import { Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { Audited, Roles } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { ReconciliationService } from './reconciliation.service';

@Controller('admin/finance/reconciliation')
@Roles(UserRole.SUPER_ADMIN)
export class ReconciliationController {
  constructor(
    private readonly recon: ReconciliationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('run')
  @Audited('RECONCILIATION_MANUAL_RUN', 'System')
  async runNow() {
    return this.recon.run();
  }

  @Get('exceptions')
  async listExceptions(@Query('resolved') resolved?: string) {
    return this.prisma.recurringIssue.findMany({
      where: resolved === 'true' ? { resolved: true } : resolved === 'false' ? { resolved: false } : {},
      orderBy: { lastSeenAt: 'desc' },
      take: 200,
    });
  }
}
