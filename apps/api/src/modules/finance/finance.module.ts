import { Module, forwardRef } from '@nestjs/common';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { FeeCalculatorService } from './fee-calculator.service';
import { PaymentsHealthController } from './payments-health.controller';

@Module({
  imports: [forwardRef(() => TradeSafeModule), WebhooksModule],
  controllers: [PaymentsHealthController],
  providers: [FeeCalculatorService],
  exports: [FeeCalculatorService],
})
export class FinanceModule {}
