import { Module } from '@nestjs/common';
import { BountiesController } from './bounties.controller';
import { BountiesService } from './bounties.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ExpiredBountyService } from './expired-bounty.service';
import { ExpiredBountyScheduler } from './expired-bounty.scheduler';

@Module({
  imports: [SubscriptionsModule, LedgerModule],
  controllers: [BountiesController],
  providers: [BountiesService, ExpiredBountyService, ExpiredBountyScheduler],
  exports: [BountiesService, ExpiredBountyService],
})
export class BountiesModule {}
