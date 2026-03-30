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
      // Fetch eligible submissions individually so we can credit each wallet
      const submissions = await this.prisma.submission.findMany({
        where: {
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
          verificationDeadline: { lte: now },
        },
        include: {
          bounty: {
            select: { title: true, rewardValue: true },
          },
        },
      });

      let processed = 0;

      for (const submission of submissions) {
        try {
          await this.prisma.submission.update({
            where: { id: submission.id },
            data: { payoutStatus: PayoutStatus.PAID },
          });

          // Credit wallet if there is a reward value
          const rewardAmount = submission.bounty.rewardValue
            ? Number(submission.bounty.rewardValue)
            : 0;

          if (rewardAmount > 0) {
            await this.walletService.creditWallet(
              submission.userId,
              rewardAmount,
              `Auto-payout for bounty: ${submission.bounty.title}`,
              'SUBMISSION',
              submission.id,
            );
          }

          processed++;
        } catch (err) {
          this.logger.error(
            `Failed to process submission ${submission.id}`,
            err,
          );
        }
      }

      if (processed > 0) {
        this.logger.log(
          `Auto-paid ${processed} submissions past verification deadline`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to process expired deadlines', error);
    }
  }
}
