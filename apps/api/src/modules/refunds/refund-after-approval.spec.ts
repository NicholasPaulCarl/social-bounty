/**
 * Integration-style flow test for the post-approval / pre-payout refund scenario
 * (payment-gateway.md §11 — "refund after approval").
 *
 * Exercises RefundsService.requestAfterApproval with in-memory Prisma stubs at the
 * service boundary. Matches the pattern in refund-approval-flow.spec.ts.
 *
 * Note on current production behaviour: as of this writing,
 * `requestAfterApproval` creates a Refund row in REQUESTED state and does NOT
 * yet post the compensating ledger group (the "Super Admin approves"
 * follow-up is not yet wired). Tests assert the actual shipped contract.
 * If / when the compensating ledger posting is added, these tests should be
 * extended — not changed.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
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
    it('creates a Refund row scenario=AFTER_APPROVAL, state=REQUESTED, pinned to the bounty face value', async () => {
      const { service, prisma } = buildService();

      const refund = await service.requestAfterApproval(
        'submission_1',
        'brand changed mind',
        SUPER_ADMIN,
      );

      expect(refund.scenario).toBe(RefundScenario.AFTER_APPROVAL);
      expect(refund.state).toBe(RefundState.REQUESTED);
      expect(refund.amountCents).toBe(50000n);
      expect(refund.bountyId).toBe('bounty_1');
      expect(refund.submissionId).toBe('submission_1');
      expect(refund.requestedByUserId).toBe(SUPER_ADMIN.sub);

      // Row was actually persisted in our in-memory stub.
      expect(prisma._refunds.size).toBe(1);
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
