import { Module } from '@nestjs/common';
import { StitchModule } from '../stitch/stitch.module';
import { LedgerModule } from '../ledger/ledger.module';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiaryService } from './beneficiary.service';
import { PayoutsService } from './payouts.service';
import { PayoutsScheduler } from './payouts.scheduler';
import { PayoutsController } from './payouts.controller';

@Module({
  imports: [StitchModule, LedgerModule, WalletModule],
  controllers: [PayoutsController],
  providers: [BeneficiaryService, PayoutsService, PayoutsScheduler],
  exports: [BeneficiaryService, PayoutsService],
})
export class PayoutsModule {}
