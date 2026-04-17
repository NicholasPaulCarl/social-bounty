import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LedgerAccount, LedgerEntryType } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { FinanceAdminService } from './finance-admin.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinanceAdminService.devSeedPayable', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let post: jest.Mock;
  let service: FinanceAdminService;

  function makeService(provider: string): FinanceAdminService {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PAYMENTS_PROVIDER' ? provider : fallback,
      ),
    } as unknown as ConfigService;
    return new FinanceAdminService(prisma as PrismaService, ledger as LedgerService, config);
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'hunter_1' }),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_dev_1', idempotent: false });
    ledger = { postTransactionGroup: post };
    service = makeService('stitch_sandbox');
  });

  it('seeds a balanced hunter_net_payable group for a SUPER_ADMIN in sandbox', async () => {
    const res = await service.devSeedPayable(
      { userId: 'hunter_1', faceValueCents: 50_000n },
      { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
    );
    expect(res.transactionGroupId).toBe('grp_dev_1');
    expect(post).toHaveBeenCalledTimes(1);
    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('compensating_entry');
    expect(input.allowDuringKillSwitch).toBe(true);
    const debit = input.legs.find((l: any) => l.type === LedgerEntryType.DEBIT);
    const credit = input.legs.find((l: any) => l.type === LedgerEntryType.CREDIT);
    expect(debit.amountCents).toBe(50_000n);
    expect(credit.amountCents).toBe(50_000n);
    expect(credit.account).toBe(LedgerAccount.hunter_net_payable);
    expect(credit.userId).toBe('hunter_1');
    // clearanceReleaseAt must be in the past so the job picks it up.
    expect(credit.clearanceReleaseAt.getTime()).toBeLessThan(Date.now());
  });

  it('refuses when PAYMENTS_PROVIDER=stitch_live', async () => {
    service = makeService('stitch_live');
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 50_000n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(post).not.toHaveBeenCalled();
  });

  it('refuses a non-SUPER_ADMIN actor', async () => {
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 50_000n },
        { sub: 'u_1', role: UserRole.PARTICIPANT },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects non-positive faceValueCents', async () => {
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 0n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown userId', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.devSeedPayable(
        { userId: 'nope', faceValueCents: 50_000n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
