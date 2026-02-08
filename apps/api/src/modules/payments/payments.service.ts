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
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
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
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Payment can only be created for DRAFT bounties');
    }

    if ((bounty as any).paymentStatus === PaymentStatus.PAID) {
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

    const paymentIntent = await this.getStripe().paymentIntents.create({
      amount: totalCents,
      currency: stripeCurrency,
      metadata: {
        bountyId: bounty.id,
        organisationId: bounty.organisationId,
        userId: user.sub,
      },
    });

    // Store the payment intent ID on the bounty
    await this.prisma.bounty.update({
      where: { id: bountyId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING' as any,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalCents,
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

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;
        if (bountyId) {
          await this.prisma.bounty.updateMany({
            where: { id: bountyId },
            data: { paymentStatus: 'PAID' as any },
          });
          this.logger.log(`Payment succeeded for bounty ${bountyId}`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;
        if (bountyId) {
          await this.prisma.bounty.updateMany({
            where: { id: bountyId },
            data: { paymentStatus: 'UNPAID' as any },
          });
          this.logger.warn(`Payment failed for bounty ${bountyId}`);
        }
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
