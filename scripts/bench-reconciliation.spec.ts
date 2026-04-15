/**
 * Sanity test for scripts/bench-reconciliation.ts.
 *
 * Scope
 * -----
 *   - parseArgs() behaviour: defaults, --n coercion, --output validation.
 *   - main() runs end-to-end at N=100 without crashing IF a local postgres
 *     cluster is reachable. Skipped (not failed) when the cluster is absent
 *     so the repo-wide `npm test` stays green on CI machines that don't
 *     spin up Postgres for the scripts suite.
 *
 * The benchmark itself is exercised in detail via the manual CLI runs that
 * produce docs/perf/*.md — this spec only guards the harness wiring.
 */
import { execSync } from 'child_process';
import { parseArgs, main, CliArgs } from './bench-reconciliation';

function localPostgresReachable(): boolean {
  try {
    execSync('pg_isready -h localhost -p 5432 -t 1', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('bench-reconciliation parseArgs', () => {
  it('applies defaults when no flags passed', () => {
    const a = parseArgs([]);
    expect(a.n).toBe(1000);
    expect(a.output).toBe('both');
    expect(a.keepDb).toBe(false);
  });

  it('parses --n', () => {
    const a = parseArgs(['--n', '2500']);
    expect(a.n).toBe(2500);
  });

  it('rejects --n < 10', () => {
    expect(() => parseArgs(['--n', '5'])).toThrow(/--n must be >= 10/);
  });

  it('parses --output table', () => {
    const a = parseArgs(['--output', 'table']);
    expect(a.output).toBe('table');
  });

  it('rejects invalid --output', () => {
    expect(() => parseArgs(['--output', 'xml'])).toThrow(/--output must be one of/);
  });

  it('parses --keep-db', () => {
    const a = parseArgs(['--keep-db']);
    expect(a.keepDb).toBe(true);
  });
});

const describeIfPg = localPostgresReachable() ? describe : describe.skip;

describeIfPg('bench-reconciliation main() at N=100', () => {
  jest.setTimeout(120_000);

  it('runs end-to-end and detects the injected unbalanced + duplicate faults', async () => {
    const args: CliArgs = {
      n: 100,
      output: 'json',
      keepDb: false,
    };
    const result = await main(args);
    expect(result.n).toBe(100);
    expect(result.seedResult.entries).toBeGreaterThanOrEqual(100);
    expect(result.findings.unbalancedDetected).toBe(true);
    expect(result.findings.duplicateDetected).toBe(true);
    // End-to-end on 100 entries should be well under 10 s on any dev box.
    expect(result.timings.endToEndRunMs).toBeLessThan(10_000);
  });
});
