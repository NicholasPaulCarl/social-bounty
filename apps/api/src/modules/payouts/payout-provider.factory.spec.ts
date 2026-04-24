import { PayoutProviderFactory } from './payout-provider.factory';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

describe('PayoutProviderFactory (ADR 0011 — TradeSafe unified rail)', () => {
  const originalEnv = process.env.PAYOUT_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PAYOUT_PROVIDER;
    } else {
      process.env.PAYOUT_PROVIDER = originalEnv;
    }
  });

  function buildFactory(providerValue: string | undefined) {
    if (providerValue === undefined) {
      delete process.env.PAYOUT_PROVIDER;
    } else {
      process.env.PAYOUT_PROVIDER = providerValue;
    }
    const tradesafe = { name: 'tradesafe' } as unknown as TradeSafePayoutAdapter;
    return new PayoutProviderFactory(tradesafe);
  }

  it('defaults to tradesafe when PAYOUT_PROVIDER is unset', () => {
    const factory = buildFactory(undefined);
    expect(factory.getProviderName()).toBe('tradesafe');
    expect(factory.getProvider().name).toBe('tradesafe');
  });

  it('returns tradesafe adapter for PAYOUT_PROVIDER=tradesafe', () => {
    const factory = buildFactory('tradesafe');
    expect(factory.getProviderName()).toBe('tradesafe');
    expect(factory.getProvider().name).toBe('tradesafe');
  });

  it('routes mock mode through the tradesafe adapter', () => {
    const factory = buildFactory('mock');
    expect(factory.getProviderName()).toBe('mock');
    expect(factory.getProvider().name).toBe('tradesafe');
  });

  it('accepts upper-case and whitespace-padded values', () => {
    const factory = buildFactory('  TRADESAFE  ');
    expect(factory.getProviderName()).toBe('tradesafe');
  });

  it('throws on unknown provider values at boot', () => {
    expect(() => buildFactory('stitch')).toThrow(/Invalid PAYOUT_PROVIDER/);
    expect(() => buildFactory('paypal')).toThrow(/Invalid PAYOUT_PROVIDER/);
    expect(() => buildFactory('')).toThrow(/Invalid PAYOUT_PROVIDER/);
  });
});
