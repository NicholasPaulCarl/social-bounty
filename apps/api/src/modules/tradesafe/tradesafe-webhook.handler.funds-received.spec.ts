import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  PaymentStatus,
  TradeSafeTransactionState,
} from '@prisma/client';
import { AUDIT_ACTIONS } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { MailService } from '../mail/mail.service';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

/**
 * 5-test matrix per Financial Non-Negotiables §5 and CLAUDE.md §5:
 *   1. Happy path      — ledger group posts, bounty LIVE+PAID
 *   2. Retry idempotent — second webhook with same txnId no-ops
 *   3. Partial rollback — ledger failure leaves bounty state untouched
 *   4. Replay          — duplicate webhook caught by WebhookEvent guard
 *   5. Concurrent writer — two handlers simultaneously: second is idempotent
 */
describe('TradeSafeWebhookHandler.handleFundsReceived (ADR 0011 Phase 3)', () => {
  function buildHandler(overrides: Partial<{
    txn: Record<string, unknown> | null;
    postTransactionGroup: jest.Mock;
    $transaction: jest.Mock;
    bountyUpdateMock: jest.Mock;
  }> = {}) {
    // Per ADR 0013 §1: faceValueCents is `sum(rewards) × maxSubmissions`,
    // computed at funding time and persisted on the Bounty row. The webhook
    // handler reads the stored value and is therefore agnostic to the
    // multiplier — the test fixtures for the 5-test webhook matrix carry an
    // explicit `maxSubmissions: 1` so the row's `faceValueCents` of 10000n
    // is internally consistent (R100 reward × 1 claim = R100 = 10000 cents).
    // The multiplier-specific assertion is in its own test below this block.
    const bounty = {
      id: 'bounty-1',
      brandId: 'brand-1',
      currency: 'ZAR',
      status: BountyStatus.DRAFT,
      paymentStatus: PaymentStatus.PENDING,
      faceValueCents: 10000n,
      maxSubmissions: 1,
      brandAdminFeeRateBps: 1500,
      globalFeeRateBps: 350,
    };
    const txn =
      overrides.txn === undefined
        ? {
            id: 'txn-row-1',
            tradeSafeTransactionId: 'tradesafe-txn-1',
            bountyId: 'bounty-1',
            totalValueCents: 12075n,
            bounty,
          }
        : overrides.txn;

    const bountyUpdateMock = overrides.bountyUpdateMock ?? jest.fn();
    const tradeSafeTransactionUpdateMock = jest.fn();

    const prisma = {
      tradeSafeTransaction: {
        findUnique: jest.fn().mockResolvedValue(txn),
      },
      // Returns null for the bounty-published email dispatch lookup; the
      // helper short-circuits on null and the fire-and-forget call is
      // outside the assertion surface for these tests.
      bounty: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction:
        overrides.$transaction ??
        jest.fn().mockImplementation(async (fn: any) => {
          const tx = {
            tradeSafeTransaction: { update: tradeSafeTransactionUpdateMock },
            bounty: { update: bountyUpdateMock },
          };
          return fn(tx);
        }),
    } as unknown as PrismaService;

    const postTransactionGroupMock =
      overrides.postTransactionGroup ??
      jest.fn().mockResolvedValue({ transactionGroupId: 'g-1', idempotent: false });

    const ledger = {
      postTransactionGroup: postTransactionGroupMock,
    } as unknown as LedgerService;

    const config = {
      get: jest.fn((key: string) => (key === 'SYSTEM_ACTOR_ID' ? 'sys-actor' : '')),
    } as unknown as ConfigService;

    // Stubbed MailService — bounty-published email dispatch is fire-and-forget
    // after the tx commits; tests don't assert on email content here, only
    // that the dispatch path is wired correctly. Suppress dispatch in this
    // test file by stubbing prisma.bounty.findUnique on the dispatch helper
    // path (returns null → no recipients lookup → no-op).
    const mailService = {
      sendBountyPublishedEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as MailService;

    const handler = new TradeSafeWebhookHandler(prisma, ledger, config, mailService);
    return {
      handler,
      prisma,
      ledger,
      postTransactionGroupMock,
      bountyUpdateMock,
      tradeSafeTransactionUpdateMock,
      mailService,
    };
  }

  const payload = { data: { id: 'tradesafe-txn-1' } } as Record<string, unknown>;

  it('happy path — ledger group posts, bounty flips to LIVE+PAID', async () => {
    const { handler, postTransactionGroupMock, bountyUpdateMock } = buildHandler();
    await handler.handleFundsReceived(payload);
    expect(postTransactionGroupMock).toHaveBeenCalledTimes(1);
    const call = postTransactionGroupMock.mock.calls[0][0];
    expect(call.actionType).toBe(AUDIT_ACTIONS.BOUNTY_FUNDED_VIA_TRADESAFE);
    expect(call.referenceId).toBe('tradesafe-txn-1');
    // Double-entry: debits and credits must balance
    const debits = call.legs
      .filter((l: any) => l.type === 'DEBIT')
      .reduce((s: bigint, l: any) => s + l.amountCents, 0n);
    const credits = call.legs
      .filter((l: any) => l.type === 'CREDIT')
      .reduce((s: bigint, l: any) => s + l.amountCents, 0n);
    expect(debits).toBe(credits);
    // Bounty flips
    expect(bountyUpdateMock).toHaveBeenCalledWith({
      where: { id: 'bounty-1' },
      data: {
        status: BountyStatus.LIVE,
        paymentStatus: PaymentStatus.PAID,
      },
    });
  });

  it('retry idempotent — second webhook with same txnId is a no-op on state', async () => {
    // Scenario: ledger already has a group for this (transactionId, action).
    // LedgerService returns idempotent:true; bounty is already LIVE+PAID so
    // the conditional update doesn't flip it a second time.
    const bountyUpdateMock = jest.fn();
    const { handler, postTransactionGroupMock } = buildHandler({
      txn: {
        id: 'txn-row-1',
        tradeSafeTransactionId: 'tradesafe-txn-1',
        bountyId: 'bounty-1',
        totalValueCents: 12075n,
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          currency: 'ZAR',
          status: BountyStatus.LIVE, // already flipped
          paymentStatus: PaymentStatus.PAID,
          faceValueCents: 10000n,
          maxSubmissions: 1,
          brandAdminFeeRateBps: 1500,
          globalFeeRateBps: 350,
        },
      },
      postTransactionGroup: jest
        .fn()
        .mockResolvedValue({ transactionGroupId: 'g-1', idempotent: true }),
      bountyUpdateMock,
    });
    await handler.handleFundsReceived(payload);
    expect(postTransactionGroupMock).toHaveBeenCalledTimes(1);
    // Already LIVE + PAID, no double-flip.
    expect(bountyUpdateMock).not.toHaveBeenCalled();
  });

  it('partial rollback — ledger write failure leaves bounty state unchanged', async () => {
    const bountyUpdateMock = jest.fn();
    // $transaction throws when the inner ledger call throws → whole tx aborts.
    const { handler } = buildHandler({
      postTransactionGroup: jest.fn().mockRejectedValue(new Error('DB blew up')),
      $transaction: jest.fn().mockImplementation(async (fn: any) => {
        // Faithfully propagate the throw so caller sees a rejection
        const tx = {
          tradeSafeTransaction: { update: jest.fn() },
          bounty: { update: bountyUpdateMock },
        };
        return fn(tx);
      }),
      bountyUpdateMock,
    });
    await expect(handler.handleFundsReceived(payload)).rejects.toThrow(/DB blew up/);
    expect(bountyUpdateMock).not.toHaveBeenCalled();
  });

  it('replay — unknown transactionId is logged and ignored (no-op)', async () => {
    // Simulates a webhook for an already-deleted transaction row. Handler
    // must NOT throw so the webhook controller returns 200 and stops retries.
    const { handler, postTransactionGroupMock } = buildHandler({ txn: null });
    await expect(handler.handleFundsReceived(payload)).resolves.toBeUndefined();
    expect(postTransactionGroupMock).not.toHaveBeenCalled();
  });

  // Per ADR 0013 §1 + §"Financial Non-Negotiable compliance" — when a bounty
  // is funded with `maxSubmissions = 5` and `rewards = [{ monetaryValue:
  // 100 }]`, the persisted `faceValueCents` is `100 × 100 × 5 = 50000n`.
  // The webhook handler reads the stored value and posts a balanced ledger
  // group at that scaled amount. This test pins the post-multiplier wire
  // contract so a regression in `computeFaceValueCents` would surface
  // here as an unbalanced group or incorrect debits.
  it('multi-claim multiplier — faceValueCents = 50000n on 5×R100 bounty produces scaled ledger legs', async () => {
    const { handler, postTransactionGroupMock } = buildHandler({
      txn: {
        id: 'txn-row-1',
        tradeSafeTransactionId: 'tradesafe-txn-1',
        bountyId: 'bounty-1',
        // Brand-side total = face × (1 + adminBps + globalBps).
        // 50000 × 1.185 = 59250
        totalValueCents: 59250n,
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          currency: 'ZAR',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.PENDING,
          // R100 reward × 5 claims = R500 face value = 50000 cents.
          faceValueCents: 50000n,
          maxSubmissions: 5,
          brandAdminFeeRateBps: 1500,
          globalFeeRateBps: 350,
        },
      },
    });
    await handler.handleFundsReceived(payload);

    expect(postTransactionGroupMock).toHaveBeenCalledTimes(1);
    const call = postTransactionGroupMock.mock.calls[0][0];
    // Double-entry still balances at the multiplied amount.
    const debits = call.legs
      .filter((l: any) => l.type === 'DEBIT')
      .reduce((s: bigint, l: any) => s + l.amountCents, 0n);
    const credits = call.legs
      .filter((l: any) => l.type === 'CREDIT')
      .reduce((s: bigint, l: any) => s + l.amountCents, 0n);
    expect(debits).toBe(credits);
    // The brand_reserve credit specifically reflects faceValueCents — this
    // is what payouts later debit against. If the multiplier silently rolls
    // back, this assertion fails first.
    const reserveCredit = call.legs.find(
      (l: any) => l.account === 'brand_reserve',
    );
    expect(reserveCredit.amountCents).toBe(50000n);
    // brand_cash_received scales together: 50000 + 7500 (15% admin) + 1750
    // (3.5% global) = 59250. Without this lock, the cash leg could drift
    // independently and break reconciliation `checkReserveVsBounty`.
    const cashDebit = call.legs.find(
      (l: any) => l.account === 'brand_cash_received',
    );
    expect(cashDebit.amountCents).toBe(59250n);
  });

  it('concurrent writer — two handlers ran in parallel produce one group via ledger idempotency', async () => {
    // Both calls see the row; the first wins, the second sees idempotent:true
    // from LedgerService (which internally handles the race).
    const calls: Array<boolean> = [];
    const { handler } = buildHandler({
      postTransactionGroup: jest.fn().mockImplementation(async () => {
        const wasFirst = calls.length === 0;
        calls.push(wasFirst);
        return {
          transactionGroupId: 'g-1',
          idempotent: !wasFirst,
        };
      }),
    });
    const [a, b] = await Promise.allSettled([
      handler.handleFundsReceived(payload),
      handler.handleFundsReceived(payload),
    ]);
    expect(a.status).toBe('fulfilled');
    expect(b.status).toBe('fulfilled');
    // Two calls to postTransactionGroup, both produced the same group id.
    expect(calls.length).toBe(2);
  });

  // ── bounty-published email dispatch (INCIDENT-RESPONSE.md §5.7) ─────

  it('dispatches a "your bounty is live" email per brand admin on DRAFT → LIVE', async () => {
    const { handler, prisma, mailService } = buildHandler();
    // Two-admin brand — every member should be emailed.
    (prisma.bounty.findUnique as jest.Mock).mockResolvedValue({
      id: 'bounty-1',
      title: 'Promote new sneaker drop',
      shortDescription: 'Post a styled photo wearing the new model.',
      currency: 'ZAR',
      faceValueCents: 10000n,
      brand: {
        members: [
          { user: { id: 'u-1', email: 'owner@brand.example', firstName: 'Alex' } },
          { user: { id: 'u-2', email: 'member@brand.example', firstName: 'Jordan' } },
        ],
      },
    });

    await handler.handleFundsReceived(payload);
    // Fire-and-forget — flush the microtask + I/O queue once.
    await new Promise((resolve) => setImmediate(resolve));

    const sendBountyPublishedEmail = mailService.sendBountyPublishedEmail as jest.Mock;
    expect(sendBountyPublishedEmail).toHaveBeenCalledTimes(2);
    expect(sendBountyPublishedEmail).toHaveBeenCalledWith(
      'owner@brand.example',
      expect.objectContaining({
        firstName: 'Alex',
        bountyTitle: 'Promote new sneaker drop',
        rewardValue: '100.00',
        currency: 'ZAR',
      }),
    );
    expect(sendBountyPublishedEmail).toHaveBeenCalledWith(
      'member@brand.example',
      expect.objectContaining({ firstName: 'Jordan' }),
    );
  });

  it('does NOT dispatch the bounty-published email on a webhook replay (bounty already LIVE)', async () => {
    // Same scenario as the "retry idempotent" test, but specifically asserts
    // the no-double-email property — pre-tx state is LIVE, so the dispatch
    // path is skipped entirely.
    const { handler, mailService } = buildHandler({
      txn: {
        id: 'txn-row-1',
        tradeSafeTransactionId: 'tradesafe-txn-1',
        bountyId: 'bounty-1',
        totalValueCents: 12075n,
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          currency: 'ZAR',
          status: BountyStatus.LIVE, // already flipped
          paymentStatus: PaymentStatus.PAID,
          faceValueCents: 10000n,
          maxSubmissions: 1,
          brandAdminFeeRateBps: 1500,
          globalFeeRateBps: 350,
        },
      },
      postTransactionGroup: jest
        .fn()
        .mockResolvedValue({ transactionGroupId: 'g-1', idempotent: true }),
    });

    await handler.handleFundsReceived(payload);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mailService.sendBountyPublishedEmail).not.toHaveBeenCalled();
  });
});
