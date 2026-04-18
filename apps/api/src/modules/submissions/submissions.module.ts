import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { SubmissionScraperService } from './submission-scraper.service';
import { SubmissionScrapeRecoveryScheduler } from './submission-scrape-recovery.scheduler';
import { WalletModule } from '../wallet/wallet.module';
import { BountyAccessModule } from '../bounty-access/bounty-access.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ApifyModule } from '../apify/apify.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    WalletModule,
    BountyAccessModule,
    SubscriptionsModule,
    LedgerModule,
    ApifyModule,
    RedisModule,
  ],
  controllers: [SubmissionsController],
  providers: [
    SubmissionsService,
    PayoutSchedulerService,
    SubmissionScraperService,
    SubmissionScrapeRecoveryScheduler,
  ],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
