import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StitchPaymentsService } from './stitch-payments.service';
import { BrandFundingHandler } from './brand-funding.handler';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StitchModule } from '../stitch/stitch.module';
import { FinanceModule } from '../finance/finance.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [SubscriptionsModule, StitchModule, FinanceModule, LedgerModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StitchPaymentsService, BrandFundingHandler],
  exports: [PaymentsService, StitchPaymentsService, BrandFundingHandler],
})
export class PaymentsModule {}
