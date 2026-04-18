/**
 * TradeSafeWebhookHandler.onPayoutSettled — 5-test matrix per CLAUDE.md §5.
 *
 * This is a ledger-writer. Mirrors the shape of PayoutsService.onPayoutSettled
 * (Stitch) exactly; only the action-type discriminator differs. Tests lock:
 *  - Canonical legs (payout_in_transit → hunter_paid) at the correct
 *    account / type / amount / userId triple.
 *  - Idempotency via UNIQUE(referenceId=tradesafePayoutId, actionType).
 *  - Partial rollback on ledger-post failure (StitchPayout row NOT flipped
 *    to SETTLED until after a successful ledger commit).
 *  - Replay safety — re-delivery with same Svix id hits the `{ idempotent:
 *    true }` fast-path and writes no second group.
 *  - Concurrent writer — simulated P2002 surfaces as `idempotent: true`.
 *
 * R34 (ADR 0009 §6). Event + payout-id shape is speculative until
 * TradeSafe sandbox docs land.
 */
import { ConfigService } from '@nestjs/config';
import { LedgerAccount, LedgerEntryType, StitchPayoutStatus } from '@prisma/client';
import { LEDGER_ACTION_TYPES, UserRole } from '@social-bounty/shared';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

describe('TradeSafeWebhookHandler.onPayoutSettled', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let postMock: jest.Mock;
  let handler: TradeSafeWebhookHandler;

  const basePayout = {
    id: 'payout-internal-1',
    userId: 'hunter-1',
    beneficiaryId: 'bene-1',
    stitchPayoutId: 'ts-payout-A',
    merchantReference: 'payoutHunter120260418',
    amountCents: 50_000n,
    currency: 'ZAR',
    speed: 'DEFAULT',
    status: StitchPayoutStatus.INITIATED,
    attempts: 1,
    lastAttemptAt: new Date('2026-04-18T09:00:00Z'),
    lastError: null as string | null,
    nextRetryAt: null as Date | null,
    idempotencyKey: 'idem-A',
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
          if (data.status !== undefined) payout.status = data.status;
          return { ...payout };
        }),
      },
      _payout: payout,
    };

    postMock = jest
      .fn()
      .mockResolvedValue({ transactionGroupId: 'grp-1', idempotent: false });
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
  it('posts payout_in_transit → hunter_paid with action=tradesafe_payout_settled and flips row to SETTLED', async () => {
    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-A' },
    });

    // Ledger post shape.
    expect(postMock).toHaveBeenCalledTimes(1);
    const [input] = postMock.mock.calls[0];
    expect(input.actionType).toBe(LEDGER_ACTION_TYPES.TRADESAFE_PAYOUT_SETTLED);
    expect(input.actionType).toBe('tradesafe_payout_settled');
    expect(input.referenceId).toBe('ts-payout-A');
    expect(input.referenceType).toBe('StitchPayout');
    expect(input.postedBy).toBe('system-actor-id');
    expect(input.audit.actorRole).toBe(UserRole.SUPER_ADMIN);
    expect(input.audit.entityType).toBe('StitchPayout');
    expect(input.audit.entityId).toBe('payout-internal-1');

    // Two legs, balanced.
    expect(input.legs).toHaveLength(2);
    const [debit, credit] = input.legs;
    expect(debit.account).toBe(LedgerAccount.payout_in_transit);
    expect(debit.type).toBe(LedgerEntryType.DEBIT);
    expect(debit.amountCents).toBe(50_000n);
    expect(debit.userId).toBe('hunter-1');
    expect(credit.account).toBe(LedgerAccount.hunter_paid);
    expect(credit.type).toBe(LedgerEntryType.CREDIT);
    expect(credit.amountCents).toBe(50_000n);
    expect(credit.userId).toBe('hunter-1');

    // Row flipped to SETTLED AFTER ledger post succeeded.
    expect(prisma._payout.status).toBe(StitchPayoutStatus.SETTLED);
  });

  // --- 2. Retry idempotent (UNIQUE hits fast-path) ---
  it('does not double-post when the ledger returns idempotent=true', async () => {
    // Simulate LedgerService fast-path: the group already exists for
    // (tradesafe_payout_settled, ts-payout-A). No new entries are written;
    // the existing group id is returned.
    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-existing',
      idempotent: true,
    });

    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-A' },
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    // Row flip still runs — it's an idempotent write (SETTLED → SETTLED).
    expect(prisma.stitchPayout.update).toHaveBeenCalledWith({
      where: { id: 'payout-internal-1' },
      data: { status: StitchPayoutStatus.SETTLED },
    });
  });

  // --- 3. Partial rollback (ledger throws) ---
  it('does not flip the StitchPayout row to SETTLED if the ledger post throws', async () => {
    postMock.mockRejectedValueOnce(new Error('ledger imbalance'));

    await expect(
      handler.onPayoutSettled({
        type: 'tradesafe.payout.settled',
        data: { id: 'ts-payout-A' },
      }),
    ).rejects.toThrow(/ledger imbalance/);

    // Row still INITIATED — the ledger is the atomic boundary; SETTLED
    // only gets set after a successful post. Without this, a
    // provider-row-out-of-sync-with-ledger state is possible after
    // transient ledger failures.
    expect(prisma._payout.status).toBe(StitchPayoutStatus.INITIATED);
    expect(prisma.stitchPayout.update).not.toHaveBeenCalled();
  });

  // --- 4. Webhook replay ---
  it('is safe under handler-level replay: idempotency key is (tradesafePayoutId, actionType)', async () => {
    // First delivery.
    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-A' },
    });

    // Second delivery — LedgerService's fast-path pre-check (ADR 0005)
    // returns idempotent=true; handler must tolerate it without mutating
    // the row a second time in a way that loses information.
    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-1',
      idempotent: true,
    });
    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-A' },
    });

    expect(postMock).toHaveBeenCalledTimes(2);
    const firstCall = postMock.mock.calls[0][0];
    const secondCall = postMock.mock.calls[1][0];
    // Both calls carry the same (actionType, referenceId).
    expect(secondCall.actionType).toBe(firstCall.actionType);
    expect(secondCall.referenceId).toBe(firstCall.referenceId);
  });

  // --- 5. Concurrent writer ---
  it('handles a concurrent writer winning the race inside LedgerService', async () => {
    // Two dispatch calls for the same tradesafePayoutId race. One wins
    // and writes the group; the other hits the UNIQUE(referenceId,
    // actionType) constraint. LedgerService's outer catch re-reads and
    // surfaces `idempotent: true`, so the loser's handler path runs to
    // completion without writing a second ledger entry.
    //
    // This test simulates the loser's call directly (the winner's happy
    // path is covered by test 1). Handler must not treat `idempotent:
    // true` as an error.
    postMock.mockResolvedValueOnce({
      transactionGroupId: 'grp-winner-1',
      idempotent: true,
    });

    await expect(
      handler.onPayoutSettled({
        type: 'tradesafe.payout.settled',
        data: { id: 'ts-payout-A' },
      }),
    ).resolves.toBeUndefined();

    // The loser still flips the row — same effect as the winner.
    expect(prisma._payout.status).toBe(StitchPayoutStatus.SETTLED);
  });

  // --- Guard: unknown stitchPayoutId → log-and-return, no ledger post ---
  it('logs and returns when the tradesafePayoutId is not known locally', async () => {
    prisma.stitchPayout.findUnique.mockResolvedValue(null);

    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-missing' },
    });

    expect(postMock).not.toHaveBeenCalled();
    expect(prisma.stitchPayout.update).not.toHaveBeenCalled();
  });

  // --- Guard: missing payout id → log-and-return ---
  it('logs and returns when the payload is missing an id', async () => {
    await handler.onPayoutSettled({
      type: 'tradesafe.payout.settled',
      data: {},
    });

    expect(prisma.stitchPayout.findUnique).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });
});
