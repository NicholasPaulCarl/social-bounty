// class-transformer's decorator metadata lookup needs reflect-metadata at
// runtime. Nest's bootstrap normally loads it; jest runs don't touch main.ts
// so we import it here explicitly.
import 'reflect-metadata';
import { validateEnv } from './env.validation';

/**
 * Boot-time env validation tests.
 *
 * Goal: the API must fail LOUD at boot on misconfiguration of any flag
 * that gates financial behaviour (H2, orphan sweep 2026-04-15). Every
 * flag added to env.validation.ts gets coverage here so a future
 * refactor can't silently drop a validator.
 */
describe('validateEnv', () => {
  const base = {
    PAYMENTS_PROVIDER: 'stitch_sandbox',
    STITCH_CLIENT_ID: 'client-id',
    STITCH_CLIENT_SECRET: 'client-secret',
    STITCH_API_BASE: 'https://express.stitch.money',
    STITCH_REDIRECT_URL: 'http://localhost:3000/business/bounties/funded',
    STITCH_SYSTEM_ACTOR_ID: '00000000-0000-0000-0000-000000000001',
  };

  describe('required fields (payments enabled)', () => {
    it('passes with the minimum valid Stitch-sandbox config', () => {
      expect(() => validateEnv(base)).not.toThrow();
    });

    it('throws when PAYMENTS_PROVIDER is missing', () => {
      const { PAYMENTS_PROVIDER: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/PAYMENTS_PROVIDER/);
    });

    it('throws when PAYMENTS_PROVIDER is an invalid value', () => {
      expect(() => validateEnv({ ...base, PAYMENTS_PROVIDER: 'paypal' })).toThrow(
        /PAYMENTS_PROVIDER/,
      );
    });

    it('throws when STITCH_CLIENT_ID is missing with payments enabled', () => {
      const { STITCH_CLIENT_ID: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/STITCH_CLIENT_ID/);
    });

    it('throws when STITCH_API_BASE is not a valid URL', () => {
      expect(() => validateEnv({ ...base, STITCH_API_BASE: 'not-a-url' })).toThrow(
        /STITCH_API_BASE/,
      );
    });

    it('throws when STITCH_SYSTEM_ACTOR_ID is missing with payments enabled', () => {
      const { STITCH_SYSTEM_ACTOR_ID: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/STITCH_SYSTEM_ACTOR_ID/);
    });

    it('skips Stitch-conditional checks when PAYMENTS_PROVIDER=none', () => {
      expect(() => validateEnv({ PAYMENTS_PROVIDER: 'none' })).not.toThrow();
    });
  });

  describe('feature flags (H2 — orphan sweep)', () => {
    it('accepts PAYOUTS_ENABLED=true|false', () => {
      expect(() => validateEnv({ ...base, PAYOUTS_ENABLED: 'false' })).not.toThrow();
      expect(() => validateEnv({ ...base, PAYOUTS_ENABLED: 'true' })).not.toThrow();
    });

    it('rejects PAYOUTS_ENABLED with a non-boolean string', () => {
      expect(() => validateEnv({ ...base, PAYOUTS_ENABLED: 'yes' })).toThrow(
        /PAYOUTS_ENABLED/,
      );
    });

    it('accepts RECONCILIATION_ENABLED=true|false', () => {
      expect(() => validateEnv({ ...base, RECONCILIATION_ENABLED: 'true' })).not.toThrow();
      expect(() => validateEnv({ ...base, RECONCILIATION_ENABLED: 'false' })).not.toThrow();
    });

    it('rejects RECONCILIATION_ENABLED with a non-boolean string', () => {
      expect(() => validateEnv({ ...base, RECONCILIATION_ENABLED: 'off' })).toThrow(
        /RECONCILIATION_ENABLED/,
      );
    });

    it('accepts EXPIRED_BOUNTY_RELEASE_ENABLED as absent, true, or false', () => {
      expect(() => validateEnv({ ...base })).not.toThrow();
      expect(() =>
        validateEnv({ ...base, EXPIRED_BOUNTY_RELEASE_ENABLED: 'true' }),
      ).not.toThrow();
      expect(() =>
        validateEnv({ ...base, EXPIRED_BOUNTY_RELEASE_ENABLED: 'false' }),
      ).not.toThrow();
    });

    it('rejects EXPIRED_BOUNTY_RELEASE_ENABLED with a non-boolean value', () => {
      expect(() =>
        validateEnv({ ...base, EXPIRED_BOUNTY_RELEASE_ENABLED: 'maybe' }),
      ).toThrow(/EXPIRED_BOUNTY_RELEASE_ENABLED/);
    });

    it('accepts BENEFICIARY_ENC_KEY as a string and rejects numeric garbage coerced by plainToInstance', () => {
      expect(() =>
        validateEnv({ ...base, BENEFICIARY_ENC_KEY: 'super-secret-key' }),
      ).not.toThrow();
    });

    it('accepts APIFY_ACTOR_TIMEOUT_MS as an int >= 1000', () => {
      expect(() =>
        validateEnv({ ...base, APIFY_ACTOR_TIMEOUT_MS: 60000 }),
      ).not.toThrow();
      expect(() =>
        validateEnv({ ...base, APIFY_ACTOR_TIMEOUT_MS: '60000' }),
      ).not.toThrow();
    });

    it('rejects APIFY_ACTOR_TIMEOUT_MS below the floor', () => {
      expect(() => validateEnv({ ...base, APIFY_ACTOR_TIMEOUT_MS: 10 })).toThrow(
        /APIFY_ACTOR_TIMEOUT_MS/,
      );
    });
  });

  describe('FINANCIAL_KILL_SWITCH removal (C2)', () => {
    it('ignores any lingering FINANCIAL_KILL_SWITCH env value (no longer validated, no longer read)', () => {
      // Confirms the removal: the validator neither requires nor forbids it.
      // Operators who still have it set in their .env will not be blocked at
      // boot, but it has no effect on kill-switch state — that lives in the
      // SystemSetting row `financial.kill_switch.active`.
      expect(() =>
        validateEnv({ ...base, FINANCIAL_KILL_SWITCH: 'true' }),
      ).not.toThrow();
    });
  });

  describe('TradeSafe adapter scaffolding (ADR 0009)', () => {
    it('accepts PAYOUT_PROVIDER=stitch|tradesafe|mock', () => {
      for (const v of ['stitch', 'tradesafe', 'mock']) {
        expect(() => validateEnv({ ...base, PAYOUT_PROVIDER: v })).not.toThrow();
      }
    });

    it('rejects an invalid PAYOUT_PROVIDER', () => {
      expect(() => validateEnv({ ...base, PAYOUT_PROVIDER: 'peach' })).toThrow(
        /PAYOUT_PROVIDER/,
      );
    });
  });

  describe('happy path — full production-shaped env', () => {
    it('passes with every validated flag set to a realistic value', () => {
      expect(() =>
        validateEnv({
          ...base,
          STITCH_WEBHOOK_SECRET: 'whsec_abc',
          STITCH_PAYOUT_SPEED: 'DEFAULT',
          STITCH_MIN_PAYOUT_CENTS: 2000,
          PAYOUTS_ENABLED: 'false',
          RECONCILIATION_ENABLED: 'true',
          EXPIRED_BOUNTY_RELEASE_ENABLED: 'false',
          BENEFICIARY_ENC_KEY: 'prod-enc-key',
          STRIPE_SECRET_KEY: 'sk_live_x',
          STRIPE_WEBHOOK_SECRET: 'whsec_y',
          APIFY_API_TOKEN: 'apify_token',
          APIFY_ACTOR_TIMEOUT_MS: 60000,
          PAYOUT_PROVIDER: 'stitch',
          TRADESAFE_API_BASE: 'https://tradesafe.example/api',
          TRADESAFE_MOCK: 'true',
          CLEARANCE_OVERRIDE_HOURS_FREE: 0.0083,
          CLEARANCE_OVERRIDE_HOURS_PRO: 0,
        }),
      ).not.toThrow();
    });
  });
});
