import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayoutProvider } from './payout-provider.interface';
import { StitchPayoutAdapter } from './stitch-payout.adapter';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

export type PayoutProviderName = 'stitch' | 'tradesafe' | 'mock';

const VALID_PROVIDERS: ReadonlyArray<PayoutProviderName> = [
  'stitch',
  'tradesafe',
  'mock',
];

/**
 * Resolves the active {@link PayoutProvider} based on `PAYOUT_PROVIDER` env.
 *
 * Defaults to `stitch` (current live inbound + gated outbound path). `mock`
 * maps onto the TradeSafe adapter in mock mode (no network, deterministic
 * fixtures) so tests and local dev can exercise the interface without any
 * creds. Unknown values throw at boot time — silent fallbacks would mask
 * config drift (Section 6 failure pattern).
 *
 * This factory is a pure lookup; it does not flip any kill-switch or feature
 * flag. Selecting `tradesafe` here does NOT enable payouts — `PAYOUTS_ENABLED`
 * still gates the outbound rail.
 */
@Injectable()
export class PayoutProviderFactory {
  private readonly logger = new Logger(PayoutProviderFactory.name);
  private readonly providerName: PayoutProviderName;

  constructor(
    private readonly config: ConfigService,
    private readonly stitchAdapter: StitchPayoutAdapter,
    private readonly tradesafeAdapter: TradeSafePayoutAdapter,
  ) {
    const raw = (this.config.get<string>('PAYOUT_PROVIDER', 'stitch') ?? 'stitch')
      .trim()
      .toLowerCase();
    if (!VALID_PROVIDERS.includes(raw as PayoutProviderName)) {
      throw new Error(
        `Invalid PAYOUT_PROVIDER=${raw}; must be one of ${VALID_PROVIDERS.join(',')}`,
      );
    }
    this.providerName = raw as PayoutProviderName;
    this.logger.log(`PayoutProvider resolved: ${this.providerName}`);
  }

  getProvider(): PayoutProvider {
    switch (this.providerName) {
      case 'stitch':
        return this.stitchAdapter;
      case 'tradesafe':
        return this.tradesafeAdapter;
      case 'mock':
        // Mock mode currently routes through the TradeSafe adapter which has
        // first-class mock-mode support. The Stitch path's local-synth shortcut
        // is NOT the same thing — it's a workaround for a missing endpoint.
        return this.tradesafeAdapter;
    }
  }

  getProviderName(): PayoutProviderName {
    return this.providerName;
  }
}
