#!/usr/bin/env node
/**
 * bench-reconciliation.ci — opt-in perf guard.
 *
 * Runs the full benchmark at N=1000 and fails (non-zero exit) if any check
 * exceeds its threshold. Thresholds are calibrated from the baseline run on
 * 2026-04-15 (see docs/perf/2026-04-15-reconciliation-benchmarks.md) with a
 * 3× headroom so normal dev-box variance doesn't flip red.
 *
 * This is NOT wired into `npm test`. Developers run it explicitly via:
 *
 *   npm run bench:recon
 *
 * …before merging anything that touches reconciliation, the ledger schema, or
 * the scheduler cadence.
 */
import { main } from './bench-reconciliation';

// Thresholds (ms) — see docs/perf/2026-04-15-reconciliation-benchmarks.md §4
// for the N=1000 baseline that produced these numbers.
const THRESHOLDS_MS = {
  checkGroupBalanceMs: 500,
  checkDuplicateGroupsMs: 500,
  checkReserveVsBountyMs: 3_000,
  endToEndRunMs: 5_000,
};

async function runCi(): Promise<number> {
  const result = await main({ n: 1000, output: 'table', keepDb: false });
  const failures: string[] = [];

  for (const [key, thresh] of Object.entries(THRESHOLDS_MS) as [
    keyof typeof THRESHOLDS_MS,
    number,
  ][]) {
    const actual = result.timings[key];
    if (actual > thresh) {
      failures.push(`${key}: ${actual.toFixed(1)} ms > ${thresh} ms`);
    }
  }

  // Correctness guard — if the injected faults stop firing, reconciliation
  // itself is broken (or the seed is), which must fail the guard too.
  if (!result.findings.unbalancedDetected) {
    failures.push('injected unbalanced group NOT detected — reconciliation is broken');
  }
  if (!result.findings.duplicateDetected) {
    failures.push('injected duplicate pair NOT detected — reconciliation is broken');
  }

  if (failures.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n[bench:ci] THRESHOLD FAILURES:');
    for (const f of failures) {
      // eslint-disable-next-line no-console
      console.error(`  - ${f}`);
    }
    return 1;
  }

  // eslint-disable-next-line no-console
  console.log('\n[bench:ci] all thresholds passed');
  return 0;
}

if (require.main === module) {
  runCi()
    .then((code) => process.exit(code))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`[bench:ci] FAILED: ${err instanceof Error ? err.stack : err}`);
      process.exit(1);
    });
}

export { runCi };
