import { Module, forwardRef } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LedgerService } from './ledger.service';
import { ApprovalLedgerService } from './approval-ledger.service';
import { ClearanceService } from './clearance.service';
import { ClearanceScheduler } from './clearance.scheduler';

@Module({
  // SubscriptionsModule ↔ LedgerModule are mutually dependent — SubscriptionsService
  // posts the subscription_charged ledger group, while ApprovalLedgerService reads
  // the hunter tier from SubscriptionsService. forwardRef breaks the cycle.
  imports: [FinanceModule, forwardRef(() => SubscriptionsModule)],
  providers: [LedgerService, ApprovalLedgerService, ClearanceService, ClearanceScheduler],
  exports: [LedgerService, ApprovalLedgerService, ClearanceService],
})
export class LedgerModule {}
