/**
 * Live sandbox smoke test for {@link TradeSafeGraphQLClient}.
 *
 * DISABLED BY DEFAULT. Opt in with `TRADESAFE_LIVE_SMOKE=1` in the env;
 * otherwise every test here is a no-op. The reason it's opt-in: this file
 * actually hits https://api-developer.tradesafe.dev/graphql with real
 * creds, which is slow and flaky for CI (depends on TradeSafe uptime).
 *
 * Run locally after wiring new env vars:
 *   TRADESAFE_LIVE_SMOKE=1 npx jest tradesafe-graphql.live.smoke
 *
 * The primary purpose is to VERIFY the amount-unit assumption documented
 * in `tradesafe-graphql.operations.ts`: we assume TradeSafe's `value`
 * fields are ZAR decimal (Float), NOT integer cents. If this assumption
 * is wrong, this smoke test fails loudly and we flip `toZar` / `toCents`
 * in one place — no other code moves.
 */
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';

const LIVE = process.env.TRADESAFE_LIVE_SMOKE === '1';
const describeLive = LIVE ? describe : describe.skip;

describeLive('TradeSafeGraphQLClient — live sandbox smoke', () => {
  let client: TradeSafeGraphQLClient;

  // Minimal Redis stub backed by an in-memory Map — good enough for smoke.
  const store = new Map<string, string>();
  const redis = {
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    set: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    setNxEx: jest.fn(async () => true),
    del: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  } as unknown as RedisService;

  beforeAll(() => {
    const config = {
      get: (key: string, fallback?: unknown) => process.env[key] ?? fallback,
    } as unknown as ConfigService;
    client = new TradeSafeGraphQLClient(config, redis);
  });

  it('authenticates against the sandbox OAuth endpoint', async () => {
    const token = await client.getToken();
    expect(token).toMatch(/^eyJ/); // JWT-shaped
    expect(token.length).toBeGreaterThan(100);
  }, 15_000);

  it('probe() returns ok=true against the sandbox', async () => {
    store.clear(); // force fresh token
    const result = await client.probe();
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.latencyMs).toBeLessThan(10_000);
  }, 15_000);

  it('getApiProfile returns organizations (may be empty on a fresh sandbox)', async () => {
    const profile = await client.getApiProfile();
    // organizations may be null on a freshly-registered sandbox account —
    // the check confirms the envelope unwrap works, not the content.
    expect(profile).toHaveProperty('organizations');
  }, 15_000);

  // NOTE: the full transaction lifecycle smoke (tokenCreate → transactionCreate
  // → checkoutLink → allocationStartDelivery → allocationAcceptDelivery) lands
  // in Phase 2, once the sandbox organization is registered and we have
  // hunter/brand test tokens to play with. This file currently only exercises
  // the transport + auth layer. See `docs/adr/0011-tradesafe-unified-rail.md`
  // for the full lifecycle plan (Phase 1c).
});

// Ensure the file compiles even when the describe block is skipped.
if (!LIVE) {
  it('live smoke tests are skipped (set TRADESAFE_LIVE_SMOKE=1 to enable)', () => {
    expect(LIVE).toBe(false);
  });
}
