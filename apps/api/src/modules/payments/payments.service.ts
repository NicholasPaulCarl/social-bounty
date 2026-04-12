import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  UserRole,
  BountyStatus,
  PaymentStatus,
  COMMISSION_RATES,
  SubscriptionTier,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
    private subscriptionsService: SubscriptionsService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured — payments will fail');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia',
      });
    }
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  async createPaymentIntent(bountyId: string, user: AuthenticatedUser) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        rewards: true,
      },
    });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.brandId !== user.brandId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Payment can only be created for DRAFT bounties');
    }

    if (bounty.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment has already been completed');
    }

    // Calculate total from rewards
    let totalCents: number;
    if (bounty.rewards.length > 0) {
      const total = bounty.rewards.reduce(
        (sum, r) => sum + parseFloat(r.monetaryValue.toString()),
        0,
      );
      totalCents = Math.round(total * 100);
    } else if (bounty.rewardValue) {
      totalCents = Math.round(parseFloat(bounty.rewardValue.toString()) * 100);
    } else {
      throw new BadRequestException('Bounty has no reward value for payment');
    }

    if (totalCents <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Calculate admin fee based on org subscription tier
    const orgTier = await this.subscriptionsService.getActiveOrgTier(bounty.brandId);
    const adminFeeRate = orgTier === SubscriptionTier.PRO
      ? COMMISSION_RATES.BRAND_PRO
      : COMMISSION_RATES.BRAND_FREE;
    const totalAmount = totalCents / 100;
    const adminFeeAmount = Math.round(totalAmount * adminFeeRate * 100) / 100;
    const adminFeeCents = Math.round(adminFeeAmount * 100);
    const totalWithFee = totalCents + adminFeeCents;

    // Map currency to Stripe currency codes
    const currencyMap: Record<string, string> = {
      ZAR: 'zar',
      USD: 'usd',
      GBP: 'gbp',
      EUR: 'eur',
    };
    const stripeCurrency = currencyMap[bounty.currency];
    if (!stripeCurrency) {
      throw new BadRequestException(`Unsupported currency: ${bounty.currency}`);
    }

    // Prevent duplicate PaymentIntents
    if (bounty.stripePaymentIntentId) {
      throw new BadRequestException('A payment intent already exists for this bounty');
    }

    // Use bountyId-based idempotency key to prevent duplicate intents on retries
    const idempotencyKey = `pi_bounty_${bountyId}`;

    const paymentIntent = await this.getStripe().paymentIntents.create(
      {
        amount: totalWithFee,
        currency: stripeCurrency,
        metadata: {
          bountyId: bounty.id,
          brandId: bounty.brandId,
          userId: user.sub,
          adminFeePercent: (adminFeeRate * 100).toString(),
          adminFeeAmount: adminFeeAmount.toString(),
        },
      },
      {
        idempotencyKey,
      },
    );

    // Store the payment intent ID and admin fee snapshot on the bounty
    await this.prisma.bounty.update({
      where: { id: bountyId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: PaymentStatus.PENDING,
        adminFeePercent: adminFeeRate * 100,
        adminFeeAmount: adminFeeAmount,
      },
    });

    this.logger.log(
      `Payment intent ${paymentIntent.id} created for bounty ${bountyId} (idempotencyKey: ${idempotencyKey})`,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalWithFee,
      adminFee: adminFeeCents,
      currency: stripeCurrency,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe webhook event: ${event.type} (id: ${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;
        if (bountyId) {
          // Fetch the bounty's current state before updating
          const bounty = await this.prisma.bounty.findUnique({
            where: { id: bountyId },
          });

          const beforeStatus = bounty?.status;
          const beforePaymentStatus = bounty?.paymentStatus;

          // Update paymentStatus to PAID and transition DRAFT bounties to LIVE
          const updateData: Record<string, any> = {
            paymentStatus: PaymentStatus.PAID,
          };

          if (bounty && bounty.status === BountyStatus.DRAFT) {
            updateData.status = BountyStatus.LIVE;
          }

          await this.prisma.bounty.updateMany({
            where: { id: bountyId },
            data: updateData,
          });

          this.logger.log(
            `Payment succeeded for bounty ${bountyId} — paymentStatus: ${beforePaymentStatus} -> PAID` +
              (updateData.status ? `, status: ${beforeStatus} -> LIVE` : ''),
          );

          // Audit log for payment success
          this.auditService.log({
            actorId: 'stripe-webhook',
            actorRole: UserRole.SUPER_ADMIN,
            action: 'PAYMENT_SUCCEEDED',
            entityType: 'Bounty',
            entityId: bountyId,
            beforeState: {
              paymentStatus: beforePaymentStatus,
              status: beforeStatus,
            },
            afterState: {
              paymentStatus: PaymentStatus.PAID,
              status: updateData.status ?? beforeStatus,
              stripePaymentIntentId: paymentIntent.id,
            },
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;
        if (bountyId) {
          const bounty = await this.prisma.bounty.findUnique({
            where: { id: bountyId },
          });

          const beforePaymentStatus = bounty?.paymentStatus;

          await this.prisma.bounty.updateMany({
            where: { id: bountyId },
            data: { paymentStatus: PaymentStatus.UNPAID },
          });

          const failureMessage =
            (paymentIntent as any).last_payment_error?.message ?? 'Unknown failure reason';

          this.logger.warn(
            `Payment failed for bounty ${bountyId}: ${failureMessage}`,
          );

          // Audit log for payment failure
          this.auditService.log({
            actorId: 'stripe-webhook',
            actorRole: UserRole.SUPER_ADMIN,
            action: 'PAYMENT_FAILED',
            entityType: 'Bounty',
            entityId: bountyId,
            beforeState: {
              paymentStatus: beforePaymentStatus,
            },
            afterState: {
              paymentStatus: PaymentStatus.UNPAID,
              stripePaymentIntentId: paymentIntent.id,
            },
            reason: failureMessage,
          });
        }
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
