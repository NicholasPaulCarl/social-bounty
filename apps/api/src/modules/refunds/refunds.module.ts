import { Module } from '@nestjs/common';
import { StitchModule } from '../stitch/stitch.module';
import { LedgerModule } from '../ledger/ledger.module';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [StitchModule, LedgerModule],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
