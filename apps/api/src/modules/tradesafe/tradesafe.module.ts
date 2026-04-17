import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { TradeSafeClient } from './tradesafe.client';

/**
 * TradeSafe module — scaffold only (ADR 0009).
 *
 * Exports the {@link TradeSafeClient}. Wiring into the outbound payout path is
 * done by {@link PayoutProviderFactory} — this module stays unaware of the
 * ledger / payout state machine.
 */
@Module({
  imports: [RedisModule],
  providers: [TradeSafeClient],
  exports: [TradeSafeClient],
})
export class TradeSafeModule {}
