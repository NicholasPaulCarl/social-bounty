import { Module } from '@nestjs/common';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';
import { LedgerModule } from '../ledger/ledger.module';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiaryService } from './beneficiary.service';
import { PayoutsService } from './payouts.service';
import { PayoutsScheduler } from './payouts.scheduler';
import { PayoutsController } from './payouts.controller';
import { PayoutProviderFactory } from './payout-provider.factory';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

/**
 * Outbound-payout wiring (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: only TradeSafe remains. `StitchPayoutAdapter` was
 * deleted; the factory resolves directly to the TradeSafe adapter
 * (see {@link PayoutProviderFactory}).
 */
@Module({
  imports: [TradeSafeModule, LedgerModule, WalletModule],
  controllers: [PayoutsController],
  providers: [
    BeneficiaryService,
    PayoutsService,
    PayoutsScheduler,
    TradeSafePayoutAdapter,
    PayoutProviderFactory,
  ],
  exports: [
    BeneficiaryService,
    PayoutsService,
    PayoutProviderFactory,
    TradeSafePayoutAdapter,
  ],
})
export class PayoutsModule {}
