import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PayoutSchedulerService } from './payout-scheduler.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, PayoutSchedulerService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
