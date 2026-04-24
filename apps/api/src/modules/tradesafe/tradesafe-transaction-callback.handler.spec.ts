import { ConfigService } from '@nestjs/config';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TradeSafeTransactionCallbackHandler } from './tradesafe-transaction-callback.handler';
import type { TransactionData } from './tradesafe-graphql.operations';

function makeConfig(
  overrides: Record<string, string | undefined> = {},
): ConfigService {
  const values: Record<string, string | undefined> = {
    SYSTEM_ACTOR_ID: '00000000-0000-0000-0000-000000000001',
    ...overrides,
  };
  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const v = values[key];
      return v === undefined ? defaultValue : v;
    }),
  } as unknown as ConfigService;
}

function makePrisma() {
  return {
    auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  } as unknown as PrismaService & { auditLog: { create: jest.Mock } };
}

function makeTransaction(
  overrides: Partial<NonNullable<TransactionData['transaction']>> = {},
): NonNullable<TransactionData['transaction']> {
  return {
    id: 'tx_abc',
    title: 'Bounty Funding',
    reference: 'BNT_123',
    state: 'FUNDS_RECEIVED',
    parties: [
      { id: 'party_1', role: 'BUYER' },
      { id: 'party_2', role: 'SELLER' },
    ],
    allocations: [
      {
        id: 'alloc_1',
        title: 'Primary bounty payout',
        value: 150.0,
        state: 'FUNDS_RECEIVED',
        deliverBy: null,
        inspectBy: null,
      },
    ],
    deposits: [],
    ...overrides,
  };
}

describe('TradeSafeTransactionCallbackHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('writes an AuditLog row capturing the current transaction state', async () => {
    const prisma = makePrisma();
    const config = makeConfig();
    const handler = new TradeSafeTransactionCallbackHandler(
      prisma as unknown as PrismaService,
      config,
    );

    await handler.handle(makeTransaction());

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    const arg = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
    expect(arg.data).toMatchObject({
      actorId: '00000000-0000-0000-0000-000000000001',
      actorRole: UserRole.SUPER_ADMIN,
      action: 'TRADESAFE_TRANSACTION_CALLBACK',
      entityType: 'TradeSafeTransaction',
      entityId: 'tx_abc',
    });
    expect(arg.data.afterState).toMatchObject({
      state: 'FUNDS_RECEIVED',
      reference: 'BNT_123',
      allocations: [
        expect.objectContaining({ id: 'alloc_1', state: 'FUNDS_RECEIVED', value: 150.0 }),
      ],
    });
  });

  it('no-ops cleanly when the transaction is null', async () => {
    const prisma = makePrisma();
    const handler = new TradeSafeTransactionCallbackHandler(
      prisma as unknown as PrismaService,
      makeConfig(),
    );

    await handler.handle(null);

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('skips the AuditLog write (but does not throw) when SYSTEM_ACTOR_ID is unset', async () => {
    const prisma = makePrisma();
    const config = makeConfig({ SYSTEM_ACTOR_ID: undefined });
    const handler = new TradeSafeTransactionCallbackHandler(
      prisma as unknown as PrismaService,
      config,
    );

    await expect(handler.handle(makeTransaction())).resolves.toBeUndefined();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('swallows AuditLog write failures so the callback path still completes', async () => {
    const prisma = makePrisma();
    (prisma.auditLog.create as jest.Mock).mockRejectedValue(
      new Error('audit store down'),
    );
    const handler = new TradeSafeTransactionCallbackHandler(
      prisma as unknown as PrismaService,
      makeConfig(),
    );

    await expect(handler.handle(makeTransaction())).resolves.toBeUndefined();
  });
});
