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

// -------------------------------------------------------------------------
// Fault-injection: exponential backoff + terminal RETRY_PENDING transition.
//
// retryBatch sets nextRetryAt = now + 2^attempts * 60min and flips to
// RETRY_PENDING on attempts >= 3. These tests simulate Stitch failures across
// consecutive retry batches and assert the persisted row state at each step.
// They also verify the same idempotencyKey is replayed on every attempt
// (Stitch dedupes on Idempotency-Key) and that RETRY_PENDING rows are filtered
// out of the retryBatch candidate query (so there is no 4th call).
// -------------------------------------------------------------------------

describe('PayoutsService.retryBatch — exponential backoff fault injection', () => {
  // Tolerance for Date.now() drift between service call and assertion.
  const BACKOFF_TOLERANCE_MS = 5000;

  function approxDelta(actual: Date, expectedMs: number): boolean {
    const delta = actual.getTime() - Date.now();
    return Math.abs(delta - expectedMs) < BACKOFF_TOLERANCE_MS;
  }

  function buildHarness(row: any) {
    // The row mutates in place across retry iterations so that the next
    // findMany reflects the persisted state written by the previous iteration.
    const prisma: any = {
      stitchPayout: {
        findMany: jest.fn(async (args: any) => {
          // Mirror the real query filter: status=FAILED, attempts<3,
          // nextRetryAt null OR <= now. Once attempts >= 3 the row's status
          // is RETRY_PENDING, so it must NOT match.
          const where = args?.where ?? {};
          if (row.status !== where.status) return [];
          if (where.attempts?.lt !== undefined && !(row.attempts < where.attempts.lt)) {
            return [];
          }
          // Respect nextRetryAt gating — caller checks "null OR lte now".
          if (row.nextRetryAt && row.nextRetryAt.getTime() > Date.now()) return [];
          return [row];
        }),
        update: jest.fn(async ({ where, data }: any) => {
          if (where.id !== row.id) return {};
          // Apply the update so the next findMany sees the new state.
          if (data.attempts !== undefined) row.attempts = data.attempts;
          if (data.status !== undefined) row.status = data.status;
          if (data.nextRetryAt !== undefined) row.nextRetryAt = data.nextRetryAt;
          if (data.lastAttemptAt !== undefined) row.lastAttemptAt = data.lastAttemptAt;
          if (data.lastError !== undefined) row.lastError = data.lastError;
          return { ...row };
        }),
      },
    };

    const ledger = {} as unknown as LedgerService;
    const stitch = {
      // Always fail — that's the whole point of this fault injection.
      createPayout: jest.fn().mockRejectedValue(new Error('gateway down')),
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

    return { prisma, stitch, service };
  }

  it('drives attempts 1→3 with 2h/4h backoff, flips to RETRY_PENDING, replays same idempotencyKey, and filters out once terminal', async () => {
    const row = {
      id: 'payout-X',
      userId: 'hunter-X',
      beneficiaryId: 'internal-X',
      merchantReference: 'ref-X',
      idempotencyKey: 'idem-stable-X',
      amountCents: 5000n,
      speed: 'DEFAULT',
      attempts: 0,
      status: StitchPayoutStatus.FAILED,
      nextRetryAt: null as Date | null,
      lastAttemptAt: null as Date | null,
      lastError: null as string | null,
      beneficiary: {
        id: 'internal-X',
        stitchBeneficiaryId: 'stitch-bene-X',
      },
    };

    const { prisma, stitch, service } = buildHarness(row);

    // --- Attempt 1 fails ---
    // Pre: attempts=0, status=FAILED → passes filter.
    const r1 = await service.retryBatch();
    expect(r1.retried).toBe(0); // failure path increments "attempts", not "retried"
    expect(row.attempts).toBe(1);
    expect(row.status).toBe(StitchPayoutStatus.FAILED);
    expect(row.nextRetryAt).not.toBeNull();
    // 2^1 * 60min = 2h
    expect(approxDelta(row.nextRetryAt!, 2 * 60 * 60 * 1000)).toBe(true);

    // --- Attempt 2 fails ---
    // Clear the backoff gate so findMany returns the row for this iteration
    // (the query filter uses nextRetryAt <= now OR null; in real life the
    //  batch job runs on a cron and time has elapsed). We simulate that by
    //  back-dating nextRetryAt.
    row.nextRetryAt = new Date(Date.now() - 1000);
    const r2 = await service.retryBatch();
    expect(r2.retried).toBe(0);
    expect(row.attempts).toBe(2);
    expect(row.status).toBe(StitchPayoutStatus.FAILED);
    // 2^2 * 60min = 4h
    expect(approxDelta(row.nextRetryAt!, 4 * 60 * 60 * 1000)).toBe(true);

    // --- Attempt 3 fails → terminal RETRY_PENDING, nextRetryAt null ---
    row.nextRetryAt = new Date(Date.now() - 1000);
    const r3 = await service.retryBatch();
    expect(r3.retried).toBe(0);
    expect(row.attempts).toBe(3);
    expect(row.status).toBe(StitchPayoutStatus.RETRY_PENDING);
    expect(row.nextRetryAt).toBeNull();

    // --- Idempotency-Key replay check (same key on every attempt) ---
    const stitchCalls = (stitch.createPayout as jest.Mock).mock.calls;
    expect(stitchCalls).toHaveLength(3);
    const keys = stitchCalls.map((c) => c[1]);
    expect(keys).toEqual(['idem-stable-X', 'idem-stable-X', 'idem-stable-X']);
    // And the row's idempotencyKey was not mutated by the retry logic.
    expect(row.idempotencyKey).toBe('idem-stable-X');

    // --- Attempt 4 simulation: RETRY_PENDING must be filtered out ---
    // findMany filter: status=FAILED, attempts<3. RETRY_PENDING row matches
    // neither, so no candidate → no 4th createPayout call.
    const r4 = await service.retryBatch();
    expect(r4.retried).toBe(0);
    expect((stitch.createPayout as jest.Mock).mock.calls).toHaveLength(3);
    expect(prisma.stitchPayout.update).toHaveBeenCalledTimes(3);
    // Row state unchanged.
    expect(row.attempts).toBe(3);
    expect(row.status).toBe(StitchPayoutStatus.RETRY_PENDING);
  });
});
