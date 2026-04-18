/**
 * TradeSafeWebhookHandler.onPayoutFailed — 5-test matrix per CLAUDE.md §5.
 *
 * Mirrors `PayoutsService.onPayoutFailed` exactly — same legs
 * (payout_in_transit → hunter_available), same retry policy (2^N hour
 * backoff, RETRY_PENDING at attempts ≥ 3). Discriminator differs only
 * in `actionType = tradesafe_payout_failed`.
 *
 * Note: this is NOT an ADR 0006 compensating-entry bypass — it's a
 * forward event (provider says "payout failed in ordinary operation").
 * The kill-switch check in LedgerService therefore still applies; this
 * handler never passes `allowDuringKillSwitch: true`.
 *
 * R34 (ADR 0009 §6).
 */
import { ConfigService } from '@nestjs/config';
import { LedgerAccount, LedgerEntryType, StitchPayoutStatus } from '@prisma/client';
import { LEDGER_ACTION_TYPES, UserRole } from '@social-bounty/shared';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

describe('TradeSafeWebhookHandler.onPayoutFailed', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let postMock: jest.Mock;
  let handler: TradeSafeWebhookHandler;

  const basePayout = {
    id: 'payout-internal-1',
    userId: 'hunter-1',
    beneficiaryId: 'bene-1',
    stitchPayoutId: 'ts-payout-B',
    merchantReference: 'payoutHunter120260418',
    amountCents: 25_000n,
    currency: 'ZAR',
    speed: 'DEFAULT',
    status: StitchPayoutStatus.INITIATED,
    attempts: 0,
    lastAttemptAt: null as Date | null,
    lastError: null as string | null,
    nextRetryAt: null as Date | null,
    idempotencyKey: 'idem-B',
  };

  beforeEach(() => {
    const payout = { ...basePayout };
    prisma = {
      stitchPayout: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          if (args.where?.stitchPayoutId === payout.stitchPayoutId) {
            return { ...payout };
          }
          return null;
        }),
        update: jest.fn().mockImplementation(async ({ where, data }: any) => {
          if (where.id !== payout.id) return {};
          Object.assign(payout, data);
          return { ...payout };
        }),
      },
      _payout: payout,
    };

    postMock = jest
      .fn()
      .mockResolvedValue({ transactionGroupId: 'grp-fail-1', idempotent: false });
    ledger = { postTransactionGroup: postMock };

    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'STITCH_SYSTEM_ACTOR_ID' ? 'system-actor-id' : fallback,
      ),
    } as unknown as ConfigService;

    handler = new TradeSafeWebhookHandler(
      prisma as PrismaService,
      ledger as LedgerService,
      config,
    );
  });

  // --- 1. Happy path ---
  it('posts payout_in_transit → hunter_available with action=tradesafe_payout_failed and bumps attempts/backoff', async () => {
    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B', failureReason: 'bank rejected' },
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [input] = postMock.mock.calls[0];
    expect(input.actionType).toBe(LEDGER_ACTION_TYPES.TRADESAFE_PAYOUT_FAILED);
    expect(input.actionType).toBe('tradesafe_payout_failed');
    expect(input.referenceId).toBe('ts-payout-B');
    expect(input.audit.actorRole).toBe(UserRole.SUPER_ADMIN);
    expect(input.audit.reason).toBe('bank rejected');
    // Kill-switch bypass MUST NOT be requested — this is a forward event.
    expect(input.allowDuringKillSwitch).toBeUndefined();

    // Balanced two-leg ledger group (amount returns to hunter_available).
    expect(input.legs).toHaveLength(2);
    const [debit, credit] = input.legs;
    expect(debit.account).toBe(LedgerAccount.payout_in_transit);
    expect(debit.type).toBe(LedgerEntryType.DEBIT);
    expect(debit.amountCents).toBe(25_000n);
    expect(debit.userId).toBe('hunter-1');
    expect(credit.account).toBe(LedgerAccount.hunter_available);
    expect(credit.type).toBe(LedgerEntryType.CREDIT);
    expect(credit.amountCents).toBe(25_000n);
    expect(credit.userId).toBe('hunter-1');

    // Row state: attempts 0 → 1, FAILED status (< 3), nextRetryAt in ~2h,
    // lastError captured.
    expect(prisma._payout.attempts).toBe(1);
    expect(prisma._payout.status).toBe(StitchPayoutStatus.FAILED);
    expect(prisma._payout.lastError).toBe('bank rejected');
    expect(prisma._payout.nextRetryAt).toBeInstanceOf(Date);
    const delta =
      (prisma._payout.nextRetryAt as Date).getTime() - Date.now();
    // 2^1 * 60min * 60s * 1000ms = 2h; ±5s tolerance for test drift.
    expect(Math.abs(delta - 2 * 60 * 60 * 1000)).toBeLessThan(5000);
  });

  // --- 1b. Terminal transition at attempts >= 3 ---
  it('flips to RETRY_PENDING with null nextRetryAt at the 3rd failure', async () => {
    // Pre-state: attempts=2, so incrementing hits 3.
    prisma._payout.attempts = 2;

    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B', failureReason: 'bank down' },
    });

    expect(prisma._payout.attempts).toBe(3);
    expect(prisma._payout.status).toBe(StitchPayoutStatus.RETRY_PENDING);
    expect(prisma._payout.nextRetryAt).toBeNull();
  });

  // --- 2. Retry idempotent ---
  it('does not double-post when the ledger returns idempotent=true', async () => {
    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-existing',
      idempotent: true,
    });

    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B', failureReason: 'replay case' },
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    // Row update still runs (status/attempts already correct from first
    // delivery; the mock-mutated state reflects a fresh scenario here).
    expect(prisma.stitchPayout.update).toHaveBeenCalled();
  });

  // --- 3. Partial rollback ---
  it('does not flip the row state when the ledger post throws', async () => {
    postMock.mockRejectedValueOnce(new Error('ledger imbalance'));

    await expect(
      handler.onPayoutFailed({
        type: 'tradesafe.payout.failed',
        data: { id: 'ts-payout-B', failureReason: 'will throw' },
      }),
    ).rejects.toThrow(/ledger imbalance/);

    // Row untouched — attempts still 0, lastError still null.
    expect(prisma._payout.attempts).toBe(0);
    expect(prisma._payout.status).toBe(StitchPayoutStatus.INITIATED);
    expect(prisma._payout.lastError).toBeNull();
    expect(prisma.stitchPayout.update).not.toHaveBeenCalled();
  });

  // --- 4. Webhook replay ---
  it('is safe under handler-level replay: same (actionType, referenceId) on each delivery', async () => {
    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B', failureReason: 'first' },
    });

    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-fail-1',
      idempotent: true,
    });
    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B', failureReason: 'replay' },
    });

    const firstInput = postMock.mock.calls[0][0];
    const secondInput = postMock.mock.calls[1][0];
    expect(firstInput.actionType).toBe(secondInput.actionType);
    expect(firstInput.referenceId).toBe(secondInput.referenceId);
  });

  // --- 5. Concurrent writer ---
  it('handles a concurrent writer winning the ledger race', async () => {
    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-winner',
      idempotent: true,
    });

    await expect(
      handler.onPayoutFailed({
        type: 'tradesafe.payout.failed',
        data: { id: 'ts-payout-B', failureReason: 'lost-race' },
      }),
    ).resolves.toBeUndefined();

    // Row update still runs — idempotent in the business sense.
    expect(prisma.stitchPayout.update).toHaveBeenCalled();
  });

  // --- Guard: unknown reason defaults to 'unknown' ---
  it("defaults reason to 'unknown' when the payload omits failureReason", async () => {
    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-B' },
    });

    const [input] = postMock.mock.calls[0];
    expect(input.audit.reason).toBe('unknown');
    expect(prisma._payout.lastError).toBe('unknown');
  });

  // --- Guard: missing payout id → log-and-return ---
  it('logs and returns when the payload has no id', async () => {
    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: {},
    });
    expect(postMock).not.toHaveBeenCalled();
    expect(prisma.stitchPayout.findUnique).not.toHaveBeenCalled();
  });

  // --- Guard: unknown tradesafePayoutId → log-and-return ---
  it('logs and returns when the tradesafePayoutId is not known locally', async () => {
    prisma.stitchPayout.findUnique.mockResolvedValue(null);

    await handler.onPayoutFailed({
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-missing' },
    });

    expect(postMock).not.toHaveBeenCalled();
    expect(prisma.stitchPayout.update).not.toHaveBeenCalled();
  });
});
