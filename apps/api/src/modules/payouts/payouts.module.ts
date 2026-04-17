import { Module } from '@nestjs/common';
import { StitchModule } from '../stitch/stitch.module';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { LedgerModule } from '../ledger/ledger.module';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiaryService } from './beneficiary.service';
import { PayoutsService } from './payouts.service';
import { PayoutsScheduler } from './payouts.scheduler';
import { PayoutsController } from './payouts.controller';
import { PayoutProviderFactory } from './payout-provider.factory';
import { StitchPayoutAdapter } from './stitch-payout.adapter';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

@Module({
  imports: [StitchModule, TradeSafeModule, LedgerModule, WalletModule],
  controllers: [PayoutsController],
  providers: [
    BeneficiaryService,
    PayoutsService,
    PayoutsScheduler,
    StitchPayoutAdapter,
    TradeSafePayoutAdapter,
    PayoutProviderFactory,
  ],
  exports: [
    BeneficiaryService,
    PayoutsService,
    PayoutProviderFactory,
    StitchPayoutAdapter,
    TradeSafePayoutAdapter,
  ],
})
export class PayoutsModule {}
