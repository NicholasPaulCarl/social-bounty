import { LedgerAccount, LedgerEntryType, Prisma } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  KillSwitchActiveError,
  LedgerImbalanceError,
  LedgerService,
  PostTransactionGroupInput,
} from './ledger.service';

type TxMock = {
  ledgerTransactionGroup: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  auditLog: { create: jest.Mock };
  ledgerEntry: { createMany: jest.Mock };
  systemSetting: { findUnique: jest.Mock };
};

function buildTxMock(): TxMock {
  return {
    ledgerTransactionGroup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) },
    ledgerEntry: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
  };
}

function baseInput(overrides: Partial<PostTransactionGroupInput> = {}): PostTransactionGroupInput {
  return {
    actionType: 'stitch_payment_settled',
    referenceId: 'pay_abc',
    referenceType: 'StitchPaymentLink',
    description: 'Brand funding settlement',
    postedBy: 'system',
    legs: [
      {
        account: LedgerAccount.gateway_clearing,
        type: LedgerEntryType.DEBIT,
        amountCents: 100n,
        brandId: 'brand_1',
      },
      {
        account: LedgerAccount.brand_reserve,
        type: LedgerEntryType.CREDIT,
        amountCents: 100n,
        brandId: 'brand_1',
        bountyId: 'bounty_1',
      },
    ],
    audit: {
      actorId: 'sys',
      actorRole: UserRole.SUPER_ADMIN,
      action: 'LEDGER_POST',
      entityType: 'Bounty',
      entityId: 'bounty_1',
    },
    ...overrides,
  };
}

describe('LedgerService.postTransactionGroup', () => {
  let tx: TxMock;
  let prisma: any;
  let service: LedgerService;

  beforeEach(() => {
    tx = buildTxMock();
    prisma = {
      $transaction: jest.fn(async (fn: (client: TxMock) => Promise<unknown>) => fn(tx)),
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    service = new LedgerService(prisma as PrismaService);
  });

  it('writes group + audit + entries atomically on happy path', async () => {
    tx.ledgerTransactionGroup.create.mockResolvedValue({ id: 'grp_1' });

    const out = await service.postTransactionGroup(baseInput());

    expect(out).toEqual({ transactionGroupId: 'grp_1', idempotent: false });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.ledgerTransactionGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'grp_1' }, data: { auditLogId: 'audit_1' } }),
    );
    expect(tx.ledgerEntry.createMany).toHaveBeenCalledTimes(1);
    const payload = tx.ledgerEntry.createMany.mock.calls[0][0];
    expect(payload.data).toHaveLength(2);
  });

  it('rejects an imbalanced group before hitting the DB', async () => {
    const input = baseInput({
      legs: [
        {
          account: LedgerAccount.gateway_clearing,
          type: LedgerEntryType.DEBIT,
          amountCents: 100n,
        },
        {
          account: LedgerAccount.brand_reserve,
          type: LedgerEntryType.CREDIT,
          amountCents: 99n,
        },
      ],
    });
    await expect(service.postTransactionGroup(input)).rejects.toBeInstanceOf(LedgerImbalanceError);
    expect(tx.ledgerTransactionGroup.create).not.toHaveBeenCalled();
  });

  it('rejects zero or negative leg amounts', async () => {
    const input = baseInput({
      legs: [
        {
          account: LedgerAccount.gateway_clearing,
          type: LedgerEntryType.DEBIT,
          amountCents: 0n,
        },
      ],
    });
    await expect(service.postTransactionGroup(input)).rejects.toThrow(/must be positive/);
  });

  it('returns existing group id on (referenceId, actionType) conflict (idempotent)', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });
    tx.ledgerTransactionGroup.create.mockRejectedValueOnce(p2002);
    tx.ledgerTransactionGroup.findUnique.mockResolvedValueOnce({ id: 'grp_existing' });

    const out = await service.postTransactionGroup(baseInput());

    expect(out).toEqual({ transactionGroupId: 'grp_existing', idempotent: true });
    expect(tx.auditLog.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.createMany).not.toHaveBeenCalled();
  });

  it('blocks non-compensating writes when Kill Switch is active', async () => {
    (prisma.systemSetting as any).findUnique.mockResolvedValueOnce({ value: 'true' });

    await expect(service.postTransactionGroup(baseInput())).rejects.toBeInstanceOf(
      KillSwitchActiveError,
    );
    expect(tx.ledgerTransactionGroup.create).not.toHaveBeenCalled();
  });

  it('allows compensating writes through Kill Switch when explicitly flagged', async () => {
    (prisma.systemSetting as any).findUnique.mockResolvedValueOnce({ value: 'true' });
    tx.ledgerTransactionGroup.create.mockResolvedValue({ id: 'grp_comp' });

    const out = await service.postTransactionGroup(
      baseInput({ allowDuringKillSwitch: true, actionType: 'compensating_entry' }),
    );
    expect(out.transactionGroupId).toBe('grp_comp');
  });

  it('rolls back the whole group if audit-log insert throws', async () => {
    // Use the inner-tx path explicitly to simulate a failed step mid-tx.
    tx.ledgerTransactionGroup.create.mockResolvedValue({ id: 'grp_fail' });
    tx.auditLog.create.mockRejectedValueOnce(new Error('audit boom'));

    await expect(
      service.postTransactionGroup(baseInput(), tx as any),
    ).rejects.toThrow('audit boom');
    expect(tx.ledgerEntry.createMany).not.toHaveBeenCalled();
  });
});
