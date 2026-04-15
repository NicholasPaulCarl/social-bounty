import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FinanceAdminController } from './finance-admin.controller';
import { FinanceAdminService } from './finance-admin.service';
import { FinanceExportsController } from './exports.controller';
import { FinanceExportsService } from './exports.service';
import { FinanceAdminSubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [LedgerModule, SubscriptionsModule],
  controllers: [
    FinanceAdminController,
    FinanceExportsController,
    FinanceAdminSubscriptionsController,
  ],
  providers: [FinanceAdminService, FinanceExportsService],
  exports: [FinanceAdminService, FinanceExportsService],
})
export class FinanceAdminModule {}
