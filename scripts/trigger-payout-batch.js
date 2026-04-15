/**
 * QA helper (throwaway) — force-trigger the Phase 2 outbound payout cron jobs
 * without waiting for the every-10-minute schedule.
 *
 * Bootstraps a Nest application context (not an HTTP server) so we can call
 * ClearanceService.releaseEligible() and PayoutsService.runBatch() directly,
 * using the compiled dist/ the running API already uses.
 *
 * Usage (from repo root):
 *   node scripts/trigger-payout-batch.js [clearance|payout|both]
 *
 * Default mode: both. Pass "clearance" or "payout" to run only one phase.
 *
 * IMPORTANT: Do NOT run this in production. It is purely a QA convenience for
 * the dev-environment Phase 2 E2E recipe documented in
 * docs/reviews/2026-04-15-phase-2-live-test.md.
 */
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { NestFactory } = require('@nestjs/core');
const distPath = require('path').join(__dirname, '..', 'apps', 'api', 'dist');
const { AppModule } = require(distPath + '/app.module');
const { ClearanceService } = require(distPath + '/modules/ledger/clearance.service');
const { PayoutsService } = require(distPath + '/modules/payouts/payouts.service');

async function main() {
  const mode = (process.argv[2] || 'both').toLowerCase();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    if (mode === 'clearance' || mode === 'both') {
      const clearance = app.get(ClearanceService);
      const r = await clearance.releaseEligible();
      console.log('[clearance]', r);
    }
    if (mode === 'payout' || mode === 'both') {
      const payouts = app.get(PayoutsService);
      const r = await payouts.runBatch();
      console.log('[payout]', r);
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('trigger-payout-batch failed:', err);
  process.exit(1);
});
