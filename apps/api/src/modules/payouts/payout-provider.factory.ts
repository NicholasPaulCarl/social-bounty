import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider } from './payout-provider.interface';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

export type PayoutProviderName = 'tradesafe' | 'mock';

/**
 * Outbound payout provider resolver (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover only one real rail exists: TradeSafe. `mock` mode routes
 * through the same adapter in mock-mode so tests + local dev exercise
 * the interface without any creds.
 *
 * The `PAYOUT_PROVIDER` env still exists for defence-in-depth — unknown
 * values throw at boot so config drift surfaces loudly (cf. CLAUDE.md
 * Section 6 failure patterns).
 */
@Injectable()
export class PayoutProviderFactory {
  private readonly logger = new Logger(PayoutProviderFactory.name);
  private readonly providerName: PayoutProviderName;

  constructor(private readonly tradesafeAdapter: TradeSafePayoutAdapter) {
    // PAYOUT_PROVIDER env kept for operator observability; unset → tradesafe.
    const raw = (process.env.PAYOUT_PROVIDER ?? 'tradesafe')
      .trim()
      .toLowerCase();
    if (raw !== 'tradesafe' && raw !== 'mock') {
      throw new Error(
        `Invalid PAYOUT_PROVIDER=${raw}; must be one of tradesafe, mock`,
      );
    }
    this.providerName = raw as PayoutProviderName;
    this.logger.log(`PayoutProvider resolved: ${this.providerName}`);
  }

  getProvider(): PayoutProvider {
    return this.tradesafeAdapter;
  }

  getProviderName(): PayoutProviderName {
    return this.providerName;
  }
}
