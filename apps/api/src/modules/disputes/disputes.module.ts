import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { DisputeSchedulerService } from './dispute-scheduler.service';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, DisputeSchedulerService],
  exports: [DisputesService],
})
export class DisputesModule {}
