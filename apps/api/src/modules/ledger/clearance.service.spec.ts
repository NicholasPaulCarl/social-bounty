import { ConfigService } from '@nestjs/config';
import {
  JobRunStatus,
  LedgerAccount,
  LedgerEntryStatus,
  LedgerEntryType,
} from '@prisma/client';
import { ClearanceService } from './clearance.service';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClearanceService.releaseEligible', () => {
  const SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000001';

  let prisma: any;
  let ledger: Partial<LedgerService>;
  let post: jest.Mock;
  let service: ClearanceService;

  const entry = {
    id: 'entry_1',
    userId: 'hunter_1',
    submissionId: 'sub_1',
    amount: 38_250n,
    currency: 'ZAR',
    clearanceReleaseAt: new Date(Date.now() - 60 * 1000),
  };

  beforeEach(() => {
    const jobRun = { id: 'job_1' };
    prisma = {
      jobRun: {
        create: jest.fn().mockResolvedValue(jobRun),
        update: jest.fn().mockResolvedValue(jobRun),
      },
      ledgerEntry: {
        findMany: jest.fn().mockResolvedValue([entry]),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_1', idempotent: false });
    ledger = { postTransactionGroup: post };

    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'STITCH_SYSTEM_ACTOR_ID' ? SYSTEM_ACTOR : fallback,
      ),
    } as unknown as ConfigService;

    service = new ClearanceService(
      prisma as PrismaService,
      ledger as LedgerService,
      config,
    );
  });

  it('passes STITCH_SYSTEM_ACTOR_ID as actorId + postedBy to postTransactionGroup', async () => {
    const result = await service.releaseEligible();
    expect(result.released).toBe(1);
    expect(post).toHaveBeenCalledTimes(1);

    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('clearance_released');
    expect(input.referenceId).toBe(entry.id);
    expect(input.postedBy).toBe(SYSTEM_ACTOR);
    expect(input.audit.actorId).toBe(SYSTEM_ACTOR);

    // Debit/credit shape correct.
    const debit = input.legs.find((l: any) => l.type === LedgerEntryType.DEBIT);
    const credit = input.legs.find((l: any) => l.type === LedgerEntryType.CREDIT);
    expect(debit.account).toBe(LedgerAccount.hunter_net_payable);
    expect(credit.account).toBe(LedgerAccount.hunter_available);
  });

  it('throws when STITCH_SYSTEM_ACTOR_ID is not configured', async () => {
    const config = {
      get: jest.fn((_key: string, fallback?: unknown) => fallback),
    } as unknown as ConfigService;
    const missingService = new ClearanceService(
      prisma as PrismaService,
      ledger as LedgerService,
      config,
    );
    await expect(missingService.releaseEligible()).rejects.toThrow(/STITCH_SYSTEM_ACTOR_ID/);
    // Make sure the job run was marked FAILED.
    const updateCalls = prisma.jobRun.update.mock.calls;
    const failedCall = updateCalls.find(
      ([args]: any) => args?.data?.status === JobRunStatus.FAILED,
    );
    expect(failedCall).toBeDefined();
  });
});
