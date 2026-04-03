import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SubmissionStatus,
  PayoutStatus,
  COMMISSION_RATES,
  SubscriptionTier,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processExpiredDeadlines() {
    const now = new Date();

    try {
      const submissions = await this.prisma.submission.findMany({
        where: {
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
          verificationDeadline: { lte: now },
        },
        include: {
          bounty: { select: { title: true, rewardValue: true } },
        },
        take: 100,
      });

      if (submissions.length === 0) return;

      // Batch update all payout statuses atomically
      await this.prisma.submission.updateMany({
        where: {
          id: { in: submissions.map((s) => s.id) },
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
        },
        data: { payoutStatus: PayoutStatus.PAID },
      });

      // Credit wallets with tier-based commission
      const walletResults = await Promise.allSettled(
        submissions
          .filter((s) => s.bounty.rewardValue && Number(s.bounty.rewardValue) > 0)
          .map(async (s) => {
            const hunterTier = await this.subscriptionsService.getActiveTier(s.userId);
            const commissionRate = hunterTier === SubscriptionTier.PRO
              ? COMMISSION_RATES.HUNTER_PRO
              : COMMISSION_RATES.HUNTER_FREE;
            return this.walletService.creditWalletWithCommission(
              s.userId,
              Number(s.bounty.rewardValue),
              commissionRate,
              `Auto-payout for bounty: ${s.bounty.title}`,
              'SUBMISSION',
              s.id,
            );
          }),
      );

      const failed = walletResults.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        this.logger.warn(`${failed.length} wallet credits failed during auto-payout`);
      }

      this.logger.log(
        `Auto-paid ${submissions.length} submissions (${submissions.length - failed.length} wallets credited)`,
      );
    } catch (error) {
      this.logger.error('Failed to process expired deadlines', error);
    }
  }
}
