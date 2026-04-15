/**
 * Integration-style flow test for the after-payout refund scenario
 * (payment-gateway.md §11 — "refund after payout").
 *
 * RefundsService.requestAfterPayout:
 *   - Requires SUPER_ADMIN actor + a distinct dual Super Admin approver
 *   - Requires a linked KB entry id (Financial Non-Negotiables: recurrence tracking)
 *   - Writes a Refund row scenario=AFTER_PAYOUT, initially APPROVED, then flips
 *     to COMPLETED after posting a compensating ledger group:
 *       DEBIT  hunter_paid     amountCents
 *       CREDIT hunter_clearing amountCents
 *   - Idempotency at the ledger layer via UNIQUE(referenceId, actionType).
 *
 * Matches the in-memory-stub pattern from refund-approval-flow.spec.ts.
 */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  LedgerAccount,
  LedgerEntryType,
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

type AuthUser = {
  sub: string;
  email: string;
  role: string;
  brandId: string | null;
};

const SUPER_ADMIN_A: AuthUser = {
  sub: 'sa-a',
  email: 'sa-a@test.com',
  role: UserRole.SUPER_ADMIN,
  brandId: null,
};

const SUPER_ADMIN_B_ID = 'sa-b';

const BUSINESS_ADMIN: AuthUser = {
  sub: 'ba-1',
  email: 'ba@test.com',
  role: UserRole.BUSINESS_ADMIN,
  brandId: 'brand-1',
};

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
  dualApprovalByUserId?: string | null;
  kbEntryId?: string | null;
  transactionGroupId?: string | null;
}

function buildBountyRow(): BountyRow {
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
  };
}

function buildSubmissionRow(overrides: Partial<SubmissionRow> = {}): SubmissionRow {
  return {
    id: 'submission_1',
    bountyId: 'bounty_1',
    userId: 'hunter-1',
    hunterNetCents: 45000n,
    payout: { id: 'payout_1', paidAt: new Date('2026-03-01T00:00:00Z') },
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
          dualApprovalByUserId: args.data.dualApprovalByUserId ?? null,
          kbEntryId: args.data.kbEntryId ?? null,
          transactionGroupId: args.data.transactionGroupId ?? null,
        };
        refunds.set(id, row);
        return { ...row };
      }),
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
  seed: { submission?: Partial<SubmissionRow> } = {},
) {
  const prisma = buildPrismaStub({
    bounty: buildBountyRow(),
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

describe('RefundsService — after-payout (dual-approval clawback) refund', () => {
  describe('happy path', () => {
    it('posts a balanced compensating group (hunter_paid DEBIT → hunter_clearing CREDIT), flips refund to COMPLETED with transactionGroupId', async () => {
      const { service, prisma, ledger } = buildService();

      const refund = await service.requestAfterPayout(
        'submission_1',
        'hunter fraud, clawback',
        'kb_123',
        SUPER_ADMIN_B_ID,
        SUPER_ADMIN_A,
      );

      // Final persisted state.
      expect(refund.state).toBe(RefundState.COMPLETED);
      expect(refund.scenario).toBe(RefundScenario.AFTER_PAYOUT);
      expect(refund.amountCents).toBe(45000n);
      expect(refund.transactionGroupId).toMatch(/^grp_/);
      expect(refund.requestedByUserId).toBe(SUPER_ADMIN_A.sub);
      expect(refund.approvedByUserId).toBe(SUPER_ADMIN_A.sub);
      expect(refund.dualApprovalByUserId).toBe(SUPER_ADMIN_B_ID);
      expect(refund.kbEntryId).toBe('kb_123');

      // Ledger group was posted exactly once.
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      const posted = ledger.postTransactionGroup.mock.calls[0][0];
      expect(posted.actionType).toBe('refund_processed');
      expect(posted.referenceId).toBe(refund.id);
      expect(posted.referenceType).toBe('Refund');
      expect(posted.postedBy).toBe(SUPER_ADMIN_A.sub);

      // Double-entry integrity: sum(debits) == sum(credits).
      let debit = 0n;
      let credit = 0n;
      for (const leg of posted.legs) {
        if (leg.type === LedgerEntryType.DEBIT) debit += leg.amountCents;
        else credit += leg.amountCents;
      }
      expect(debit).toBe(credit);
      expect(debit).toBe(45000n);

      // Exactly one DEBIT on hunter_paid and one CREDIT on hunter_clearing.
      const debitLegs = posted.legs.filter((l) => l.type === LedgerEntryType.DEBIT);
      const creditLegs = posted.legs.filter((l) => l.type === LedgerEntryType.CREDIT);
      expect(debitLegs).toHaveLength(1);
      expect(creditLegs).toHaveLength(1);
      expect(debitLegs[0].account).toBe(LedgerAccount.hunter_paid);
      expect(debitLegs[0].amountCents).toBe(45000n);
      expect(debitLegs[0].userId).toBe('hunter-1');
      expect(debitLegs[0].submissionId).toBe('submission_1');
      expect(creditLegs[0].account).toBe(LedgerAccount.hunter_clearing);
      expect(creditLegs[0].amountCents).toBe(45000n);
      expect(creditLegs[0].userId).toBe('hunter-1');
      expect(creditLegs[0].submissionId).toBe('submission_1');

      // KB entry id + dual approver captured on the clearing leg metadata.
      expect(creditLegs[0].metadata).toMatchObject({
        kbEntryId: 'kb_123',
        dualApprover: SUPER_ADMIN_B_ID,
        reason: 'hunter fraud, clawback',
      });

      // AuditLog carries the scenario-specific action.
      expect(posted.audit.action).toBe('REFUND_AFTER_PAYOUT');
      expect(posted.audit.entityType).toBe('Refund');
      expect(posted.audit.entityId).toBe(refund.id);
      expect(posted.audit.actorId).toBe(SUPER_ADMIN_A.sub);

      // In-memory row matches the returned row.
      expect(prisma._refunds.get(refund.id)!.state).toBe(RefundState.COMPLETED);
    });
  });

  describe('dual-approval guards', () => {
    it('rejects self-approval (dualApproverId === user.sub) → BadRequestException', async () => {
      const { service } = buildService();
      await expect(
        service.requestAfterPayout(
          'submission_1',
          'reason',
          'kb_123',
          SUPER_ADMIN_A.sub, // same as the actor
          SUPER_ADMIN_A,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing kbEntryId → BadRequestException', async () => {
      const { service } = buildService();
      await expect(
        service.requestAfterPayout(
          'submission_1',
          'reason',
          '', // empty → falsy guard
          SUPER_ADMIN_B_ID,
          SUPER_ADMIN_A,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('RBAC', () => {
    it('rejects non-SUPER_ADMIN actors (Business Admin) → ForbiddenException', async () => {
      const { service } = buildService();
      await expect(
        service.requestAfterPayout(
          'submission_1',
          'reason',
          'kb_123',
          SUPER_ADMIN_B_ID,
          BUSINESS_ADMIN,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('submission guards', () => {
    it('rejects when the submission has no hunterNetCents → BadRequestException', async () => {
      const { service } = buildService({ submission: { hunterNetCents: null } });
      await expect(
        service.requestAfterPayout(
          'submission_1',
          'reason',
          'kb_123',
          SUPER_ADMIN_B_ID,
          SUPER_ADMIN_A,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('idempotency at the ledger boundary', () => {
    it('posting the compensating group twice against the same refund id is idempotent — no double-write', async () => {
      const { service, ledger } = buildService();

      const refund = await service.requestAfterPayout(
        'submission_1',
        'hunter fraud, clawback',
        'kb_123',
        SUPER_ADMIN_B_ID,
        SUPER_ADMIN_A,
      );
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      expect(ledger._groups.size).toBe(1);

      // Simulate a replay (e.g. a retried webhook / worker crash) by re-calling
      // the ledger stub with the same (referenceId, actionType) key. The
      // LedgerService contract is UNIQUE(referenceId, actionType) → returns
      // idempotent=true and creates no new group.
      const firstCallInput = ledger.postTransactionGroup.mock.calls[0][0];
      const replay = await ledger.postTransactionGroup(firstCallInput);
      expect(replay.idempotent).toBe(true);
      expect(replay.transactionGroupId).toBe(refund.transactionGroupId);

      // No second group was created.
      expect(ledger._groups.size).toBe(1);
    });
  });
});
