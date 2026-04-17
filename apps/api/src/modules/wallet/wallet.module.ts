import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';
import { WalletProjectionService } from './wallet-projection.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WithdrawalService, WalletProjectionService],
  exports: [WalletService, WalletProjectionService],
})
export class WalletModule {}
