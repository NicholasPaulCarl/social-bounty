import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WalletService } from '../wallet.service';
import { WithdrawalService } from '../withdrawal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  WalletTxType,
  WithdrawalStatus,
  PayoutMethod,
  Currency,
} from '@social-bounty/shared';

// ── Decimal mock ────────────────────────────────────────
// jest.mock is hoisted, so we define the class inside the factory
// and retrieve it via the mocked Prisma import

jest.mock('@prisma/client', () => {
  class FakeDecimal {
    public _value: number;
    constructor(val: any) {
      if (val && typeof val === 'object' && '_value' in val) {
        this._value = val._value;
      } else {
        this._value = Number(val);
      }
    }
    add(other: any) {
      const otherVal = other instanceof FakeDecimal ? other._value : (other && other._value != null ? other._value : Number(other));
      return new FakeDecimal(this._value + otherVal);
    }
    sub(other: any) {
      const otherVal = other instanceof FakeDecimal ? other._value : (other && other._value != null ? other._value : Number(other));
      return new FakeDecimal(this._value - otherVal);
    }
    abs() {
      return new FakeDecimal(Math.abs(this._value));
    }
    lessThan(other: any) {
      const otherVal = other instanceof FakeDecimal ? other._value : (other && other._value != null ? other._value : Number(other));
      return this._value < otherVal;
    }
    toString() {
      return String(this._value);
    }
    toNumber() {
      return this._value;
    }
  }
  return {
    PrismaClient: class {},
    Prisma: {
      Decimal: FakeDecimal,
    },
  };
});

// Get the mocked Decimal class so we can use it in test fixtures
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Prisma } = require('@prisma/client');
const FakeDecimal = Prisma.Decimal;

function D(val: number) {
  return new FakeDecimal(val);
}

describe('WalletService', () => {
  let walletService: WalletService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: D(1000),
    pendingBalance: D(0),
    currency: Currency.ZAR,
    totalEarned: D(1000),
    totalWithdrawn: D(0),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const makePrismaMock = () => ({
    wallet: {
      upsert: jest.fn().mockResolvedValue(mockWallet),
      update: jest.fn().mockResolvedValue(mockWallet),
      findUnique: jest.fn().mockResolvedValue(mockWallet),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    walletTransaction: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({
        id: 'tx-1',
        walletId: data.walletId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        createdAt: new Date(),
      })),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    withdrawal: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Test',
      }),
    },
    $transaction: jest.fn().mockImplementation((fn: any) => {
      if (typeof fn === 'function') {
        return fn(prisma);
      }
      return Promise.resolve(fn);
    }),
  });

  beforeEach(async () => {
    prisma = makePrismaMock();
    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    walletService = module.get<WalletService>(WalletService);
  });

  // ── Credit ──────────────────────────────────────────────

  it('should credit wallet and increase balance + totalEarned', async () => {
    const tx = await walletService.creditWallet(
      'user-1',
      200,
      'Bounty payout',
      'SUBMISSION',
      'sub-1',
    );

    expect(tx).toBeDefined();
    expect(tx.type).toBe(WalletTxType.CREDIT);

    // wallet.update should increment balance and totalEarned
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          balance: expect.objectContaining({ increment: expect.anything() }),
          totalEarned: expect.objectContaining({ increment: expect.anything() }),
        }),
      }),
    );
  });

  // ── Hold Funds ──────────────────────────────────────────

  it('should hold funds and move balance to pendingBalance', async () => {
    const tx = await walletService.holdFunds('user-1', 500, 'wd-1');

    expect(tx).toBeDefined();
    expect(tx.type).toBe(WalletTxType.HOLD);
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          balance: expect.objectContaining({ decrement: expect.anything() }),
          pendingBalance: expect.objectContaining({ increment: expect.anything() }),
        }),
      }),
    );
  });

  it('should reject hold when insufficient balance', async () => {
    await expect(
      walletService.holdFunds('user-1', 2000, 'wd-1'),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Release Funds ───────────────────────────────────────

  it('should release funds back from pending to available', async () => {
    const tx = await walletService.releaseFunds('user-1', 300, 'wd-1');

    expect(tx).toBeDefined();
    expect(tx.type).toBe(WalletTxType.RELEASE);
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          balance: expect.objectContaining({ increment: expect.anything() }),
          pendingBalance: expect.objectContaining({ decrement: expect.anything() }),
        }),
      }),
    );
  });

  // ── Complete Withdrawal ─────────────────────────────────

  it('should complete withdrawal reducing pendingBalance', async () => {
    const tx = await walletService.completeWithdrawal('user-1', 500, 'wd-1');

    expect(tx).toBeDefined();
    expect(tx.type).toBe(WalletTxType.DEBIT);
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pendingBalance: expect.objectContaining({ decrement: expect.anything() }),
          totalWithdrawn: expect.objectContaining({ increment: expect.anything() }),
        }),
      }),
    );
  });

  // ── Get Balance ─────────────────────────────────────────

  it('should return formatted balance strings', async () => {
    const balance = await walletService.getBalance('user-1');

    expect(balance).toEqual({
      available: '1000',
      pending: '0',
      total: '1000',
      totalEarned: '1000',
      totalWithdrawn: '0',
      currency: Currency.ZAR,
    });
  });

  // ── Admin Adjust ────────────────────────────────────────

  it('should admin-adjust wallet positively', async () => {
    await walletService.adminAdjust('admin-1', 'user-1', 100, 'Goodwill credit');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'wallet.adjust',
        entityId: 'user-1',
      }),
    );
  });

  it('should reject admin adjust that causes negative balance', async () => {
    await expect(
      walletService.adminAdjust('admin-1', 'user-1', -5000, 'Oops'),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Admin Get Wallet ────────────────────────────────────

  it('should throw NotFoundException for missing wallet', async () => {
    prisma.wallet.findUnique.mockResolvedValueOnce(null);

    await expect(walletService.adminGetWallet('user-999')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('WithdrawalService', () => {
  let withdrawalService: WithdrawalService;
  let walletService: any;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: { sendPayoutNotificationEmail: jest.Mock };

  const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: D(5000),
    pendingBalance: D(0),
    currency: Currency.ZAR,
    totalEarned: D(5000),
    totalWithdrawn: D(0),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockWithdrawal = {
    id: 'wd-1',
    walletId: 'wallet-1',
    userId: 'user-1',
    amount: D(500),
    currency: Currency.ZAR,
    method: PayoutMethod.BANK_TRANSFER,
    status: WithdrawalStatus.REQUESTED,
    destination: { bank: 'FNB', account: '12345' },
    processedAt: null,
    failureReason: null,
    proofUrl: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    walletService = {
      getOrCreateWallet: jest.fn().mockResolvedValue(mockWallet),
      holdFunds: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      releaseFunds: jest.fn().mockResolvedValue({ id: 'tx-2' }),
      completeWithdrawal: jest.fn().mockResolvedValue({ id: 'tx-3' }),
    };

    prisma = {
      withdrawal: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(mockWithdrawal),
        update: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ ...mockWithdrawal, ...data }),
        ),
        findUnique: jest.fn().mockResolvedValue(mockWithdrawal),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@test.com',
          firstName: 'Test',
        }),
      },
      $transaction: jest.fn().mockImplementation((fn: any) => {
        if (typeof fn === 'function') {
          return fn(prisma);
        }
        return Promise.resolve(fn);
      }),
    };

    auditService = { log: jest.fn() };
    mailService = { sendPayoutNotificationEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    withdrawalService = module.get<WithdrawalService>(WithdrawalService);
  });

  // ── Request Withdrawal ──────────────────────────────────

  it('should create withdrawal and hold funds', async () => {
    const result = await withdrawalService.requestWithdrawal('user-1', {
      amount: 500,
      method: PayoutMethod.BANK_TRANSFER,
      destination: { bank: 'FNB', account: '12345' },
    });

    expect(result).toBeDefined();
    expect(result.status).toBe(WithdrawalStatus.REQUESTED);
    expect(walletService.holdFunds).toHaveBeenCalledWith('user-1', 500, 'wd-1');
  });

  it('should reject when max pending withdrawals exceeded', async () => {
    prisma.withdrawal.count.mockResolvedValueOnce(3);

    await expect(
      withdrawalService.requestWithdrawal('user-1', {
        amount: 100,
        method: PayoutMethod.BANK_TRANSFER,
        destination: { bank: 'FNB', account: '12345' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject when insufficient balance', async () => {
    walletService.getOrCreateWallet.mockResolvedValueOnce({
      ...mockWallet,
      balance: D(10),
    });

    await expect(
      withdrawalService.requestWithdrawal('user-1', {
        amount: 500,
        method: PayoutMethod.BANK_TRANSFER,
        destination: { bank: 'FNB', account: '12345' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Complete Withdrawal ─────────────────────────────────

  it('should complete a processing withdrawal', async () => {
    prisma.withdrawal.findUnique.mockResolvedValueOnce({
      ...mockWithdrawal,
      status: WithdrawalStatus.PROCESSING,
    });

    const result = await withdrawalService.completeWithdrawal(
      'wd-1',
      'admin-1',
      'https://proof.com/receipt',
    );

    expect(result.status).toBe(WithdrawalStatus.COMPLETED);
    expect(walletService.completeWithdrawal).toHaveBeenCalledWith('user-1', 500, 'wd-1');
  });

  it('should reject completing a non-PROCESSING withdrawal', async () => {
    await expect(
      withdrawalService.completeWithdrawal('wd-1', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Fail Withdrawal ─────────────────────────────────────

  it('should fail a withdrawal and release funds', async () => {
    const result = await withdrawalService.failWithdrawal(
      'wd-1',
      'admin-1',
      'Invalid bank details',
    );

    expect(result.status).toBe(WithdrawalStatus.FAILED);
    expect(walletService.releaseFunds).toHaveBeenCalledWith('user-1', 500, 'wd-1');
  });

  // ── Cancel Withdrawal ───────────────────────────────────

  it('should cancel a requested withdrawal by the owning user', async () => {
    const result = await withdrawalService.cancelWithdrawal('wd-1', 'user-1');

    expect(result.status).toBe(WithdrawalStatus.CANCELLED);
    expect(walletService.releaseFunds).toHaveBeenCalledWith('user-1', 500, 'wd-1');
  });

  it('should reject cancellation by a different user', async () => {
    await expect(
      withdrawalService.cancelWithdrawal('wd-1', 'user-2'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject cancellation of non-REQUESTED withdrawal', async () => {
    prisma.withdrawal.findUnique.mockResolvedValueOnce({
      ...mockWithdrawal,
      status: WithdrawalStatus.PROCESSING,
    });

    await expect(
      withdrawalService.cancelWithdrawal('wd-1', 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
