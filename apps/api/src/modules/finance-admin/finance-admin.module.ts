import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { FinanceAdminController } from './finance-admin.controller';
import { FinanceAdminService } from './finance-admin.service';

@Module({
  imports: [LedgerModule],
  controllers: [FinanceAdminController],
  providers: [FinanceAdminService],
  exports: [FinanceAdminService],
})
export class FinanceAdminModule {}
