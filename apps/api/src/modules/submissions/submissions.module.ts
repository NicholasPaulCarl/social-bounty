import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { SubmissionScraperService } from './submission-scraper.service';
import { SubmissionScrapeRecoveryScheduler } from './submission-scrape-recovery.scheduler';
import { SubmissionVisibilityScheduler } from './submission-visibility.scheduler';
import { WalletModule } from '../wallet/wallet.module';
import { BountyAccessModule } from '../bounty-access/bounty-access.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ApifyModule } from '../apify/apify.module';
import { RedisModule } from '../redis/redis.module';
import { RefundsModule } from '../refunds/refunds.module';

@Module({
  imports: [
    WalletModule,
    BountyAccessModule,
    SubscriptionsModule,
    LedgerModule,
    ApifyModule,
    RedisModule,
    // Phase 2A: visibility scheduler issues post-approval refunds via
    // RefundsService. MailModule + KbModule + AuditModule are @Global.
    RefundsModule,
  ],
  controllers: [SubmissionsController],
  providers: [
    SubmissionsService,
    PayoutSchedulerService,
    SubmissionScraperService,
    SubmissionScrapeRecoveryScheduler,
    SubmissionVisibilityScheduler,
  ],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
