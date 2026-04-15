import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@social-bounty/shared';
import { Audited, Roles } from '../../common/decorators';
import { FinanceExportsService } from './exports.service';

/**
 * CSV exports for the Finance Reconciliation Dashboard.
 *
 * RBAC: SUPER_ADMIN only (per claude.md Hard Rule #2 + admin-dashboard.md spec).
 * Every export is audited via @Audited so SA downloads are traceable.
 * XLSX is intentionally out of scope for this ship — can layer on later.
 */
@Controller('admin/finance/exports')
@Roles(UserRole.SUPER_ADMIN)
export class FinanceExportsController {
  constructor(private readonly svc: FinanceExportsService) {}

  @Get('inbound.csv')
  @Audited('FINANCE_EXPORT', 'System')
  async inbound(@Res() res: Response): Promise<void> {
    const csv = await this.svc.inboundCsv();
    this.send(res, csv, `finance-inbound-${this.stamp()}.csv`);
  }

  @Get('reserves.csv')
  @Audited('FINANCE_EXPORT', 'System')
  async reserves(@Res() res: Response): Promise<void> {
    const csv = await this.svc.reservesCsv();
    this.send(res, csv, `finance-reserves-${this.stamp()}.csv`);
  }

  @Get('refunds.csv')
  @Audited('FINANCE_EXPORT', 'System')
  async refunds(@Res() res: Response): Promise<void> {
    const csv = await this.svc.refundsCsv();
    this.send(res, csv, `finance-refunds-${this.stamp()}.csv`);
  }

  @Get('ledger.csv')
  @Audited('FINANCE_EXPORT', 'System')
  async ledger(
    @Query('since') since: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.svc.ledgerCsv(since);
    this.send(res, csv, `finance-ledger-${this.stamp()}.csv`);
  }

  private send(res: Response, body: string, filename: string): void {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(body);
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
