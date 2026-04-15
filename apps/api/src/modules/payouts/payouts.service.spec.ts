import { ConfigService } from '@nestjs/config';
import { StitchPayoutStatus } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { StitchClient } from '../stitch/stitch.client';
import { WalletProjectionService } from '../wallet/wallet-projection.service';
import { PayoutsService } from './payouts.service';

describe('PayoutsService.initiatePayout — beneficiary id resolution', () => {
  // Guards against the recurring bug where we pass the internal FK
  // (StitchPayout.beneficiaryId) to Stitch instead of the Stitch-side id
  // (StitchBeneficiary.stitchBeneficiaryId).
  it('passes beneficiary.stitchBeneficiaryId to Stitch, not the internal FK', async () => {
    const beneficiary = {
      id: 'internal-bene-uuid',
      stitchBeneficiaryId: 'stitch-side-bene-id',
      userId: 'hunter-1',
    };

    const prisma: any = {
      stitchBeneficiary: {
        findUnique: jest.fn().mockResolvedValue(beneficiary),
      },
      stitchPayout: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payout-uuid',
          ...data,
        })),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const ledger = {
      postTransactionGroup: jest.fn().mockResolvedValue({ transactionGroupId: 'grp-1' }),
    } as unknown as LedgerService;

    const stitch = {
      createPayout: jest.fn().mockResolvedValue({ id: 'stitch-payout-1', status: 'PENDING' }),
    } as unknown as StitchClient;

    const projection = {} as WalletProjectionService;
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const map: Record<string, string> = {
          STITCH_MIN_PAYOUT_CENTS: '2000',
          STITCH_PAYOUT_SPEED: 'DEFAULT',
          STITCH_SYSTEM_ACTOR_ID: 'system-actor-1',
        };
        return map[key] ?? fallback;
      }),
    } as unknown as ConfigService;

    const service = new PayoutsService(
      prisma as PrismaService,
      ledger,
      stitch,
      projection,
      config,
    );

    await service.initiatePayout('hunter-1', beneficiary.id, 10_000n);

    expect(prisma.stitchBeneficiary.findUnique).toHaveBeenCalledWith({
      where: { id: beneficiary.id },
    });

    expect(stitch.createPayout).toHaveBeenCalledTimes(1);
    const [params] = (stitch.createPayout as jest.Mock).mock.calls[0];
    // Critical assertion — if this regresses, every live payout will reference
    // a non-existent Stitch resource.
    expect(params.beneficiaryId).toBe('stitch-side-bene-id');
    expect(params.beneficiaryId).not.toBe('internal-bene-uuid');

    // StitchPayout row still stores the internal FK — unchanged.
    expect(prisma.stitchPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ beneficiaryId: 'internal-bene-uuid' }),
    });
  });

  it('throws if the beneficiary row is missing (before any Stitch call or ledger write)', async () => {
    const prisma: any = {
      stitchBeneficiary: { findUnique: jest.fn().mockResolvedValue(null) },
      stitchPayout: { create: jest.fn(), update: jest.fn() },
    };
    const ledger = { postTransactionGroup: jest.fn() } as unknown as LedgerService;
    const stitch = { createPayout: jest.fn() } as unknown as StitchClient;
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const map: Record<string, string> = {
          STITCH_SYSTEM_ACTOR_ID: 'system-actor-1',
        };
        return map[key] ?? fallback;
      }),
    } as unknown as ConfigService;

    const service = new PayoutsService(
      prisma as PrismaService,
      ledger,
      stitch,
      {} as WalletProjectionService,
      config,
    );

    await expect(
      service.initiatePayout('hunter-1', 'missing-bene', 10_000n),
    ).rejects.toThrow(/Beneficiary .* not found/);

    expect(ledger.postTransactionGroup).not.toHaveBeenCalled();
    expect(stitch.createPayout).not.toHaveBeenCalled();
    expect(prisma.stitchPayout.create).not.toHaveBeenCalled();
  });
});

describe('PayoutsService.retryBatch — beneficiary id resolution', () => {
  it('uses payout.beneficiary.stitchBeneficiaryId for each retried payout', async () => {
    const payoutA = {
      id: 'payout-A',
      userId: 'hunter-1',
      beneficiaryId: 'internal-A',
      merchantReference: 'ref-A',
      idempotencyKey: 'idem-A',
      amountCents: 5000n,
      attempts: 1,
      speed: 'DEFAULT',
      beneficiary: {
        id: 'internal-A',
        stitchBeneficiaryId: 'stitch-bene-A',
      },
    };

    const prisma: any = {
      stitchPayout: {
        findMany: jest.fn().mockResolvedValue([payoutA]),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const ledger = {} as unknown as LedgerService;
    const stitch = {
      createPayout: jest.fn().mockResolvedValue({ id: 'stitch-new', status: 'PENDING' }),
    } as unknown as StitchClient;
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => fallback),
    } as unknown as ConfigService;

    const service = new PayoutsService(
      prisma as PrismaService,
      ledger,
      stitch,
      {} as WalletProjectionService,
      config,
    );

    const result = await service.retryBatch();

    expect(result.retried).toBe(1);
    expect(prisma.stitchPayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { beneficiary: true },
      }),
    );
    const [params] = (stitch.createPayout as jest.Mock).mock.calls[0];
    expect(params.beneficiaryId).toBe('stitch-bene-A');
    expect(params.beneficiaryId).not.toBe('internal-A');

    // Updates the row with the new stitchPayoutId + INITIATED status.
    expect(prisma.stitchPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payout-A' },
        data: expect.objectContaining({
          stitchPayoutId: 'stitch-new',
          status: StitchPayoutStatus.INITIATED,
        }),
      }),
    );
  });
});
