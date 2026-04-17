import { ConfigService } from '@nestjs/config';
import { PayoutProviderFactory } from './payout-provider.factory';
import { StitchPayoutAdapter } from './stitch-payout.adapter';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

describe('PayoutProviderFactory', () => {
  function buildFactory(providerValue: string | undefined) {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PAYOUT_PROVIDER' ? providerValue ?? fallback : fallback,
      ),
    } as unknown as ConfigService;
    const stitch = { name: 'stitch' } as unknown as StitchPayoutAdapter;
    const tradesafe = { name: 'tradesafe' } as unknown as TradeSafePayoutAdapter;
    return new PayoutProviderFactory(config, stitch, tradesafe);
  }

  it('defaults to stitch when PAYOUT_PROVIDER is unset', () => {
    const factory = buildFactory(undefined);
    expect(factory.getProviderName()).toBe('stitch');
    expect(factory.getProvider().name).toBe('stitch');
  });

  it('returns stitch adapter for PAYOUT_PROVIDER=stitch', () => {
    const factory = buildFactory('stitch');
    expect(factory.getProviderName()).toBe('stitch');
    expect(factory.getProvider().name).toBe('stitch');
  });

  it('returns tradesafe adapter for PAYOUT_PROVIDER=tradesafe', () => {
    const factory = buildFactory('tradesafe');
    expect(factory.getProviderName()).toBe('tradesafe');
    expect(factory.getProvider().name).toBe('tradesafe');
  });

  it('routes mock mode through the tradesafe adapter', () => {
    // The TradeSafe adapter has first-class mock-mode support — the Stitch
    // local-synth path is a workaround for a missing endpoint, not the same
    // thing. Keep this contract locked in a test so a future refactor that
    // points `mock` at the Stitch adapter is caught in review.
    const factory = buildFactory('mock');
    expect(factory.getProviderName()).toBe('mock');
    expect(factory.getProvider().name).toBe('tradesafe');
  });

  it('accepts upper-case and whitespace-padded values', () => {
    const factory = buildFactory('  TRADESAFE  ');
    expect(factory.getProviderName()).toBe('tradesafe');
  });

  it('throws on unknown provider values at boot', () => {
    expect(() => buildFactory('paypal')).toThrow(/Invalid PAYOUT_PROVIDER/);
    expect(() => buildFactory('')).toThrow(/Invalid PAYOUT_PROVIDER/);
  });
});
