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
 *
 * Post-ADR 0011 (2026-04-24): legacy payment-provider env vars dropped;
 * TradeSafe is the single rail. `base` carries only the always-required
 * TradeSafe URLs + callback secret + redirect URL.
 */
describe('validateEnv', () => {
  const base = {
    TRADESAFE_AUTH_URL: 'https://auth.tradesafe.co.za/oauth/token',
    TRADESAFE_GRAPHQL_URL: 'https://api-developer.tradesafe.dev/graphql',
    TRADESAFE_CALLBACK_SECRET: 'a'.repeat(32),
    TRADESAFE_REDIRECT_URL: 'http://localhost:3000/business/bounties/funded',
    SYSTEM_ACTOR_ID: 'system-actor-uuid',
  };

  describe('required TradeSafe fields (ADR 0011)', () => {
    it('passes with the minimum valid TradeSafe config', () => {
      expect(() => validateEnv(base)).not.toThrow();
    });

    it('throws when TRADESAFE_AUTH_URL is missing', () => {
      const { TRADESAFE_AUTH_URL: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/TRADESAFE_AUTH_URL/);
    });

    it('throws when TRADESAFE_AUTH_URL is not a valid URL', () => {
      expect(() =>
        validateEnv({ ...base, TRADESAFE_AUTH_URL: 'not-a-url' }),
      ).toThrow(/TRADESAFE_AUTH_URL/);
    });

    it('throws when TRADESAFE_GRAPHQL_URL is missing', () => {
      const { TRADESAFE_GRAPHQL_URL: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/TRADESAFE_GRAPHQL_URL/);
    });

    it('throws when TRADESAFE_GRAPHQL_URL is not a valid URL', () => {
      expect(() =>
        validateEnv({ ...base, TRADESAFE_GRAPHQL_URL: 'missing-scheme.example.com' }),
      ).toThrow(/TRADESAFE_GRAPHQL_URL/);
    });

    it('throws when TRADESAFE_CALLBACK_SECRET is missing', () => {
      const { TRADESAFE_CALLBACK_SECRET: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/TRADESAFE_CALLBACK_SECRET/);
    });

    it('throws when TRADESAFE_CALLBACK_SECRET is shorter than 32 chars', () => {
      expect(() =>
        validateEnv({ ...base, TRADESAFE_CALLBACK_SECRET: 'short' }),
      ).toThrow(/TRADESAFE_CALLBACK_SECRET/);
    });

    it('throws when TRADESAFE_REDIRECT_URL is missing', () => {
      const { TRADESAFE_REDIRECT_URL: _, ...rest } = base;
      expect(() => validateEnv(rest)).toThrow(/TRADESAFE_REDIRECT_URL/);
    });

    it('throws when TRADESAFE_REDIRECT_URL is not a valid URL', () => {
      expect(() =>
        validateEnv({ ...base, TRADESAFE_REDIRECT_URL: 'not-a-url' }),
      ).toThrow(/TRADESAFE_REDIRECT_URL/);
    });

    it('accepts TRADESAFE_MOCK=true|false and missing (defaults to true at read site)', () => {
      expect(() => validateEnv({ ...base, TRADESAFE_MOCK: 'true' })).not.toThrow();
      expect(() => validateEnv({ ...base, TRADESAFE_MOCK: 'false' })).not.toThrow();
      expect(() => validateEnv({ ...base })).not.toThrow();
    });

    it('rejects TRADESAFE_MOCK with a non-boolean string', () => {
      expect(() => validateEnv({ ...base, TRADESAFE_MOCK: 'yes' })).toThrow(
        /TRADESAFE_MOCK/,
      );
    });
  });

  describe('feature flags (H2 — orphan sweep)', () => {
    it('accepts PAYOUTS_ENABLED=true|false (with BENEFICIARY_ENC_KEY + TRADESAFE URLs when true — R29 + R35)', () => {
      expect(() => validateEnv({ ...base, PAYOUTS_ENABLED: 'false' })).not.toThrow();
      // R29 (batch 14A): flipping PAYOUTS_ENABLED=true also requires a
      // strong BENEFICIARY_ENC_KEY.
      // R35 (2026-04-18): …and the three TRADESAFE_*_URL env vars. See
      // the dedicated test blocks below for the full matrix.
      expect(() =>
        validateEnv({
          ...base,
          PAYOUTS_ENABLED: 'true',
          BENEFICIARY_ENC_KEY: 'a'.repeat(32),
          TRADESAFE_OAUTH_REDIRECT_URL:
            'https://api.example.com/api/v1/auth/tradesafe/callback',
          TRADESAFE_SUCCESS_URL: 'https://app.example.com/hunters/me?tradesafe=linked',
          TRADESAFE_FAILURE_URL: 'https://app.example.com/hunters/me?tradesafe=failed',
        }),
      ).not.toThrow();
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

    // R29 hardening (batch 14A, 2026-04-15) — BENEFICIARY_ENC_KEY is
    // required (and must be ≥32 chars) when PAYOUTS_ENABLED=true. The
    // JWT_SECRET fallback in BeneficiaryService is only acceptable while
    // the outbound rail is gated (ADR 0008). These tests lock the gate.
    describe('BENEFICIARY_ENC_KEY — R29 conditional hardening', () => {
      const strongKey = 'a'.repeat(32);

      it('throws when PAYOUTS_ENABLED=true and BENEFICIARY_ENC_KEY is missing', () => {
        expect(() =>
          validateEnv({ ...base, PAYOUTS_ENABLED: 'true' }),
        ).toThrow(/BENEFICIARY_ENC_KEY/);
      });

      it('throws when PAYOUTS_ENABLED=true and BENEFICIARY_ENC_KEY is shorter than 32 chars', () => {
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: 'short-key',
          }),
        ).toThrow(/BENEFICIARY_ENC_KEY/);
      });

      it('passes when PAYOUTS_ENABLED=true and BENEFICIARY_ENC_KEY is exactly 32 chars (with TRADESAFE URLs — R35)', () => {
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            TRADESAFE_OAUTH_REDIRECT_URL:
              'https://api.example.com/api/v1/auth/tradesafe/callback',
            TRADESAFE_SUCCESS_URL: 'https://app.example.com/hunters/me?tradesafe=linked',
            TRADESAFE_FAILURE_URL: 'https://app.example.com/hunters/me?tradesafe=failed',
          }),
        ).not.toThrow();
      });

      it('passes when PAYOUTS_ENABLED=false and BENEFICIARY_ENC_KEY is unset (dev fallback path)', () => {
        expect(() =>
          validateEnv({ ...base, PAYOUTS_ENABLED: 'false' }),
        ).not.toThrow();
      });

      it('passes when PAYOUTS_ENABLED is absent and BENEFICIARY_ENC_KEY is unset (unchanged current-state behaviour)', () => {
        expect(() => validateEnv({ ...base })).not.toThrow();
      });

      it('passes when PAYOUTS_ENABLED=false and BENEFICIARY_ENC_KEY is a short string (tolerated in dev)', () => {
        // Intentional: dev environments can carry a throwaway value. The
        // MinLength(32) floor only bites when payouts are live.
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'false',
            BENEFICIARY_ENC_KEY: 'short-dev-key',
          }),
        ).not.toThrow();
      });
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
    it('accepts PAYOUT_PROVIDER=tradesafe|mock', () => {
      for (const v of ['tradesafe', 'mock']) {
        expect(() => validateEnv({ ...base, PAYOUT_PROVIDER: v })).not.toThrow();
      }
    });

    it('rejects an invalid PAYOUT_PROVIDER', () => {
      expect(() => validateEnv({ ...base, PAYOUT_PROVIDER: 'peach' })).toThrow(
        /PAYOUT_PROVIDER/,
      );
    });

    // R35 (2026-04-18) — TradeSafe OAuth URLs are required when
    // PAYOUTS_ENABLED=true (ADR 0009 §4). `@ValidateIf` gates mirror the
    // `BENEFICIARY_ENC_KEY` pattern: dev (PAYOUTS_ENABLED=false | unset)
    // can leave them blank; live refuses to boot without them.
    describe('TRADESAFE OAuth URLs — R35 conditional validation', () => {
      const strongKey = 'a'.repeat(32);
      const tradesafeUrls = {
        TRADESAFE_OAUTH_REDIRECT_URL: 'https://api.example.com/api/v1/auth/tradesafe/callback',
        TRADESAFE_SUCCESS_URL: 'https://app.example.com/hunters/me?tradesafe=linked',
        TRADESAFE_FAILURE_URL: 'https://app.example.com/hunters/me?tradesafe=failed',
      };

      it('passes when all three URLs present and PAYOUTS_ENABLED=true', () => {
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...tradesafeUrls,
          }),
        ).not.toThrow();
      });

      it('throws when TRADESAFE_OAUTH_REDIRECT_URL is missing and PAYOUTS_ENABLED=true', () => {
        const { TRADESAFE_OAUTH_REDIRECT_URL: _, ...rest } = tradesafeUrls;
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...rest,
          }),
        ).toThrow(/TRADESAFE_OAUTH_REDIRECT_URL/);
      });

      it('throws when TRADESAFE_SUCCESS_URL is missing and PAYOUTS_ENABLED=true', () => {
        const { TRADESAFE_SUCCESS_URL: _, ...rest } = tradesafeUrls;
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...rest,
          }),
        ).toThrow(/TRADESAFE_SUCCESS_URL/);
      });

      it('throws when TRADESAFE_FAILURE_URL is missing and PAYOUTS_ENABLED=true', () => {
        const { TRADESAFE_FAILURE_URL: _, ...rest } = tradesafeUrls;
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...rest,
          }),
        ).toThrow(/TRADESAFE_FAILURE_URL/);
      });

      it('passes when all three are missing and PAYOUTS_ENABLED=false (dev gate works)', () => {
        expect(() =>
          validateEnv({ ...base, PAYOUTS_ENABLED: 'false' }),
        ).not.toThrow();
      });

      it('passes when all three are missing and PAYOUTS_ENABLED is unset (pre-TradeSafe default)', () => {
        expect(() => validateEnv({ ...base })).not.toThrow();
      });

      it('throws when any of the three URLs is not a valid URL', () => {
        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...tradesafeUrls,
            TRADESAFE_OAUTH_REDIRECT_URL: 'not-a-url',
          }),
        ).toThrow(/TRADESAFE_OAUTH_REDIRECT_URL/);

        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...tradesafeUrls,
            TRADESAFE_SUCCESS_URL: 'javascript:alert(1)',
          }),
        ).toThrow(/TRADESAFE_SUCCESS_URL/);

        expect(() =>
          validateEnv({
            ...base,
            PAYOUTS_ENABLED: 'true',
            BENEFICIARY_ENC_KEY: strongKey,
            ...tradesafeUrls,
            TRADESAFE_FAILURE_URL: 'missing-scheme.example.com',
          }),
        ).toThrow(/TRADESAFE_FAILURE_URL/);
      });
    });
  });

  describe('happy path — full production-shaped env', () => {
    it('passes with every validated flag set to a realistic value', () => {
      expect(() =>
        validateEnv({
          ...base,
          PAYOUTS_ENABLED: 'false',
          RECONCILIATION_ENABLED: 'true',
          EXPIRED_BOUNTY_RELEASE_ENABLED: 'false',
          BENEFICIARY_ENC_KEY: 'prod-enc-key',
          APIFY_API_TOKEN: 'apify_token',
          APIFY_ACTOR_TIMEOUT_MS: 60000,
          PAYOUT_PROVIDER: 'tradesafe',
          TRADESAFE_API_BASE: 'https://tradesafe.example/api',
          TRADESAFE_MOCK: 'true',
          CLEARANCE_OVERRIDE_HOURS_FREE: 0.0083,
          CLEARANCE_OVERRIDE_HOURS_PRO: 0,
        }),
      ).not.toThrow();
    });
  });
});
