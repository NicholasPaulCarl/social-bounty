import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutsService } from './payouts.service';

@Injectable()
export class PayoutsScheduler {
  private readonly logger = new Logger(PayoutsScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly payouts: PayoutsService,
  ) {}

  private enabled() {
    return this.config.get<string>('PAYOUTS_ENABLED', 'false') === 'true';
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async execute(): Promise<void> {
    if (!this.enabled()) return;
    try {
      const r = await this.payouts.runBatch();
      if (r.initiated + r.failed > 0) {
        this.logger.log(
          `payout-execution: initiated=${r.initiated} skipped=${r.skipped} failed=${r.failed}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `payout-execution failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async retry(): Promise<void> {
    if (!this.enabled()) return;
    try {
      const r = await this.payouts.retryBatch();
      if (r.retried > 0) this.logger.log(`payout-retry: retried=${r.retried}`);
    } catch (err) {
      this.logger.error(`payout-retry failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
