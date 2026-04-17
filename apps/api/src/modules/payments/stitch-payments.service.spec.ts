import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  PaymentStatus,
  StitchPaymentLinkStatus,
} from '@prisma/client';
import { SubscriptionTier, UserRole } from '@social-bounty/shared';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { StitchClient } from '../stitch/stitch.client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StitchPaymentsService } from './stitch-payments.service';

describe('StitchPaymentsService.createBountyFunding — Kill Switch pre-flight', () => {
  const businessAdmin: AuthenticatedUser = {
    sub: 'user_1',
    email: 'ba@example.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'brand_1',
  };

  const bounty = {
    id: 'bounty_1',
    brandId: 'brand_1',
    deletedAt: null,
    status: BountyStatus.DRAFT,
    paymentStatus: PaymentStatus.UNPAID,
    currency: 'ZAR',
    rewards: [{ monetaryValue: '500.00' }],
    faceValueCents: null,
    stitchPaymentLinks: [] as unknown[],
  };

  let prisma: any;
  let config: Partial<ConfigService>;
  let stitch: jest.Mocked<Pick<StitchClient, 'createPaymentLink'>>;
  let fees: FeeCalculatorService;
  let subs: Partial<SubscriptionsService>;
  let ledger: Partial<LedgerService>;
  let isKillSwitchActive: jest.Mock;
  let service: StitchPaymentsService;

  beforeEach(() => {
    prisma = {
      bounty: {
        findUnique: jest.fn().mockResolvedValue(bounty),
        update: jest.fn().mockResolvedValue(bounty),
      },
      brand: {
        findUnique: jest.fn().mockResolvedValue({ id: 'brand_1', kybStatus: 'APPROVED' }),
      },
      stitchPaymentLink: {
        create: jest.fn().mockResolvedValue({
          id: 'link_1',
          hostedUrl: 'https://pay.example/abc',
          amountCents: 59250n,
        }),
      },
      $transaction: jest.fn(async (ops: unknown[]) => ops),
    };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'PAYMENTS_PROVIDER') return 'stitch_sandbox';
        return undefined;
      }),
    };
    stitch = {
      createPaymentLink: jest.fn().mockResolvedValue({
        id: 'stitch_pl_1',
        url: 'https://pay.example/abc',
      }),
    };
    fees = new FeeCalculatorService();
    subs = {
      getActiveOrgTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE),
    };
    isKillSwitchActive = jest.fn().mockResolvedValue(false);
    ledger = { isKillSwitchActive };

    // Ensure the $transaction returns the created record at index 0.
    prisma.$transaction = jest.fn(async (ops: any[]) => [
      { id: 'link_1', hostedUrl: 'https://pay.example/abc', amountCents: 59250n },
      bounty,
    ]);

    service = new StitchPaymentsService(
      prisma as PrismaService,
      config as ConfigService,
      stitch as unknown as StitchClient,
      fees,
      subs as SubscriptionsService,
      ledger as LedgerService,
    );
  });

  it('proceeds to create a Stitch payment link when the Kill Switch is OFF', async () => {
    const result = await service.createBountyFunding('bounty_1', businessAdmin, {
      name: 'Brand Co',
      email: 'ba@example.com',
    });

    expect(isKillSwitchActive).toHaveBeenCalledTimes(1);
    expect(stitch.createPaymentLink).toHaveBeenCalledTimes(1);
    expect(result.hostedUrl).toBe('https://pay.example/abc');
  });

  it('throws ServiceUnavailableException and does NOT call Stitch when Kill Switch is ON', async () => {
    isKillSwitchActive.mockResolvedValueOnce(true);

    await expect(
      service.createBountyFunding('bounty_1', businessAdmin, {
        name: 'Brand Co',
        email: 'ba@example.com',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(stitch.createPaymentLink).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
