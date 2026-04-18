import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { TradeSafeCallbackController } from './tradesafe-callback.controller';
import { TradeSafeClient } from './tradesafe.client';

/**
 * TradeSafe module (ADR 0009).
 *
 * Exports the {@link TradeSafeClient}. Wiring into the outbound payout path is
 * done by {@link PayoutProviderFactory} — this module stays unaware of the
 * ledger / payout state machine.
 *
 * R33 (2026-04-18): hosts {@link TradeSafeCallbackController} at
 * `GET /api/v1/auth/tradesafe/callback` — the OAuth return leg of the
 * hunter beneficiary-link flow (ADR 0009 §5). Lives here rather than under
 * `auth/` because the behaviour is TradeSafe-specific, not generic auth;
 * the `auth/` segment in the URL is namespace, not module organisation.
 */
@Module({
  imports: [RedisModule],
  controllers: [TradeSafeCallbackController],
  providers: [TradeSafeClient],
  exports: [TradeSafeClient],
})
export class TradeSafeModule {}
