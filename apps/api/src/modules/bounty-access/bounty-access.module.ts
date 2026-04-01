import { Module } from '@nestjs/common';
import { BountyAccessController } from './bounty-access.controller';
import { BountyAccessService } from './bounty-access.service';

@Module({
  controllers: [BountyAccessController],
  providers: [BountyAccessService],
  exports: [BountyAccessService],
})
export class BountyAccessModule {}
