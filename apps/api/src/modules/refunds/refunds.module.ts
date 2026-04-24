import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

/**
 * Refunds (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch dependency removed. Refunds rely on append-only
 * compensating ledger entries (ADR 0005/0006); the provider-side refund
 * trigger — previously `StitchClient.createRefund` — is neutralised.
 * Once Phase 4 lands, refunds will flow through TradeSafe's allocation
 * CANCELLED transition (ADR 0011 §2).
 */
@Module({
  imports: [LedgerModule],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
