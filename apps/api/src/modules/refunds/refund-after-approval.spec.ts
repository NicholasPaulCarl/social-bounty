/**
 * Integration-style flow test for the post-approval / pre-payout refund scenario
 * (payment-gateway.md §11 — "refund after approval").
 *
 * Exercises RefundsService.requestAfterApproval with in-memory Prisma stubs at the
 * service boundary. Matches the pattern in refund-approval-flow.spec.ts and
 * refund-after-payout.spec.ts.
 *
 * Contract under test: `requestAfterApproval` is a one-step SUPER_ADMIN-only
 * action. It creates a Refund (APPROVED), posts a compensating ledger group
 * that reverses the earnings split and returns face value to brand_reserve,
 * then calls Stitch. Final state is PROCESSING with stitchRefundId +
 * transactionGroupId captured. The webhook flips state → COMPLETED (covered
 * by refund-approval-flow.spec.ts).
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  LedgerAccount,
  PaymentStatus,
  RefundScenario,
  RefundState,
  StitchPaymentLinkStatus,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { RefundsService } from './refunds.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { StitchClient } from '../stitch/stitch.client';
import type {
  PostTransactionGroupInput,
  PostTransactionGroupResult,
} from '../ledger/ledger.service';
import { LedgerEntryType } from '@prisma/client';

type AuthUser = {
  sub: string;
  email: string;
  role: string;
  brandId: string | null;
};

const BUSINESS_ADMIN: AuthUser = {
  sub: 'ba-1',
  email: 'ba@test.com',
  role: UserRole.BUSINESS_ADMIN,
  brandId: 'brand-1',
};

const SUPER_ADMIN: AuthUser = {
  sub: 'sa-1',
  email: 'sa@test.com',
  role: UserRole.SUPER_ADMIN,
  brandId: null,
};

// ---------------------------------------------------------------------------
// In-memory stubs (same shape as refund-approval-flow.spec.ts, extended for
// submissions + payouts which this scenario relies on).
// ---------------------------------------------------------------------------

interface BountyRow {
  id: string;
  brandId: string;
  faceValueCents: bigint | null;
  paymentStatus: PaymentStatus;
  brandAdminFeeRateBps: number | null;
  globalFeeRateBps: number | null;
  currency: 'ZAR';
  stitchPaymentLinks: Array<{
    id: string;
    status: StitchPaymentLinkStatus;
    stitchPaymentId: string | null;
  }>;
}

interface SubmissionRow {
  id: string;
  bountyId: string;
  userId: string;
  hunterNetCents: bigint | null;
  payout: { id: string; paidAt: Date | null } | null;
}

interface RefundRow {
  id: string;
  bountyId: string;
  submissionId: string | null;
  scenario: RefundScenario;
  state: RefundState;
  amountCents: bigint;
  reason: string;
  requestedByUserId: string;
  approvedByUserId?: string | null;
  approvalNote?: string | null;
  dualApprovalByUserId?: string | null;
  kbEntryId?: string | null;
  stitchRefundId?: string | null;
  transactionGroupId?: string | null;
}

function buildBountyRow(overrides: Partial<BountyRow> = {}): BountyRow {
  return {
    id: 'bounty_1',
    brandId: 'brand-1',
    faceValueCents: 50000n,
    paymentStatus: PaymentStatus.PAID,
    brandAdminFeeRateBps: 500,
    globalFeeRateBps: 350,
    currency: 'ZAR',
    stitchPaymentLinks: [
      {
        id: 'spl_1',
        status: StitchPaymentLinkStatus.SETTLED,
        stitchPaymentId: 'stitch_pay_1',
      },
    ],
    ...overrides,
  };
}

function buildSubmissionRow(overrides: Partial<SubmissionRow> = {}): SubmissionRow {
  return {
    id: 'submission_1',
    bountyId: 'bounty_1',
    userId: 'hunter-1',
    hunterNetCents: 45000n,
    payout: null,
    ...overrides,
  };
}

function buildPrismaStub(seed: { bounty: BountyRow; submission: SubmissionRow }) {
  const bounties = new Map<string, BountyRow>();
  bounties.set(seed.bounty.id, seed.bounty);
  const submissions = new Map<string, SubmissionRow>();
  submissions.set(seed.submission.id, seed.submission);
  const refunds = new Map<string, RefundRow>();
  let refundSeq = 0;

  const prisma = {
    bounty: {
      findUnique: jest.fn(async () => null),
      update: jest.fn(),
    },
    submission: {
      findUnique: jest.fn(async (args: { where: { id: string }; include?: any }) => {
        const s = submissions.get(args.where.id);
        if (!s) return null;
        const bounty = bounties.get(s.bountyId)!;
        return {
          ...s,
          bounty: { ...bounty },
          payout: s.payout ? { ...s.payout } : null,
        };
      }),
    },
    refund: {
      create: jest.fn(async (args: { data: Partial<RefundRow> }) => {
        refundSeq += 1;
        const id = `refund_${refundSeq}`;
        const row: RefundRow = {
          id,
          bountyId: args.data.bountyId!,
          submissionId: args.data.submissionId ?? null,
          scenario: args.data.scenario!,
          state: args.data.state!,
          amountCents: args.data.amountCents!,
          reason: args.data.reason!,
          requestedByUserId: args.data.requestedByUserId!,
          approvedByUserId: args.data.approvedByUserId ?? null,
          approvalNote: args.data.approvalNote ?? null,
          dualApprovalByUserId: args.data.dualApprovalByUserId ?? null,
          kbEntryId: args.data.kbEntryId ?? null,
          stitchRefundId: args.data.stitchRefundId ?? null,
          transactionGroupId: args.data.transactionGroupId ?? null,
        };
        refunds.set(id, row);
        return { ...row };
      }),
      findUnique: jest.fn(),
      update: jest.fn(
        async (args: { where: { id: string }; data: Partial<RefundRow> }) => {
          const existing = refunds.get(args.where.id);
          if (!existing) throw new Error(`refund ${args.where.id} not found`);
          const next = { ...existing, ...args.data } as RefundRow;
          refunds.set(next.id, next);
          return { ...next };
        },
      ),
    },
    _bounties: bounties,
    _submissions: submissions,
    _refunds: refunds,
  };
  return prisma;
}

function buildLedgerStub() {
  const groups = new Map<string, { id: string; input: PostTransactionGroupInput }>();
  let groupSeq = 0;

  const postTransactionGroup = jest.fn(
    async (input: PostTransactionGroupInput): Promise<PostTransactionGroupResult> => {
      let debit = 0n;
      let credit = 0n;
      for (const leg of input.legs) {
        if (leg.type === LedgerEntryType.DEBIT) debit += leg.amountCents;
        else credit += leg.amountCents;
      }
      if (debit !== credit) {
        throw new Error(`stub: unbalanced group debits=${debit} credits=${credit}`);
      }
      const key = `${input.referenceId}::${input.actionType}`;
      const existing = groups.get(key);
      if (existing) {
        return { transactionGroupId: existing.id, idempotent: true };
      }
      groupSeq += 1;
      const id = `grp_${groupSeq}`;
      groups.set(key, { id, input });
      return { transactionGroupId: id, idempotent: false };
    },
  );

  return { postTransactionGroup, _groups: groups };
}

function buildStitchStub() {
  return {
    createRefund: jest.fn(async () => ({ id: 'stitch_r_1', status: 'PROCESSING' })),
  };
}

function buildService(
  seed: { bounty?: Partial<BountyRow>; submission?: Partial<SubmissionRow> } = {},
) {
  const prisma = buildPrismaStub({
    bounty: buildBountyRow(seed.bounty),
    submission: buildSubmissionRow(seed.submission),
  });
  const ledger = buildLedgerStub();
  const stitch = buildStitchStub();
  const service = new RefundsService(
    prisma as unknown as PrismaService,
    ledger as unknown as LedgerService,
    stitch as unknown as StitchClient,
  );
  return { service, prisma, ledger, stitch };
}

// ---------------------------------------------------------------------------

describe('RefundsService — after-approval (post-approval, pre-payout) refund', () => {
  describe('happy path', () => {
    it('creates a Refund row (APPROVED → PROCESSING), posts a balanced compensating group, and calls Stitch', async () => {
      const { service, prisma, ledger, stitch } = buildService();

      const refund = await service.requestAfterApproval(
        'submission_1',
        'brand changed mind',
        SUPER_ADMIN,
      );

      // Final persisted state after the one-step flow.
      expect(refund.scenario).toBe(RefundScenario.AFTER_APPROVAL);
      expect(refund.state).toBe(RefundState.PROCESSING);
      expect(refund.amountCents).toBe(50000n);
      expect(refund.bountyId).toBe('bounty_1');
      expect(refund.submissionId).toBe('submission_1');
      expect(refund.requestedByUserId).toBe(SUPER_ADMIN.sub);
      expect(refund.approvedByUserId).toBe(SUPER_ADMIN.sub);
      expect(refund.stitchRefundId).toBe('stitch_r_1');
      expect(refund.transactionGroupId).toMatch(/^grp_/);

      // Row was actually persisted in our in-memory stub.
      expect(prisma._refunds.size).toBe(1);

      // Ledger group: posted exactly once, balanced, reverses the earnings split.
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      const posted = ledger.postTransactionGroup.mock.calls[0][0];
      expect(posted.actionType).toBe('refund_processed');
      expect(posted.referenceId).toBe(refund.id);
      expect(posted.referenceType).toBe('Refund');
      expect(posted.postedBy).toBe(SUPER_ADMIN.sub);
      expect(posted.audit.action).toBe('REFUND_AFTER_APPROVAL');
      expect(posted.audit.entityId).toBe(refund.id);

      // Double-entry integrity.
      // With faceValue=50000, globalFeeRateBps=350, hunterNet=45000:
      //   globalFee = 50000 * 350 / 10000 = 1750
      //   commission = 50000 - 45000 - 1750 = 3250
      // Leg sum (each side) = commission + globalFee + hunterNet (== faceValue) + faceValue = 100000
      // because the split-undo is 50000 and the drain leg is another 50000.
      let debit = 0n;
      let credit = 0n;
      for (const leg of posted.legs) {
        if (leg.type === 'DEBIT') debit += leg.amountCents;
        else credit += leg.amountCents;
      }
      expect(debit).toBe(credit);
      expect(debit).toBe(100000n);

      // Leg presence: reversed CREDITs of the approval group become DEBITs,
      // and brand_reserve is credited for the face value.
      const byAccountType = (acc: LedgerAccount, type: 'DEBIT' | 'CREDIT') =>
        posted.legs.find((l: any) => l.account === acc && l.type === type);

      expect(byAccountType(LedgerAccount.commission_revenue, 'DEBIT')!.amountCents).toBe(3250n);
      expect(byAccountType(LedgerAccount.global_fee_revenue, 'DEBIT')!.amountCents).toBe(1750n);
      expect(byAccountType(LedgerAccount.hunter_net_payable, 'DEBIT')!.amountCents).toBe(45000n);

      // hunter_pending appears on both sides (split-undo CREDIT + drain DEBIT).
      const pendingLegs = posted.legs.filter(
        (l: any) => l.account === LedgerAccount.hunter_pending,
      );
      expect(pendingLegs).toHaveLength(2);
      expect(pendingLegs.find((l: any) => l.type === 'CREDIT')!.amountCents).toBe(50000n);
      expect(pendingLegs.find((l: any) => l.type === 'DEBIT')!.amountCents).toBe(50000n);

      // Face value lands back in brand_reserve (pinned to the bounty + brand).
      const reserveCredit = byAccountType(LedgerAccount.brand_reserve, 'CREDIT');
      expect(reserveCredit).toBeDefined();
      expect(reserveCredit!.amountCents).toBe(50000n);
      expect(reserveCredit!.brandId).toBe('brand-1');
      expect(reserveCredit!.bountyId).toBe('bounty_1');

      // Stitch refund call: exactly one, with the settled payment id + face value.
      expect(stitch.createRefund).toHaveBeenCalledTimes(1);
      expect(stitch.createRefund).toHaveBeenCalledWith(
        'stitch_pay_1',
        50000n,
        'REQUESTED_BY_CUSTOMER',
      );
    });

    it('rejects when the bounty has no settled Stitch payment link → BadRequestException', async () => {
      const { service } = buildService({
        bounty: { stitchPaymentLinks: [] },
      });
      await expect(
        service.requestAfterApproval('submission_1', 'no link', SUPER_ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('idempotency at the ledger boundary', () => {
    it('replaying the same (referenceId, actionType) is a no-op — no second group', async () => {
      const { service, ledger } = buildService();

      const refund = await service.requestAfterApproval(
        'submission_1',
        'brand changed mind',
        SUPER_ADMIN,
      );
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      expect(ledger._groups.size).toBe(1);

      // Simulate a webhook replay using the same (referenceId, actionType).
      const firstCallInput = ledger.postTransactionGroup.mock.calls[0][0];
      const replay = await ledger.postTransactionGroup(firstCallInput);
      expect(replay.idempotent).toBe(true);
      expect(replay.transactionGroupId).toBe(refund.transactionGroupId);
      expect(ledger._groups.size).toBe(1);
    });
  });

  describe('RBAC', () => {
    it('rejects a Business Admin → ForbiddenException', async () => {
      const { service } = buildService();
      await expect(
        service.requestAfterApproval('submission_1', 'brand changed mind', BUSINESS_ADMIN),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a Participant → ForbiddenException', async () => {
      const { service } = buildService();
      const participant: AuthUser = {
        sub: 'p-1',
        email: 'p@test.com',
        role: UserRole.PARTICIPANT,
        brandId: null,
      };
      await expect(
        service.requestAfterApproval('submission_1', 'n/a', participant),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('guards against wrong-scenario usage', () => {
    it('rejects when the submission has already been paid out (points at after-payout endpoint)', async () => {
      const { service } = buildService({
        submission: { payout: { id: 'payout_1', paidAt: new Date() } },
      });
      await expect(
        service.requestAfterApproval('submission_1', 'oops', SUPER_ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the submission has no hunterNetCents snapshot → BadRequestException', async () => {
      const { service } = buildService({
        submission: { hunterNetCents: null },
      });
      await expect(
        service.requestAfterApproval('submission_1', 'oops', SUPER_ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the bounty has no faceValueCents snapshot → BadRequestException', async () => {
      const { service } = buildService({
        bounty: { faceValueCents: null },
      });
      await expect(
        service.requestAfterApproval('submission_1', 'oops', SUPER_ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the submission does not exist', async () => {
      const { service } = buildService();
      await expect(
        service.requestAfterApproval('submission_does_not_exist', 'oops', SUPER_ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
