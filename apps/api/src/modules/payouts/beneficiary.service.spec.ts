import { BadRequestException } from '@nestjs/common';
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
      /ADR 0007|local fallback|Peach/,
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
