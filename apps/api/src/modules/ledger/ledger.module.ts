import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LedgerService } from './ledger.service';
import { ApprovalLedgerService } from './approval-ledger.service';
import { ClearanceService } from './clearance.service';
import { ClearanceScheduler } from './clearance.scheduler';

@Module({
  imports: [FinanceModule, SubscriptionsModule],
  providers: [LedgerService, ApprovalLedgerService, ClearanceService, ClearanceScheduler],
  exports: [LedgerService, ApprovalLedgerService, ClearanceService],
})
export class LedgerModule {}
