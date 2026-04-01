import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { WalletModule } from '../wallet/wallet.module';
import { BountyAccessModule } from '../bounty-access/bounty-access.module';

@Module({
  imports: [WalletModule, BountyAccessModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, PayoutSchedulerService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
