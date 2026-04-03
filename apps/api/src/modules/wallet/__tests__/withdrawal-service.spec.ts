import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { WithdrawalService } from '../withdrawal.service';
import { WalletService } from '../wallet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  WithdrawalStatus,
  PayoutMethod,
  Currency,
  WITHDRAWAL_LIMITS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  UserRole,
} from '@social-bounty/shared';

// ── Decimal mock ────────────────────────────────────────
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
      const otherVal =
        other instanceof FakeDecimal
          ? other._value
          : other && other._value != null
            ? other._value
            : Number(other);
      return new FakeDecimal(this._value + otherVal);
    }
    sub(other: any) {
      const otherVal =
        other instanceof FakeDecimal
          ? other._value
          : other && other._value != null
            ? other._value
            : Number(other);
      return new FakeDecimal(this._value - otherVal);
    }
    abs() {
      return new FakeDecimal(Math.abs(this._value));
    }
    lessThan(other: any) {
      const otherVal =
        other instanceof FakeDecimal
          ? other._value
          : other && other._value != null
            ? other._value
            : Number(other);
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Prisma } = require('@prisma/client');
const FakeDecimal = Prisma.Decimal;

function D(val: number) {
  return new FakeDecimal(val);
}

// ── Test Suite ─────────────────────────────────────────────

describe('WithdrawalService', () => {
  let service: WithdrawalService;
  let prisma: any;
  let walletService: any;
  let auditService: { log: jest.Mock };
  let mailService: { sendPayoutNotificationEmail: jest.Mock };

  const NOW = new Date('2026-03-15T10:00:00Z');

  const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: D(5000),
    pendingBalance: D(0),
    currency: Currency.ZAR,
    totalEarned: D(5000),
    totalWithdrawn: D(0),
    createdAt: NOW,
    updatedAt: NOW,
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
    createdAt: NOW,
    updatedAt: NOW,
  };

  const defaultDto = {
    amount: 500,
    method: PayoutMethod.BANK_TRANSFER,
    destination: { bank: 'FNB', account: '12345' },
  };

  const makePrismaMock = () => ({
    withdrawal: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(mockWithdrawal),
      update: jest
        .fn()
        .mockImplementation(({ data }: any) =>
          Promise.resolve({ ...mockWithdrawal, ...data }),
        ),
      findUnique: jest.fn().mockResolvedValue(mockWithdrawal),
      findMany: jest.fn().mockResolvedValue([mockWithdrawal]),
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

  const makeWalletServiceMock = () => ({
    getOrCreateWallet: jest.fn().mockResolvedValue(mockWallet),
    holdFunds: jest.fn().mockResolvedValue({ id: 'tx-hold-1' }),
    releaseFunds: jest.fn().mockResolvedValue({ id: 'tx-release-1' }),
    completeWithdrawal: jest.fn().mockResolvedValue({ id: 'tx-debit-1' }),
  });

  beforeEach(async () => {
    prisma = makePrismaMock();
    walletService = makeWalletServiceMock();
    auditService = { log: jest.fn() };
    mailService = {
      sendPayoutNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<WithdrawalService>(WithdrawalService);
  });

  // ═══════════════════════════════════════════════════════════
  // requestWithdrawal
  // ═══════════════════════════════════════════════════════════

  describe('requestWithdrawal', () => {
    it('should create a withdrawal and hold funds on success', async () => {
      const result = await service.requestWithdrawal('user-1', defaultDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('wd-1');
      expect(result.status).toBe(WithdrawalStatus.REQUESTED);
      expect(result.amount).toBe('500');
      expect(result.method).toBe(PayoutMethod.BANK_TRANSFER);
      expect(result.currency).toBe(Currency.ZAR);

      // Verify funds were held
      expect(walletService.holdFunds).toHaveBeenCalledWith(
        'user-1',
        500,
        'wd-1',
      );
    });

    it('should check pending withdrawal count before creating', async () => {
      await service.requestWithdrawal('user-1', defaultDto);

      expect(prisma.withdrawal.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: {
            in: [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING],
          },
        },
      });
    });

    it('should pass correct data to withdrawal.create inside transaction', async () => {
      await service.requestWithdrawal('user-1', defaultDto);

      // The $transaction wraps the create call
      expect(prisma.withdrawal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walletId: 'wallet-1',
          userId: 'user-1',
          amount: 500,
          currency: Currency.ZAR,
          method: PayoutMethod.BANK_TRANSFER,
          status: WithdrawalStatus.REQUESTED,
          destination: { bank: 'FNB', account: '12345' },
        }),
      });
    });

    it('should log an audit entry on successful request', async () => {
      await service.requestWithdrawal('user-1', defaultDto);

      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'user-1',
        actorRole: UserRole.PARTICIPANT,
        action: AUDIT_ACTIONS.WITHDRAWAL_REQUEST,
        entityType: ENTITY_TYPES.WITHDRAWAL,
        entityId: 'wd-1',
        afterState: {
          amount: 500,
          method: PayoutMethod.BANK_TRANSFER,
        },
      });
    });

    it('should reject when max pending withdrawals exceeded', async () => {
      prisma.withdrawal.count.mockResolvedValueOnce(
        WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER,
      );

      await expect(
        service.requestWithdrawal('user-1', defaultDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should succeed when pending count is below the limit', async () => {
      prisma.withdrawal.count.mockResolvedValueOnce(
        WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER - 1,
      );

      const result = await service.requestWithdrawal('user-1', defaultDto);
      expect(result.status).toBe(WithdrawalStatus.REQUESTED);
    });

    it('should include limit number in error message when pending limit exceeded', async () => {
      prisma.withdrawal.count.mockResolvedValueOnce(
        WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER,
      );

      await expect(
        service.requestWithdrawal('user-1', defaultDto),
      ).rejects.toThrow(
        `Maximum ${WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER} pending withdrawals allowed`,
      );
    });

    it('should reject when insufficient balance', async () => {
      walletService.getOrCreateWallet.mockResolvedValueOnce({
        ...mockWallet,
        balance: D(10),
      });

      await expect(
        service.requestWithdrawal('user-1', {
          ...defaultDto,
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when balance exactly zero', async () => {
      walletService.getOrCreateWallet.mockResolvedValueOnce({
        ...mockWallet,
        balance: D(0),
      });

      await expect(
        service.requestWithdrawal('user-1', {
          ...defaultDto,
          amount: 100,
        }),
      ).rejects.toThrow('Insufficient balance');
    });

    it('should allow withdrawal when balance equals requested amount', async () => {
      walletService.getOrCreateWallet.mockResolvedValueOnce({
        ...mockWallet,
        balance: D(500),
      });

      const result = await service.requestWithdrawal('user-1', defaultDto);
      expect(result.status).toBe(WithdrawalStatus.REQUESTED);
    });

    it('should not hold funds if the transaction create fails', async () => {
      prisma.$transaction.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.requestWithdrawal('user-1', defaultDto),
      ).rejects.toThrow('DB error');

      expect(walletService.holdFunds).not.toHaveBeenCalled();
    });

    it('should format the returned withdrawal with string amount and ISO dates', async () => {
      const result = await service.requestWithdrawal('user-1', defaultDto);

      expect(typeof result.amount).toBe('string');
      expect(result.createdAt).toBe(NOW.toISOString());
      expect(result.destination).toEqual({ bank: 'FNB', account: '12345' });
      expect(result.processedAt).toBeNull();
      expect(result.failureReason).toBeNull();
      expect(result.proofUrl).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // processWithdrawal
  // ═══════════════════════════════════════════════════════════

  describe('processWithdrawal', () => {
    it('should move a REQUESTED withdrawal to PROCESSING', async () => {
      const result = await service.processWithdrawal('wd-1', 'admin-1');

      expect(result.status).toBe(WithdrawalStatus.PROCESSING);
      expect(prisma.withdrawal.update).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: {
          status: WithdrawalStatus.PROCESSING,
          processedAt: expect.any(Date),
        },
      });
    });

    it('should log an audit entry on process', async () => {
      await service.processWithdrawal('wd-1', 'admin-1');

      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'admin-1',
        actorRole: UserRole.SUPER_ADMIN,
        action: AUDIT_ACTIONS.WITHDRAWAL_PROCESS,
        entityType: ENTITY_TYPES.WITHDRAWAL,
        entityId: 'wd-1',
        beforeState: { status: WithdrawalStatus.REQUESTED },
        afterState: { status: WithdrawalStatus.PROCESSING },
      });
    });

    it('should reject processing a non-REQUESTED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await expect(
        service.processWithdrawal('wd-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject processing a COMPLETED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.COMPLETED,
      });

      await expect(
        service.processWithdrawal('wd-1', 'admin-1'),
      ).rejects.toThrow(
        `Cannot process withdrawal in ${WithdrawalStatus.COMPLETED} status`,
      );
    });

    it('should throw NotFoundException for nonexistent withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.processWithdrawal('wd-999', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // completeWithdrawal
  // ═══════════════════════════════════════════════════════════

  describe('completeWithdrawal', () => {
    it('should complete a PROCESSING withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      const result = await service.completeWithdrawal(
        'wd-1',
        'admin-1',
        'https://proof.com/receipt.pdf',
      );

      expect(result.status).toBe(WithdrawalStatus.COMPLETED);
      expect(prisma.withdrawal.update).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: {
          status: WithdrawalStatus.COMPLETED,
          proofUrl: 'https://proof.com/receipt.pdf',
        },
      });
    });

    it('should call walletService.completeWithdrawal to finalize funds', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await service.completeWithdrawal('wd-1', 'admin-1');

      expect(walletService.completeWithdrawal).toHaveBeenCalledWith(
        'user-1',
        500,
        'wd-1',
      );
    });

    it('should set proofUrl to null when no proof provided', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await service.completeWithdrawal('wd-1', 'admin-1');

      expect(prisma.withdrawal.update).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: {
          status: WithdrawalStatus.COMPLETED,
          proofUrl: null,
        },
      });
    });

    it('should log an audit entry on complete', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await service.completeWithdrawal('wd-1', 'admin-1');

      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'admin-1',
        actorRole: UserRole.SUPER_ADMIN,
        action: AUDIT_ACTIONS.WITHDRAWAL_COMPLETE,
        entityType: ENTITY_TYPES.WITHDRAWAL,
        entityId: 'wd-1',
        beforeState: { status: WithdrawalStatus.PROCESSING },
        afterState: { status: WithdrawalStatus.COMPLETED },
      });
    });

    it('should send email notification to user on completion', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await service.completeWithdrawal('wd-1', 'admin-1');

      expect(mailService.sendPayoutNotificationEmail).toHaveBeenCalledWith(
        'user@test.com',
        {
          userName: 'Test',
          bountyTitle: 'Wallet Withdrawal',
          amount: '500',
          currency: Currency.ZAR,
        },
      );
    });

    it('should not throw if email sending fails', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });
      mailService.sendPayoutNotificationEmail.mockRejectedValueOnce(
        new Error('SMTP down'),
      );

      // Should not propagate the email error
      await expect(
        service.completeWithdrawal('wd-1', 'admin-1'),
      ).resolves.toBeDefined();
    });

    it('should reject completing a REQUESTED withdrawal', async () => {
      // default mock has REQUESTED status
      await expect(
        service.completeWithdrawal('wd-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completing a FAILED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.FAILED,
      });

      await expect(
        service.completeWithdrawal('wd-1', 'admin-1'),
      ).rejects.toThrow(
        `Cannot complete withdrawal in ${WithdrawalStatus.FAILED} status`,
      );
    });

    it('should throw NotFoundException for nonexistent withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.completeWithdrawal('wd-999', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // failWithdrawal
  // ═══════════════════════════════════════════════════════════

  describe('failWithdrawal', () => {
    it('should fail a REQUESTED withdrawal and release funds', async () => {
      const result = await service.failWithdrawal(
        'wd-1',
        'admin-1',
        'Invalid bank details',
      );

      expect(result.status).toBe(WithdrawalStatus.FAILED);
      expect(result.failureReason).toBe('Invalid bank details');
      expect(walletService.releaseFunds).toHaveBeenCalledWith(
        'user-1',
        500,
        'wd-1',
      );
    });

    it('should fail a PROCESSING withdrawal and release funds', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      const result = await service.failWithdrawal(
        'wd-1',
        'admin-1',
        'Provider error',
      );

      expect(result.status).toBe(WithdrawalStatus.FAILED);
      expect(walletService.releaseFunds).toHaveBeenCalled();
    });

    it('should log an audit entry with failure reason', async () => {
      await service.failWithdrawal('wd-1', 'admin-1', 'Invalid bank details');

      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'admin-1',
        actorRole: UserRole.SUPER_ADMIN,
        action: AUDIT_ACTIONS.WITHDRAWAL_FAIL,
        entityType: ENTITY_TYPES.WITHDRAWAL,
        entityId: 'wd-1',
        beforeState: { status: WithdrawalStatus.REQUESTED },
        afterState: { status: WithdrawalStatus.FAILED, reason: 'Invalid bank details' },
      });
    });

    it('should send failure email notification', async () => {
      await service.failWithdrawal('wd-1', 'admin-1', 'Invalid bank details');

      expect(mailService.sendPayoutNotificationEmail).toHaveBeenCalledWith(
        'user@test.com',
        expect.objectContaining({
          userName: 'Test',
          bountyTitle: 'Withdrawal Failed: Invalid bank details',
          amount: '500',
          currency: Currency.ZAR,
        }),
      );
    });

    it('should not throw if failure email sending fails', async () => {
      mailService.sendPayoutNotificationEmail.mockRejectedValueOnce(
        new Error('SMTP down'),
      );

      await expect(
        service.failWithdrawal('wd-1', 'admin-1', 'Bad details'),
      ).resolves.toBeDefined();
    });

    it('should reject failing a COMPLETED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.COMPLETED,
      });

      await expect(
        service.failWithdrawal('wd-1', 'admin-1', 'Too late'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject failing a CANCELLED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.CANCELLED,
      });

      await expect(
        service.failWithdrawal('wd-1', 'admin-1', 'Already cancelled'),
      ).rejects.toThrow(
        `Cannot fail withdrawal in ${WithdrawalStatus.CANCELLED} status`,
      );
    });

    it('should throw NotFoundException for nonexistent withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.failWithdrawal('wd-999', 'admin-1', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use fallback userName when user has no firstName', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
        firstName: null,
      });

      await service.failWithdrawal('wd-1', 'admin-1', 'Reason');

      expect(mailService.sendPayoutNotificationEmail).toHaveBeenCalledWith(
        'user@test.com',
        expect.objectContaining({ userName: 'Participant' }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // cancelWithdrawal
  // ═══════════════════════════════════════════════════════════

  describe('cancelWithdrawal', () => {
    it('should cancel a REQUESTED withdrawal by the owning user', async () => {
      const result = await service.cancelWithdrawal('wd-1', 'user-1');

      expect(result.status).toBe(WithdrawalStatus.CANCELLED);
      expect(prisma.withdrawal.update).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: { status: WithdrawalStatus.CANCELLED },
      });
    });

    it('should release funds back to wallet on cancellation', async () => {
      await service.cancelWithdrawal('wd-1', 'user-1');

      expect(walletService.releaseFunds).toHaveBeenCalledWith(
        'user-1',
        500,
        'wd-1',
      );
    });

    it('should log an audit entry on cancellation', async () => {
      await service.cancelWithdrawal('wd-1', 'user-1');

      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'user-1',
        actorRole: UserRole.PARTICIPANT,
        action: AUDIT_ACTIONS.WITHDRAWAL_CANCEL,
        entityType: ENTITY_TYPES.WITHDRAWAL,
        entityId: 'wd-1',
        beforeState: { status: WithdrawalStatus.REQUESTED },
        afterState: { status: WithdrawalStatus.CANCELLED },
      });
    });

    it('should reject cancellation by a different user', async () => {
      await expect(
        service.cancelWithdrawal('wd-1', 'user-other'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.cancelWithdrawal('wd-1', 'user-other'),
      ).rejects.toThrow('Not authorized to cancel this withdrawal');
    });

    it('should reject cancellation of a PROCESSING withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });

      await expect(
        service.cancelWithdrawal('wd-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancellation of a COMPLETED withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.COMPLETED,
      });

      await expect(
        service.cancelWithdrawal('wd-1', 'user-1'),
      ).rejects.toThrow(
        `Cannot cancel withdrawal in ${WithdrawalStatus.COMPLETED} status`,
      );
    });

    it('should throw NotFoundException for nonexistent withdrawal', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.cancelWithdrawal('wd-999', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // listUserWithdrawals
  // ═══════════════════════════════════════════════════════════

  describe('listUserWithdrawals', () => {
    it('should return paginated withdrawals for a user', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([mockWithdrawal]);
      prisma.withdrawal.count.mockResolvedValueOnce(1);

      const result = await service.listUserWithdrawals('user-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('wd-1');
      expect(result.data[0].amount).toBe('500');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should apply page and limit params', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(50);

      const result = await service.listUserWithdrawals('user-1', {
        page: 3,
        limit: 10,
      });

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should cap limit at MAX_LIMIT (100)', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.listUserWithdrawals('user-1', { limit: 500 });

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should filter by status when provided', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.listUserWithdrawals('user-1', {
        status: WithdrawalStatus.COMPLETED,
      });

      const expectedWhere = {
        userId: 'user-1',
        status: WithdrawalStatus.COMPLETED,
      };

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(prisma.withdrawal.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('should scope query to the specified userId', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.listUserWithdrawals('user-99', {});

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-99' },
        }),
      );
    });

    it('should use default page=1 and limit=20 when not provided', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      const result = await service.listUserWithdrawals('user-1', {});

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should format all withdrawal fields correctly', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([mockWithdrawal]);
      prisma.withdrawal.count.mockResolvedValueOnce(1);

      const result = await service.listUserWithdrawals('user-1', {});
      const item = result.data[0];

      expect(item).toEqual({
        id: 'wd-1',
        amount: '500',
        currency: Currency.ZAR,
        method: PayoutMethod.BANK_TRANSFER,
        status: WithdrawalStatus.REQUESTED,
        destination: { bank: 'FNB', account: '12345' },
        processedAt: null,
        failureReason: null,
        proofUrl: null,
        createdAt: NOW.toISOString(),
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminListWithdrawals
  // ═══════════════════════════════════════════════════════════

  describe('adminListWithdrawals', () => {
    const mockWithdrawalWithUser = {
      ...mockWithdrawal,
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    };

    it('should return paginated withdrawals with user info', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([
        mockWithdrawalWithUser,
      ]);
      prisma.withdrawal.count.mockResolvedValueOnce(1);

      const result = await service.adminListWithdrawals({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId).toBe('user-1');
      expect(result.data[0].userName).toBe('John Doe');
      expect(result.data[0].userEmail).toBe('john@example.com');
      expect(result.meta.total).toBe(1);
    });

    it('should include user relation in the query', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({});

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({
        status: WithdrawalStatus.REQUESTED,
      });

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: WithdrawalStatus.REQUESTED },
        }),
      );
    });

    it('should apply search filter across user name and email', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({ search: 'john' });

      const callArgs = prisma.withdrawal.findMany.mock.calls[0][0];
      expect(callArgs.where.user).toEqual({
        OR: [
          { firstName: { contains: 'john', mode: 'insensitive' } },
          { lastName: { contains: 'john', mode: 'insensitive' } },
          { email: { contains: 'john', mode: 'insensitive' } },
        ],
      });
    });

    it('should apply both status and search filters together', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({
        status: WithdrawalStatus.PROCESSING,
        search: 'doe',
      });

      const callArgs = prisma.withdrawal.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe(WithdrawalStatus.PROCESSING);
      expect(callArgs.where.user).toBeDefined();
    });

    it('should apply pagination with page and limit', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(100);

      const result = await service.adminListWithdrawals({
        page: 5,
        limit: 10,
      });

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (5-1) * 10
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(10);
    });

    it('should cap limit at MAX_LIMIT (100)', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({ limit: 999 });

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should handle user with only firstName', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([
        {
          ...mockWithdrawal,
          user: {
            id: 'user-1',
            firstName: 'Alice',
            lastName: null,
            email: 'alice@test.com',
          },
        },
      ]);
      prisma.withdrawal.count.mockResolvedValueOnce(1);

      const result = await service.adminListWithdrawals({});
      expect(result.data[0].userName).toBe('Alice');
    });

    it('should handle user with no first or last name', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([
        {
          ...mockWithdrawal,
          user: {
            id: 'user-1',
            firstName: null,
            lastName: null,
            email: 'anon@test.com',
          },
        },
      ]);
      prisma.withdrawal.count.mockResolvedValueOnce(1);

      const result = await service.adminListWithdrawals({});
      expect(result.data[0].userName).toBe('');
    });

    it('should order withdrawals by createdAt desc', async () => {
      prisma.withdrawal.findMany.mockResolvedValueOnce([]);
      prisma.withdrawal.count.mockResolvedValueOnce(0);

      await service.adminListWithdrawals({});

      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // findOrFail (tested via public methods)
  // ═══════════════════════════════════════════════════════════

  describe('findOrFail (private, tested indirectly)', () => {
    it('should throw NotFoundException when withdrawal not found via process', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.processWithdrawal('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include descriptive message in NotFoundException', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.processWithdrawal('nonexistent', 'admin-1'),
      ).rejects.toThrow('Withdrawal not found');
    });

    it('should throw NotFoundException when withdrawal not found via cancel', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.cancelWithdrawal('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // formatWithdrawal (tested via public method outputs)
  // ═══════════════════════════════════════════════════════════

  describe('formatWithdrawal (private, tested via output shape)', () => {
    it('should include processedAt as ISO string when set', async () => {
      const processedDate = new Date('2026-03-20T12:00:00Z');
      // Use processWithdrawal on a REQUESTED withdrawal; the update mock
      // returns a withdrawal with processedAt set so we can verify formatting.
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.REQUESTED,
      });
      prisma.withdrawal.update.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
        processedAt: processedDate,
      });

      const result = await service.processWithdrawal('wd-1', 'admin-1');
      expect(result.processedAt).toBe(processedDate.toISOString());
    });

    it('should include failureReason when present', async () => {
      prisma.withdrawal.update.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.FAILED,
        failureReason: 'Bank rejected',
      });

      const result = await service.failWithdrawal(
        'wd-1',
        'admin-1',
        'Bank rejected',
      );
      expect(result.failureReason).toBe('Bank rejected');
    });

    it('should include proofUrl when present', async () => {
      prisma.withdrawal.findUnique.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.PROCESSING,
      });
      prisma.withdrawal.update.mockResolvedValueOnce({
        ...mockWithdrawal,
        status: WithdrawalStatus.COMPLETED,
        proofUrl: 'https://proof.example.com/receipt',
      });

      const result = await service.completeWithdrawal(
        'wd-1',
        'admin-1',
        'https://proof.example.com/receipt',
      );
      expect(result.proofUrl).toBe('https://proof.example.com/receipt');
    });
  });
});
