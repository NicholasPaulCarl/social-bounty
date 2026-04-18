/**
 * TradeSafeWebhookHandler.onBeneficiaryLinked — 5-test matrix per
 * CLAUDE.md §5. Beneficiary linking is pre-financial (no ledger write),
 * so "partial rollback" exercises the AuditLog + row update rollback
 * via the surrounding `$transaction` instead.
 *
 * R34 (ADR 0009 §6). Event shape is speculative until TradeSafe
 * sandbox docs land; see TODO(R34) markers in the handler.
 */
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { TradeSafeWebhookHandler } from './tradesafe-webhook.handler';

describe('TradeSafeWebhookHandler.onBeneficiaryLinked', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let handler: TradeSafeWebhookHandler;
  let txMock: jest.Mock;

  // Shape sufficient for the handler's read + update paths. Prisma types
  // would pull in too much; the narrow shape matches what handler uses.
  const baseBene = {
    id: 'bene-local-1',
    userId: 'hunter-1',
    stitchBeneficiaryId: 'local:hunter-1',
    accountHolderName: 'Jane Doe',
    bankCode: '001',
    accountNumberEnc: 'enc:xxx',
    accountType: 'CURRENT',
    verifiedAt: null as Date | null,
    isActive: true,
    createdAt: new Date('2026-04-10T00:00:00Z'),
    updatedAt: new Date('2026-04-10T00:00:00Z'),
  };

  beforeEach(() => {
    // Mutable per-test copy so writes don't bleed across cases.
    const bene = { ...baseBene };

    // Tx client captures writes for rollback/retry assertions. The `runTx`
    // wrapper runs its callback with the same tx client so we spy on the
    // nested update + audit write.
    const txClient = {
      stitchBeneficiary: {
        update: jest.fn(async ({ where, data }: any) => {
          if (where.id !== bene.id) return {};
          if (data.verifiedAt !== undefined) bene.verifiedAt = data.verifiedAt;
          if (data.stitchBeneficiaryId !== undefined) {
            bene.stitchBeneficiaryId = data.stitchBeneficiaryId;
          }
          return { ...bene };
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    txMock = jest.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) =>
      cb(txClient),
    );

    prisma = {
      stitchBeneficiary: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          // Support both where-by-stitchBeneficiaryId and where-by-userId.
          if (
            args.where?.stitchBeneficiaryId &&
            args.where.stitchBeneficiaryId !== bene.stitchBeneficiaryId
          ) {
            return null;
          }
          if (args.where?.userId && args.where.userId !== bene.userId) {
            return null;
          }
          return { ...bene };
        }),
      },
      $transaction: txMock,
      _bene: bene,
      _txClient: txClient,
    };

    ledger = {};

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
  it('flips verifiedAt + writes AuditLog + updates externalBeneficiaryId when TradeSafe returns a real id', async () => {
    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: {
        id: 'ts-bene-real-123',
        externalReference: 'hunter-1',
        status: 'VERIFIED',
      },
    });

    // Found by externalReference fallback because stitchBeneficiaryId lookup
    // fails (current row has `local:hunter-1` while payload has the real one).
    expect(prisma.stitchBeneficiary.findUnique).toHaveBeenCalledWith({
      where: { stitchBeneficiaryId: 'ts-bene-real-123' },
    });
    expect(prisma.stitchBeneficiary.findUnique).toHaveBeenCalledWith({
      where: { userId: 'hunter-1' },
    });

    // Transaction used so audit + update commit-or-rollback together.
    expect(txMock).toHaveBeenCalledTimes(1);

    // verifiedAt set + stitchBeneficiaryId upgraded from local:...
    const updateCall = prisma._txClient.stitchBeneficiary.update.mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'bene-local-1' });
    expect(updateCall.data.verifiedAt).toBeInstanceOf(Date);
    expect(updateCall.data.stitchBeneficiaryId).toBe('ts-bene-real-123');

    // Audit log written with right actor + entity.
    const auditCall = prisma._txClient.auditLog.create.mock.calls[0][0];
    expect(auditCall.data.action).toBe('BENEFICIARY_LINKED');
    expect(auditCall.data.entityType).toBe('StitchBeneficiary');
    expect(auditCall.data.entityId).toBe('bene-local-1');
    expect(auditCall.data.actorId).toBe('system-actor-id');
    expect(auditCall.data.afterState.tradesafeBeneficiaryId).toBe(
      'ts-bene-real-123',
    );
  });

  // --- 2. Retry idempotent ---
  it('no-ops if the beneficiary is already verifiedAt-set (webhook replay / re-delivery)', async () => {
    // Simulate a second delivery of the same event after the first one
    // already flipped verifiedAt. The fast-path row-state check must stop
    // us before any $transaction opens.
    prisma._bene.verifiedAt = new Date('2026-04-15T10:00:00Z');

    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'local:hunter-1', externalReference: 'hunter-1' },
    });

    // Handler read the row but did NOT open a tx or write anything.
    expect(prisma.stitchBeneficiary.findUnique).toHaveBeenCalled();
    expect(txMock).not.toHaveBeenCalled();
    expect(prisma._txClient.stitchBeneficiary.update).not.toHaveBeenCalled();
    expect(prisma._txClient.auditLog.create).not.toHaveBeenCalled();
  });

  // --- 3. Partial rollback ---
  it('rolls back the stitchBeneficiary.update when the AuditLog write throws', async () => {
    // Simulate auditLog.create failing — Prisma's $transaction must roll
    // back the whole batch, so verifiedAt stays null on the row. This is
    // the equivalent of "partial rollback" for a pre-financial handler.
    prisma._txClient.auditLog.create.mockRejectedValueOnce(
      new Error('audit db down'),
    );

    // Emulate Prisma: if the callback throws, $transaction rethrows after
    // discarding the unit-of-work. Mock reflects: if the last op was the
    // update, but auditLog.create then threw, the overall tx promise
    // should reject. We already saw the .update call happen in-mock; in a
    // real Prisma $transaction, that write would be rolled back by the DB.
    // Here we assert: (a) the handler rethrows, (b) no second delivery
    // would re-enter the verified-fast-path because verifiedAt is still null.
    txMock.mockImplementationOnce(async (cb: any) => {
      try {
        await cb(prisma._txClient);
      } catch (err) {
        // Mimic DB rollback: undo the in-memory update.
        prisma._bene.verifiedAt = null;
        prisma._bene.stitchBeneficiaryId = 'local:hunter-1';
        throw err;
      }
      return undefined;
    });

    await expect(
      handler.onBeneficiaryLinked({
        type: 'tradesafe.beneficiary.linked',
        data: { id: 'ts-bene-real-456', externalReference: 'hunter-1' },
      }),
    ).rejects.toThrow(/audit db down/);

    // Ledger untouched (pre-financial — expected).
    // Row not verified: a subsequent retry delivery can still proceed.
    expect(prisma._bene.verifiedAt).toBeNull();
    expect(prisma._bene.stitchBeneficiaryId).toBe('local:hunter-1');
  });

  // --- 4. Webhook replay ---
  it('is safe to invoke twice with the same payload (idempotent across duplicate deliveries)', async () => {
    // First delivery: flips verifiedAt + writes audit.
    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'ts-bene-real-789', externalReference: 'hunter-1' },
    });
    expect(prisma._bene.verifiedAt).toBeInstanceOf(Date);
    expect(txMock).toHaveBeenCalledTimes(1);

    // Second delivery of the same Svix id: the webhook controller's
    // `UNIQUE(provider, externalEventId)` short-circuits BEFORE the router
    // dispatches. But handler-layer idempotency is defence-in-depth — if
    // the short-circuit is bypassed (e.g. replay via admin panel), the
    // handler's row-state check must still block the second write.
    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'ts-bene-real-789', externalReference: 'hunter-1' },
    });

    // Transaction count unchanged — second delivery was a no-op.
    expect(txMock).toHaveBeenCalledTimes(1);
  });

  // --- 5. Concurrent writer (race) ---
  it('handles a mid-flight race where another writer verifies the row between our read and our update', async () => {
    // Simulate: read sees verifiedAt=null; between the read and the
    // tx.update, a concurrent handler flips the row. The handler's
    // update still lands with overwrite-to-same-value semantics
    // (no unique constraint here — verifiedAt is just a timestamp),
    // and the audit log still fires. The second audit is documentation
    // noise but no ledger is touched so it's acceptable; if this
    // becomes an audit-log-bloat problem we can add an additional
    // fast-path re-check inside the tx.
    let raceWinnerVerifiedAt: Date | null = null;
    prisma.stitchBeneficiary.findUnique.mockImplementationOnce(async () => ({
      ...baseBene,
      verifiedAt: null, // we see null — race begins here
    }));

    // Race winner flips the row before our tx opens.
    raceWinnerVerifiedAt = new Date('2026-04-18T09:00:00Z');
    prisma._bene.verifiedAt = raceWinnerVerifiedAt;

    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'local:hunter-1', externalReference: 'hunter-1' },
    });

    // Our update ran (the write is idempotent at the data level — setting
    // verifiedAt to a fresh `now` is not semantically different from the
    // race winner's earlier timestamp for downstream consumers), and our
    // audit log did fire. The row's verifiedAt is now our timestamp, but
    // the business impact of "beneficiary is verified" is unchanged.
    expect(txMock).toHaveBeenCalledTimes(1);
    expect(prisma._txClient.stitchBeneficiary.update).toHaveBeenCalledTimes(1);
    expect(prisma._txClient.auditLog.create).toHaveBeenCalledTimes(1);
  });

  // --- Additional guard: missing beneficiary → log-and-return, no tx ---
  it('logs and returns when no beneficiary matches either id or externalReference', async () => {
    prisma.stitchBeneficiary.findUnique.mockResolvedValue(null);

    await handler.onBeneficiaryLinked({
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'ts-missing', externalReference: 'hunter-unknown' },
    });

    expect(txMock).not.toHaveBeenCalled();
  });
});
