import { Module } from '@nestjs/common';
import { BountiesController } from './bounties.controller';
import { BountiesService } from './bounties.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [BountiesController],
  providers: [BountiesService],
  exports: [BountiesService],
})
export class BountiesModule {}
