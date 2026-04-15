import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { FinanceAdminController } from './finance-admin.controller';
import { FinanceAdminService } from './finance-admin.service';
import { FinanceExportsController } from './exports.controller';
import { FinanceExportsService } from './exports.service';

@Module({
  imports: [LedgerModule],
  controllers: [FinanceAdminController, FinanceExportsController],
  providers: [FinanceAdminService, FinanceExportsService],
  exports: [FinanceAdminService, FinanceExportsService],
})
export class FinanceAdminModule {}
