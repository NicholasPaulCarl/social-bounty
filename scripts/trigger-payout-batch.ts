/**
 * QA helper (throwaway) — force-trigger the Phase 2 outbound payout cron jobs
 * without waiting for the every-10-minute schedule.
 *
 * Bootstraps a Nest application context (not an HTTP server) so we can call
 * ClearanceService.releaseEligible() and PayoutsService.runBatch() directly,
 * using the exact same providers the running API uses.
 *
 * Usage (from repo root):
 *   cd apps/api && npx ts-node -r tsconfig-paths/register \
 *     ../../scripts/trigger-payout-batch.ts [clearance|payout|both]
 *
 * Default mode: both. Pass "clearance" or "payout" to run only one phase.
 *
 * IMPORTANT: Do NOT run this in production. It is purely a QA convenience for
 * the dev-environment Phase 2 E2E recipe documented in
 * docs/reviews/2026-04-15-phase-2-live-test.md. Delete after use if desired.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { ClearanceService } from '../apps/api/src/modules/ledger/clearance.service';
import { PayoutsService } from '../apps/api/src/modules/payouts/payouts.service';

async function main() {
  const mode = (process.argv[2] ?? 'both').toLowerCase();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    if (mode === 'clearance' || mode === 'both') {
      const clearance = app.get(ClearanceService);
      const r = await clearance.releaseEligible();
      // eslint-disable-next-line no-console
      console.log('[clearance]', r);
    }
    if (mode === 'payout' || mode === 'both') {
      const payouts = app.get(PayoutsService);
      const r = await payouts.runBatch();
      // eslint-disable-next-line no-console
      console.log('[payout]', r);
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('trigger-payout-batch failed:', err);
  process.exit(1);
});
