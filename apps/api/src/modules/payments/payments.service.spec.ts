import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, BountyStatus, PaymentStatus } from '@social-bounty/shared';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

// Mock Stripe module
jest.mock('stripe', () => {
  const mockPaymentIntentsCreate = jest.fn();
  const mockWebhooksConstructEvent = jest.fn();

  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
    _mockPaymentIntentsCreate: mockPaymentIntentsCreate,
    _mockWebhooksConstructEvent: mockWebhooksConstructEvent,
  }));
});

const mockBA: AuthenticatedUser = {
  sub: 'ba-id',
  email: 'ba@test.com',
  role: UserRole.BUSINESS_ADMIN,
  organisationId: 'org-1',
};

const mockSA: AuthenticatedUser = {
  sub: 'sa-id',
  email: 'admin@test.com',
  role: UserRole.SUPER_ADMIN,
  organisationId: null,
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let auditService: any;
  let stripeInstance: any;

  beforeEach(async () => {
    prisma = {
      bounty: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_mock',
                STRIPE_WEBHOOK_SECRET: 'whsec_test_mock',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    // Access the stripe instance's mock functions
    stripeInstance = (service as any).stripe;
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for a draft bounty with rewards', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        paymentStatus: 'UNPAID',
        currency: 'ZAR',
        deletedAt: null,
        rewardValue: null,
        rewards: [
          { monetaryValue: { toString: () => '50.00' } },
          { monetaryValue: { toString: () => '25.00' } },
        ],
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.bounty.update.mockResolvedValue(bounty);

      stripeInstance._mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      });

      const result = await service.createPaymentIntent('bounty-1', mockBA);

      expect(result.clientSecret).toBe('pi_test_123_secret');
      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(result.amount).toBe(7500); // 75.00 * 100
      expect(result.currency).toBe('zar');
      expect(stripeInstance._mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 7500,
          currency: 'zar',
        }),
        expect.objectContaining({
          idempotencyKey: 'pi_bounty_bounty-1',
        }),
      );
    });

    it('should pass idempotency key based on bountyId', async () => {
      const bounty = {
        id: 'bounty-xyz',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        paymentStatus: 'UNPAID',
        currency: 'USD',
        deletedAt: null,
        rewardValue: { toString: () => '50.00' },
        rewards: [],
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.bounty.update.mockResolvedValue(bounty);

      stripeInstance._mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_789',
        client_secret: 'pi_test_789_secret',
      });

      await service.createPaymentIntent('bounty-xyz', mockBA);

      expect(stripeInstance._mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.any(Object),
        { idempotencyKey: 'pi_bounty_bounty-xyz' },
      );
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('nonexistent', mockBA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for deleted bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        deletedAt: new Date(),
      });

      await expect(
        service.createPaymentIntent('bounty-1', mockBA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when BA belongs to different org', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-2',
        status: BountyStatus.DRAFT,
        deletedAt: null,
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.createPaymentIntent('bounty-1', mockBA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for non-DRAFT bounty', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.LIVE,
        deletedAt: null,
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.createPaymentIntent('bounty-1', mockBA),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already paid', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        paymentStatus: 'PAID',
        deletedAt: null,
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.createPaymentIntent('bounty-1', mockBA),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when bounty has no reward value', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        paymentStatus: 'UNPAID',
        currency: 'ZAR',
        deletedAt: null,
        rewardValue: null,
        rewards: [],
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.createPaymentIntent('bounty-1', mockBA),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use legacy rewardValue when no reward lines exist', async () => {
      const bounty = {
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        paymentStatus: 'UNPAID',
        currency: 'USD',
        deletedAt: null,
        rewardValue: { toString: () => '100.00' },
        rewards: [],
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.bounty.update.mockResolvedValue(bounty);

      stripeInstance._mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret',
      });

      const result = await service.createPaymentIntent('bounty-1', mockBA);

      expect(result.amount).toBe(10000); // 100.00 * 100
      expect(result.currency).toBe('usd');
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded and transition DRAFT to LIVE', async () => {
      const event = {
        id: 'evt_test_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: { bountyId: 'bounty-1' },
          },
        },
      };
      stripeInstance._mockWebhooksConstructEvent.mockReturnValue(event);
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('body'), 'sig_test');

      expect(result).toEqual({ received: true });
      expect(prisma.bounty.updateMany).toHaveBeenCalledWith({
        where: { id: 'bounty-1' },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BountyStatus.LIVE,
        },
      });
    });

    it('should handle payment_intent.succeeded without status change for non-DRAFT bounty', async () => {
      const event = {
        id: 'evt_test_2',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_456',
            metadata: { bountyId: 'bounty-2' },
          },
        },
      };
      stripeInstance._mockWebhooksConstructEvent.mockReturnValue(event);
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-2',
        status: BountyStatus.LIVE,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('body'), 'sig_test');

      expect(result).toEqual({ received: true });
      expect(prisma.bounty.updateMany).toHaveBeenCalledWith({
        where: { id: 'bounty-2' },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    });

    it('should write audit log on payment success', async () => {
      const event = {
        id: 'evt_test_audit',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_audit',
            metadata: { bountyId: 'bounty-audit' },
          },
        },
      };
      stripeInstance._mockWebhooksConstructEvent.mockReturnValue(event);
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-audit',
        status: BountyStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhook(Buffer.from('body'), 'sig_test');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'stripe-webhook',
          action: 'PAYMENT_SUCCEEDED',
          entityType: 'Bounty',
          entityId: 'bounty-audit',
          beforeState: expect.objectContaining({
            paymentStatus: PaymentStatus.PENDING,
            status: BountyStatus.DRAFT,
          }),
          afterState: expect.objectContaining({
            paymentStatus: PaymentStatus.PAID,
            status: BountyStatus.LIVE,
          }),
        }),
      );
    });

    it('should handle payment_intent.payment_failed', async () => {
      const event = {
        id: 'evt_test_3',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_789',
            metadata: { bountyId: 'bounty-1' },
            last_payment_error: { message: 'Card declined' },
          },
        },
      };
      stripeInstance._mockWebhooksConstructEvent.mockReturnValue(event);
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('body'), 'sig_test');

      expect(result).toEqual({ received: true });
      expect(prisma.bounty.updateMany).toHaveBeenCalledWith({
        where: { id: 'bounty-1' },
        data: { paymentStatus: PaymentStatus.UNPAID },
      });
    });

    it('should write audit log on payment failure with reason', async () => {
      const event = {
        id: 'evt_test_fail_audit',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_fail_audit',
            metadata: { bountyId: 'bounty-fail' },
            last_payment_error: { message: 'Insufficient funds' },
          },
        },
      };
      stripeInstance._mockWebhooksConstructEvent.mockReturnValue(event);
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-fail',
        status: BountyStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhook(Buffer.from('body'), 'sig_test');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_FAILED',
          entityId: 'bounty-fail',
          reason: 'Insufficient funds',
        }),
      );
    });

    it('should throw BadRequestException for invalid signature', async () => {
      stripeInstance._mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook(Buffer.from('body'), 'bad_sig'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
