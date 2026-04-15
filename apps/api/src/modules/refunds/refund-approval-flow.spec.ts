/**
 * Integration-style flow test for pre-approval refunds.
 *
 * Exercises the full REQUESTED → PROCESSING → COMPLETED lifecycle through
 * the real RefundsService, mocking Prisma, LedgerService and StitchClient at
 * the service boundary. Pattern mirrors reconciliation.fault-injection.spec.ts:
 * direct constructor injection with lightweight in-memory stubs.
 *
 * The webhook step is exercised by calling `RefundsService.onStitchRefundProcessed`
 * directly — the WebhookRouterService is a thin (type,status) dispatcher to this
 * method (see webhook-router.service.ts line 56–60) and is covered separately.
 *
 * RBAC on the controller is covered in refunds.controller.rbac.spec.ts; here we
 * only assert the service-level contract (ForbiddenException for non-SUPER_ADMIN).
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
// In-memory Prisma stub: just the tables RefundsService touches.
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
  submissions: Array<{ id: string; status: string }>;
}

interface RefundRow {
  id: string;
  bountyId: string;
  scenario: RefundScenario;
  state: RefundState;
  amountCents: bigint;
  reason: string;
  requestedByUserId: string;
  approvedByUserId?: string | null;
  approvalNote?: string | null;
  stitchRefundId?: string | null;
  transactionGroupId?: string | null;
  bounty?: BountyRow;
}

function buildPrismaStub(seed: { bounty: BountyRow }) {
  const bounties = new Map<string, BountyRow>();
  bounties.set(seed.bounty.id, seed.bounty);
  const refunds = new Map<string, RefundRow>();
  let refundSeq = 0;

  const prisma = {
    bounty: {
      findUnique: jest.fn(async (args: { where: { id: string }; include?: any }) => {
        const b = bounties.get(args.where.id);
        if (!b) return null;
        // Shallow clone so the service can't mutate our state via include results.
        return {
          ...b,
          submissions: b.submissions.map((s) => ({ ...s })),
          stitchPaymentLinks: b.stitchPaymentLinks.map((l) => ({ ...l })),
        };
      }),
      update: jest.fn(
        async (args: { where: { id: string }; data: Partial<BountyRow> }) => {
          const existing = bounties.get(args.where.id);
          if (!existing) throw new Error(`bounty ${args.where.id} not found`);
          const next = { ...existing, ...args.data } as BountyRow;
          bounties.set(next.id, next);
          return next;
        },
      ),
    },
    refund: {
      create: jest.fn(async (args: { data: Partial<RefundRow> }) => {
        refundSeq += 1;
        const id = `refund_${refundSeq}`;
        const row: RefundRow = {
          id,
          bountyId: args.data.bountyId!,
          scenario: args.data.scenario!,
          state: args.data.state!,
          amountCents: args.data.amountCents!,
          reason: args.data.reason!,
          requestedByUserId: args.data.requestedByUserId!,
          approvedByUserId: args.data.approvedByUserId ?? null,
          approvalNote: args.data.approvalNote ?? null,
          stitchRefundId: args.data.stitchRefundId ?? null,
          transactionGroupId: args.data.transactionGroupId ?? null,
        };
        refunds.set(id, row);
        return { ...row };
      }),
      findUnique: jest.fn(async (args: { where: any; include?: any }) => {
        let row: RefundRow | undefined;
        if (args.where.id) row = refunds.get(args.where.id);
        else if (args.where.stitchRefundId) {
          row = [...refunds.values()].find(
            (r) => r.stitchRefundId === args.where.stitchRefundId,
          );
        }
        if (!row) return null;
        const result: any = { ...row };
        if (args.include?.bounty) {
          const bounty = bounties.get(row.bountyId)!;
          if (args.include.bounty.include?.stitchPaymentLinks) {
            result.bounty = {
              ...bounty,
              stitchPaymentLinks: bounty.stitchPaymentLinks.map((l) => ({ ...l })),
            };
          } else {
            result.bounty = { ...bounty };
          }
        }
        return result;
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
    // Handles for the tests to inspect internal state.
    _bounties: bounties,
    _refunds: refunds,
  };
  return prisma;
}

// ---------------------------------------------------------------------------
// LedgerService stub: records calls and enforces balance, fakes idempotency via
// UNIQUE(referenceId, actionType).
// ---------------------------------------------------------------------------

function buildLedgerStub() {
  const groups = new Map<string, { id: string; input: PostTransactionGroupInput }>();
  let groupSeq = 0;

  const postTransactionGroup = jest.fn(
    async (input: PostTransactionGroupInput): Promise<PostTransactionGroupResult> => {
      // Mimic the real balance check so any test drift produces a loud failure.
      let debit = 0n;
      let credit = 0n;
      for (const leg of input.legs) {
        if (leg.type === LedgerEntryType.DEBIT) debit += leg.amountCents;
        else credit += leg.amountCents;
      }
      if (debit !== credit) {
        throw new Error(
          `stub: unbalanced group debits=${debit} credits=${credit}`,
        );
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

  return {
    postTransactionGroup,
    _groups: groups,
  };
}

// ---------------------------------------------------------------------------

function buildStitchStub() {
  return {
    createRefund: jest.fn(async () => ({ id: 'stitch_r_1', status: 'PROCESSING' })),
  };
}

function buildBountyRow(): BountyRow {
  return {
    id: 'bounty_1',
    brandId: 'brand-1',
    faceValueCents: 50000n,
    paymentStatus: PaymentStatus.PAID,
    brandAdminFeeRateBps: 500, // 5%
    globalFeeRateBps: 350, // 3.5%
    currency: 'ZAR',
    stitchPaymentLinks: [
      {
        id: 'spl_1',
        status: StitchPaymentLinkStatus.SETTLED,
        stitchPaymentId: 'stitch_pay_1',
      },
    ],
    submissions: [],
  };
}

function buildService() {
  const prisma = buildPrismaStub({ bounty: buildBountyRow() });
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

describe('RefundsService — pre-approval refund end-to-end', () => {
  describe('happy path: request → approve → webhook', () => {
    it('creates a REQUESTED refund, flips to PROCESSING on approval, then COMPLETED + REFUNDED on webhook with a balanced ledger group', async () => {
      const { service, prisma, ledger, stitch } = buildService();

      // 1. Business Admin requests the refund.
      const requested = await service.requestBeforeApproval(
        'bounty_1',
        'customer cancelled the campaign',
        BUSINESS_ADMIN,
      );
      expect(requested.state).toBe(RefundState.REQUESTED);
      expect(requested.scenario).toBe(RefundScenario.BEFORE_APPROVAL);
      expect(requested.amountCents).toBe(50000n);
      expect(requested.requestedByUserId).toBe(BUSINESS_ADMIN.sub);

      // 2. Super Admin approves.
      const approved = await service.approveBeforeApproval(
        requested.id,
        SUPER_ADMIN,
        'approved by finance',
      );
      expect(approved.state).toBe(RefundState.PROCESSING);
      expect(approved.stitchRefundId).toBe('stitch_r_1');
      expect(approved.approvedByUserId).toBe(SUPER_ADMIN.sub);
      expect(stitch.createRefund).toHaveBeenCalledTimes(1);
      expect(stitch.createRefund).toHaveBeenCalledWith(
        'stitch_pay_1',
        50000n,
        'REQUESTED_BY_CUSTOMER',
      );

      // 3. Stitch webhook dispatches → onStitchRefundProcessed.
      await service.onStitchRefundProcessed('stitch_r_1');

      // Refund must be COMPLETED with a transactionGroupId.
      const finalRefund = prisma._refunds.get(requested.id)!;
      expect(finalRefund.state).toBe(RefundState.COMPLETED);
      expect(finalRefund.transactionGroupId).toMatch(/^grp_/);

      // Bounty must be REFUNDED.
      const finalBounty = prisma._bounties.get('bounty_1')!;
      expect(finalBounty.paymentStatus).toBe(PaymentStatus.REFUNDED);

      // Ledger posted exactly once with the correct action / reference.
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      const postedInput = ledger.postTransactionGroup.mock.calls[0][0];
      expect(postedInput.actionType).toBe('refund_processed');
      expect(postedInput.referenceId).toBe(requested.id);
      expect(postedInput.referenceType).toBe('Refund');
      expect(postedInput.postedBy).toBe('stitch-webhook');

      // Legs sum to balanced: sum(debits) == sum(credits).
      let debitSum = 0n;
      let creditSum = 0n;
      for (const leg of postedInput.legs) {
        if (leg.type === LedgerEntryType.DEBIT) debitSum += leg.amountCents;
        else creditSum += leg.amountCents;
      }
      expect(debitSum).toBe(creditSum);

      // Face-value + admin-fee (5%) + global-fee (3.5%) = gateway credit.
      // 50_000 + 2_500 + 1_750 = 54_250
      expect(debitSum).toBe(54250n);

      // And the individual legs exist on the right accounts.
      const byAccount = new Map<string, (typeof postedInput.legs)[number]>();
      for (const leg of postedInput.legs) byAccount.set(leg.account, leg);
      expect(byAccount.get(LedgerAccount.brand_reserve)?.amountCents).toBe(50000n);
      expect(byAccount.get(LedgerAccount.admin_fee_revenue)?.amountCents).toBe(2500n);
      expect(byAccount.get(LedgerAccount.global_fee_revenue)?.amountCents).toBe(1750n);
      expect(byAccount.get(LedgerAccount.gateway_clearing)?.amountCents).toBe(54250n);
      // External reference on the gateway leg points at the Stitch refund id.
      expect(byAccount.get(LedgerAccount.gateway_clearing)?.externalReference).toBe(
        'stitch_r_1',
      );
    });
  });

  describe('RBAC at the service contract', () => {
    it('rejects a Business Admin attempting to approve → ForbiddenException', async () => {
      const { service } = buildService();
      const requested = await service.requestBeforeApproval(
        'bounty_1',
        'customer cancelled the campaign',
        BUSINESS_ADMIN,
      );
      await expect(
        service.approveBeforeApproval(requested.id, BUSINESS_ADMIN),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('state-machine guard', () => {
    it('rejects approval of a non-REQUESTED refund → BadRequestException', async () => {
      const { service, prisma } = buildService();
      const requested = await service.requestBeforeApproval(
        'bounty_1',
        'customer cancelled the campaign',
        BUSINESS_ADMIN,
      );
      // First approval moves it to PROCESSING.
      await service.approveBeforeApproval(requested.id, SUPER_ADMIN);
      expect(prisma._refunds.get(requested.id)!.state).toBe(RefundState.PROCESSING);

      // Second approval attempt (PROCESSING → approve) must fail.
      await expect(
        service.approveBeforeApproval(requested.id, SUPER_ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('webhook idempotency', () => {
    it('replaying the same stitchRefundId does not post a second ledger group', async () => {
      const { service, ledger, prisma } = buildService();

      const requested = await service.requestBeforeApproval(
        'bounty_1',
        'customer cancelled the campaign',
        BUSINESS_ADMIN,
      );
      await service.approveBeforeApproval(requested.id, SUPER_ADMIN);

      // First webhook.
      await service.onStitchRefundProcessed('stitch_r_1');
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);
      const firstGroupId = prisma._refunds.get(requested.id)!.transactionGroupId;
      expect(firstGroupId).toMatch(/^grp_/);

      // Replay: refund is COMPLETED, service short-circuits before ledger posts
      // again. (Belt-and-braces: even if it didn't, the LedgerService stub
      // enforces UNIQUE(referenceId, actionType) and would return idempotent.)
      await service.onStitchRefundProcessed('stitch_r_1');
      expect(ledger.postTransactionGroup).toHaveBeenCalledTimes(1);

      // State unchanged.
      expect(prisma._refunds.get(requested.id)!.state).toBe(RefundState.COMPLETED);
      expect(prisma._refunds.get(requested.id)!.transactionGroupId).toBe(firstGroupId);

      // Ledger stub still carries exactly one group keyed by (refund.id, refund_processed).
      expect(ledger._groups.size).toBe(1);
      expect(ledger._groups.has(`${requested.id}::refund_processed`)).toBe(true);
    });
  });
});
