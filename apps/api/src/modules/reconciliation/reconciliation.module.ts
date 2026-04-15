import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationScheduler } from './reconciliation.scheduler';

@Module({
  imports: [LedgerModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService, ReconciliationScheduler],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
