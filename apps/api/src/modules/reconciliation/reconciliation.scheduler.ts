import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliationService } from './reconciliation.service';

@Injectable()
export class ReconciliationScheduler {
  private readonly logger = new Logger(ReconciliationScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly recon: ReconciliationService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    const enabled = this.config.get<string>('RECONCILIATION_ENABLED', 'true') !== 'false';
    if (!enabled) return;
    try {
      const report = await this.recon.run();
      if (report.findings.length > 0) {
        this.logger.warn(
          `reconciliation run ${report.runId}: ${report.findings.length} finding(s), killSwitchActivated=${report.killSwitchActivated}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `reconciliation run failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
