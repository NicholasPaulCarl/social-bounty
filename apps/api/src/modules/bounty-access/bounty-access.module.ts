import { Module } from '@nestjs/common';
import { BountyAccessController } from './bounty-access.controller';
import { BountyAccessService } from './bounty-access.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [BountyAccessController],
  providers: [BountyAccessService],
  exports: [BountyAccessService],
})
export class BountyAccessModule {}
