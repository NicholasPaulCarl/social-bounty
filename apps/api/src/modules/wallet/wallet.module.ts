import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WithdrawalService],
  exports: [WalletService],
})
export class WalletModule {}
