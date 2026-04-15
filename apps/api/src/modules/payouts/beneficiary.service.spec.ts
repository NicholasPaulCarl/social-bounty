import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StitchClient } from '../stitch/stitch.client';
import { BeneficiaryService } from './beneficiary.service';

/**
 * Guards against KB R12/R13 — BeneficiaryService.upsertForUser silent-
 * local-fallback antipattern.
 *
 * In dev / stitch_sandbox, synthetic `local:*` ids are acceptable because
 * payouts run through the local test flow. In production
 * (`PAYMENTS_PROVIDER=stitch_live`), a synthetic id is useless: the
 * downstream Stitch withdrawal would pay the merchant's own bank account
 * instead of the hunter's — a silent critical failure.
 *
 * Fix: fail loud BEFORE inserting the row when provider=stitch_live AND
 * Stitch returned a `local:*` id.
 */
describe('BeneficiaryService.upsertForUser — R12/R13 silent-local-fallback guard', () => {
  const input = {
    accountHolderName: 'Jane Doe',
    bankCode: '250655',
    accountNumber: '1234567890',
    accountType: 'CURRENT',
  };

  function build(opts: {
    provider: string;
    stitchEnabled: boolean;
    createBeneficiaryId?: string;
  }) {
    const prisma = {
      stitchBeneficiary: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'row-uuid',
          ...data,
        })),
      },
    } as unknown as PrismaService;

    const stitch = {
      isEnabled: jest.fn().mockReturnValue(opts.stitchEnabled),
      createBeneficiary: jest.fn().mockResolvedValue({
        id: opts.createBeneficiaryId ?? `local:567890:abcd1234`,
      }),
    } as unknown as StitchClient;

    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'PAYMENTS_PROVIDER') return opts.provider;
        if (key === 'BENEFICIARY_ENC_KEY') return 'test-enc-key';
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new BeneficiaryService(prisma, stitch, config);
    return { service, prisma, stitch, config };
  }

  it('stitch_sandbox + local:* id → row is created (unchanged dev/sandbox behaviour)', async () => {
    const { service, prisma } = build({
      provider: 'stitch_sandbox',
      stitchEnabled: true,
      createBeneficiaryId: 'local:567890:abcd1234',
    });

    const row = await service.upsertForUser('user-1', input);

    expect(row).toBeDefined();
    expect(prisma.stitchBeneficiary.create).toHaveBeenCalledTimes(1);
    const createArg = (prisma.stitchBeneficiary.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.stitchBeneficiaryId).toBe('local:567890:abcd1234');
  });

  it('stitch_live + local:* id → throws BadRequestException and does NOT insert', async () => {
    const { service, prisma } = build({
      provider: 'stitch_live',
      stitchEnabled: true,
      createBeneficiaryId: 'local:567890:abcd1234',
    });

    await expect(service.upsertForUser('user-1', input)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.upsertForUser('user-1', input)).rejects.toThrow(
      /ADR 0008|local fallback|TradeSafe/,
    );
    expect(prisma.stitchBeneficiary.create).not.toHaveBeenCalled();
  });

  it('stitch_live + real Stitch id → row is created', async () => {
    const { service, prisma } = build({
      provider: 'stitch_live',
      stitchEnabled: true,
      createBeneficiaryId: 'real_xyz',
    });

    const row = await service.upsertForUser('user-1', input);

    expect(row).toBeDefined();
    expect(prisma.stitchBeneficiary.create).toHaveBeenCalledTimes(1);
    const createArg = (prisma.stitchBeneficiary.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.stitchBeneficiaryId).toBe('real_xyz');
  });

  it('provider=none (dev) + stitch disabled → local:<userId> is stored', async () => {
    const { service, prisma } = build({
      provider: 'none',
      stitchEnabled: false,
    });

    const row = await service.upsertForUser('user-42', input);

    expect(row).toBeDefined();
    const createArg = (prisma.stitchBeneficiary.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.stitchBeneficiaryId).toBe('local:user-42');
  });
});

/**
 * R29 hardening (batch 14A, 2026-04-15) — BENEFICIARY_ENC_KEY must not
 * silently fall back to JWT_SECRET when PAYOUTS_ENABLED=true. The
 * constructor throws a clear configuration error BEFORE any row is
 * written. When PAYOUTS_ENABLED=false the fallback is preserved
 * (pre-TradeSafe dev ergonomics, ADR 0008) and a loud warn is logged.
 */
describe('BeneficiaryService constructor — R29 BENEFICIARY_ENC_KEY hardening', () => {
  function makeConfig(overrides: Record<string, string | undefined>) {
    return {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key in overrides) return overrides[key];
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        return fallback;
      }),
    } as unknown as ConfigService;
  }

  const prisma = {} as unknown as PrismaService;
  const stitch = {} as unknown as StitchClient;

  it('throws a clear ConfigurationError when PAYOUTS_ENABLED=true and BENEFICIARY_ENC_KEY is missing', () => {
    const config = makeConfig({
      PAYOUTS_ENABLED: 'true',
      BENEFICIARY_ENC_KEY: undefined,
    });

    expect(() => new BeneficiaryService(prisma, stitch, config)).toThrow(
      /BENEFICIARY_ENC_KEY is required when PAYOUTS_ENABLED=true/,
    );
  });

  it('does NOT silently sign encryption with JWT_SECRET when PAYOUTS_ENABLED=true and the key is missing', () => {
    const jwtSecretAccess = jest.fn((key: string) =>
      key === 'JWT_SECRET' ? 'the-token-signing-secret' : undefined,
    );
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'PAYOUTS_ENABLED') return 'true';
        if (key === 'BENEFICIARY_ENC_KEY') return undefined;
        return jwtSecretAccess(key) ?? fallback;
      }),
    } as unknown as ConfigService;

    expect(() => new BeneficiaryService(prisma, stitch, config)).toThrow();
    // Never read JWT_SECRET — the error fires before the fallback branch.
    expect(jwtSecretAccess).not.toHaveBeenCalledWith('JWT_SECRET');
  });

  it('boots (with a warn) when PAYOUTS_ENABLED=false and BENEFICIARY_ENC_KEY is missing (dev fallback)', () => {
    const config = makeConfig({
      PAYOUTS_ENABLED: 'false',
      BENEFICIARY_ENC_KEY: undefined,
    });

    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(() => new BeneficiaryService(prisma, stitch, config)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('BENEFICIARY_ENC_KEY unset'),
    );
    warnSpy.mockRestore();
  });

  it('boots without warning when PAYOUTS_ENABLED=true and BENEFICIARY_ENC_KEY is set', () => {
    const config = makeConfig({
      PAYOUTS_ENABLED: 'true',
      BENEFICIARY_ENC_KEY: 'a'.repeat(32),
    });

    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(() => new BeneficiaryService(prisma, stitch, config)).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
