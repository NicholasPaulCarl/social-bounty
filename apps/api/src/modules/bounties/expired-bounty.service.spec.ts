import { ConfigService } from '@nestjs/config';
import {
  JobRunStatus,
  LedgerAccount,
  LedgerEntryType,
} from '@prisma/client';
import { ExpiredBountyService } from './expired-bounty.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExpiredBountyService.releaseEligible', () => {
  const SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000001';

  let prisma: any;
  let ledger: Partial<LedgerService>;
  let post: jest.Mock;
  let service: ExpiredBountyService;

  function buildService(candidates: any[]): ExpiredBountyService {
    prisma = {
      jobRun: {
        create: jest.fn().mockResolvedValue({ id: 'job_1' }),
        update: jest.fn().mockResolvedValue({ id: 'job_1' }),
      },
      bounty: {
        findMany: jest.fn().mockResolvedValue(candidates),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_1', idempotent: false });
    ledger = { postTransactionGroup: post };
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'STITCH_SYSTEM_ACTOR_ID' ? SYSTEM_ACTOR : fallback,
      ),
    } as unknown as ConfigService;
    return new ExpiredBountyService(
      prisma as PrismaService,
      ledger as LedgerService,
      config,
    );
  }

  it('posts a balanced brand_reserve → brand_refundable group with correct tags', async () => {
    service = buildService([
      {
        id: 'bounty_1',
        brandId: 'brand_1',
        faceValueCents: 50_000n,
        _count: { submissions: 0 },
      },
    ]);

    const result = await service.releaseEligible();
    expect(result.released).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.ineligible).toBe(0);
    expect(post).toHaveBeenCalledTimes(1);

    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('bounty_expired_release');
    expect(input.referenceId).toBe('bounty_1');
    expect(input.referenceType).toBe('Bounty');
    expect(input.postedBy).toBe(SYSTEM_ACTOR);
    expect(input.audit.actorId).toBe(SYSTEM_ACTOR);
    expect(input.audit.action).toBe('BOUNTY_EXPIRED_RELEASE');

    // Balanced: single debit + single credit, both 50_000n.
    expect(input.legs).toHaveLength(2);
    const debit = input.legs.find((l: any) => l.type === LedgerEntryType.DEBIT);
    const credit = input.legs.find((l: any) => l.type === LedgerEntryType.CREDIT);
    expect(debit.account).toBe(LedgerAccount.brand_reserve);
    expect(debit.amountCents).toBe(50_000n);
    expect(debit.brandId).toBe('brand_1');
    expect(debit.bountyId).toBe('bounty_1');
    expect(credit.account).toBe(LedgerAccount.brand_refundable);
    expect(credit.amountCents).toBe(50_000n);
    expect(credit.brandId).toBe('brand_1');
    expect(credit.bountyId).toBe('bounty_1');

    // JobRun closed as SUCCEEDED with correct counters.
    const finalJobUpdate = prisma.jobRun.update.mock.calls.at(-1)[0];
    expect(finalJobUpdate.data.status).toBe(JobRunStatus.SUCCEEDED);
    expect(finalJobUpdate.data.itemsOk).toBe(1);
    expect(finalJobUpdate.data.details).toMatchObject({ released: 1, skipped: 0, ineligible: 0 });
  });

  it('is idempotent on repeat call: ledger returns existing group, job marks it skipped', async () => {
    service = buildService([
      {
        id: 'bounty_1',
        brandId: 'brand_1',
        faceValueCents: 50_000n,
        _count: { submissions: 0 },
      },
    ]);
    // Simulate the UNIQUE(referenceId, actionType) path in LedgerService.
    post.mockResolvedValueOnce({ transactionGroupId: 'grp_existing', idempotent: true });

    const result = await service.releaseEligible();
    expect(result.released).toBe(0);
    expect(result.skipped).toBe(1);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('skips bounties with at least one APPROVED submission (ineligible)', async () => {
    service = buildService([
      {
        id: 'bounty_approved',
        brandId: 'brand_1',
        faceValueCents: 50_000n,
        _count: { submissions: 1 },
      },
    ]);

    const result = await service.releaseEligible();
    expect(result.released).toBe(0);
    expect(result.ineligible).toBe(1);
    expect(post).not.toHaveBeenCalled();

    // Prisma query itself filters submissions.where.status=APPROVED, so a
    // count > 0 here definitionally means an approved submission exists.
    const findManyArgs = prisma.bounty.findMany.mock.calls[0][0];
    expect(findManyArgs.select._count.select.submissions.where.status).toBe('APPROVED');
  });

  it('skips bounties without a faceValueCents (null guard)', async () => {
    service = buildService([
      {
        id: 'bounty_no_face',
        brandId: 'brand_1',
        faceValueCents: null,
        _count: { submissions: 0 },
      },
    ]);

    const result = await service.releaseEligible();
    expect(result.released).toBe(0);
    expect(result.ineligible).toBe(1);
    expect(post).not.toHaveBeenCalled();
  });

  it('throws and marks JobRun FAILED when STITCH_SYSTEM_ACTOR_ID is missing', async () => {
    service = buildService([
      {
        id: 'bounty_1',
        brandId: 'brand_1',
        faceValueCents: 50_000n,
        _count: { submissions: 0 },
      },
    ]);
    // Swap the config to return nothing for the actor id.
    (service as any).config = {
      get: jest.fn((_key: string, fallback?: unknown) => fallback),
    };

    await expect(service.releaseEligible()).rejects.toThrow(/STITCH_SYSTEM_ACTOR_ID/);
    const failedUpdate = prisma.jobRun.update.mock.calls.find(
      ([args]: any) => args.data.status === JobRunStatus.FAILED,
    );
    expect(failedUpdate).toBeDefined();
  });
});
