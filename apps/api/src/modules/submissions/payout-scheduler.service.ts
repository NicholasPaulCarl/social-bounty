import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubmissionStatus, PayoutStatus } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
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
        take: 100, // batch limit
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

      // Credit wallets in parallel (non-blocking — failures logged individually)
      const walletResults = await Promise.allSettled(
        submissions
          .filter((s) => s.bounty.rewardValue && Number(s.bounty.rewardValue) > 0)
          .map((s) =>
            this.walletService.creditWallet(
              s.userId,
              Number(s.bounty.rewardValue),
              `Auto-payout for bounty: ${s.bounty.title}`,
              'SUBMISSION',
              s.id,
            ),
          ),
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
