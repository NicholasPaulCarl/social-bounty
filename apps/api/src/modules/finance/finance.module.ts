import { Module } from '@nestjs/common';
import { StitchModule } from '../stitch/stitch.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { FeeCalculatorService } from './fee-calculator.service';
import { PaymentsHealthController } from './payments-health.controller';

@Module({
  imports: [StitchModule, WebhooksModule],
  controllers: [PaymentsHealthController],
  providers: [FeeCalculatorService],
  exports: [FeeCalculatorService],
})
export class FinanceModule {}
