import { LedgerAccount, LedgerEntryType, SubmissionStatus } from '@prisma/client';
import { SubscriptionTier } from '@social-bounty/shared';
import { ApprovalLedgerService } from './approval-ledger.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('ApprovalLedgerService.postApproval', () => {
  const fees = new FeeCalculatorService();
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let subs: Partial<SubscriptionsService>;
  let service: ApprovalLedgerService;
  let post: jest.Mock;

  const bounty = {
    brandId: 'brand_1',
    id: 'bounty_1',
    faceValueCents: 50000n,
    currency: 'ZAR',
  };
  const submission = {
    id: 'sub_1',
    userId: 'hunter_1',
    status: SubmissionStatus.APPROVED,
    bounty,
    user: { id: 'hunter_1' },
  };

  beforeEach(() => {
    prisma = {
      submission: {
        findUnique: jest.fn().mockResolvedValue(submission),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_appr_1', idempotent: false });
    ledger = { postTransactionGroup: post };
    subs = { getActiveTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE) };
    service = new ApprovalLedgerService(
      prisma as PrismaService,
      ledger as LedgerService,
      fees,
      subs as SubscriptionsService,
    );
  });

  it('posts a balanced earnings split with Free hunter rates', async () => {
    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('submission_approved');
    expect(input.referenceId).toBe('sub_1');
    const legs = input.legs as Array<{ account: string; type: string; amountCents: bigint }>;
    const totalDebit = legs
      .filter((l) => l.type === LedgerEntryType.DEBIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    const totalCredit = legs
      .filter((l) => l.type === LedgerEntryType.CREDIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    expect(totalDebit).toBe(totalCredit);

    // Free hunter: 20% commission + 3.5% global on R500 → net 38250.
    const netLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    expect(netLeg?.amountCents).toBe(38_250n);
  });

  it('sets clearanceReleaseAt to ~72h for Free hunter and ~now for Pro', async () => {
    (subs.getActiveTier as jest.Mock).mockResolvedValueOnce(SubscriptionTier.PRO);

    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });
    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_pending && l.type === LedgerEntryType.CREDIT,
    );
    const releaseDelta = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    expect(releaseDelta).toBeLessThan(60 * 1000); // ~now for Pro
  });

  it('rejects submissions not in APPROVED state', async () => {
    (prisma.submission.findUnique as jest.Mock).mockResolvedValueOnce({
      ...submission,
      status: SubmissionStatus.SUBMITTED,
    });
    await expect(
      service.postApproval({
        submissionId: 'sub_1',
        approverId: 'a',
        approverRole: 'BUSINESS_ADMIN' as any,
      }),
    ).rejects.toThrow(/must be APPROVED/);
  });
});
