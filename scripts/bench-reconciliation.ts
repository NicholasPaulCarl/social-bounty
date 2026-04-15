#!/usr/bin/env node
/**
 * bench-reconciliation — batch 10 task C
 *
 * Reproducible performance benchmark for the Phase-1 reconciliation engine
 * (apps/api/src/modules/reconciliation/reconciliation.service.ts).
 *
 * What it does
 * ------------
 * 1. Spins up a throwaway Postgres database (`recon_bench_<ts>` on the local
 *    cluster — see BENCH_DATABASE_HOST / BENCH_PG_SUPERDB env overrides).
 * 2. Applies the canonical Prisma migrations from packages/prisma/migrations.
 * 3. Seeds N ledger entries across N/3 to N/2 balanced double-entry groups,
 *    plus M paid bounties (M = max(1, floor(N/100))) so the reserve check has
 *    real work to iterate over. Injects exactly ONE unbalanced group and ONE
 *    duplicate (referenceId, actionType) pair to prove detection still fires.
 * 4. Instantiates the REAL ReconciliationService (not a mock) and measures
 *    wall-clock timing of each of the three Phase-1 checks individually:
 *      - checkGroupBalance
 *      - checkDuplicateGroups
 *      - checkReserveVsBounty
 *    …plus the end-to-end `run()` path.
 * 5. Emits a JSON + human-readable table, and DROPs the benchmark DB unless
 *    BENCH_KEEP_DB=true is set.
 *
 * Usage (from repo root)
 * ----------------------
 *   npx tsx scripts/bench-reconciliation.ts --n 10000
 *   npx tsx scripts/bench-reconciliation.ts --n 100000 --output json
 *   BENCH_KEEP_DB=true npx tsx scripts/bench-reconciliation.ts --n 1000
 *
 * Constraints honoured (see CLAUDE.md §4 + task brief)
 * ----------------------------------------------------
 *   - Seed data is double-entry balanced (debits == credits per group). One
 *     imbalanced group is injected deliberately.
 *   - Integer minor units — amounts are random `bigint` cent values.
 *   - No production code is modified. We import and re-use the real service.
 *   - Throwaway DB — never touches the dev DB (`social_bounty`) or Supabase.
 *   - Prisma client is instantiated against the bench DB via `datasourceUrl`.
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Use the real ReconciliationService + LedgerService. These live inside
// apps/api; because the repo hoists deps to the root node_modules we can
// import them directly from here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { ReconciliationService } from '../apps/api/src/modules/reconciliation/reconciliation.service';
import { LedgerService } from '../apps/api/src/modules/ledger/ledger.service';
import { PrismaClient, LedgerAccount, LedgerEntryType, LedgerEntryStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

export interface CliArgs {
  n: number;
  output: 'table' | 'json' | 'both';
  reportPath?: string;
  keepDb: boolean;
  dbName?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    n: 1000,
    output: 'both',
    keepDb: process.env.BENCH_KEEP_DB === 'true',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--n' && next) {
      args.n = Number(next);
      i++;
    } else if (a === '--output' && next) {
      if (next !== 'table' && next !== 'json' && next !== 'both') {
        throw new Error(`--output must be one of table|json|both, got ${next}`);
      }
      args.output = next;
      i++;
    } else if (a === '--report' && next) {
      args.reportPath = next;
      i++;
    } else if (a === '--keep-db') {
      args.keepDb = true;
    } else if (a === '--db' && next) {
      args.dbName = next;
      i++;
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  if (!Number.isFinite(args.n) || args.n < 10) {
    throw new Error(`--n must be >= 10 (got ${args.n})`);
  }
  return args;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(
    `bench-reconciliation — reconciliation engine performance benchmark

Usage:
  npx tsx scripts/bench-reconciliation.ts --n 10000

Options:
  --n <int>         number of ledger entries to seed (default 1000)
  --output <mode>   table | json | both (default both)
  --report <path>   append the JSON result to this file
  --keep-db         do NOT drop the throwaway DB (useful for debugging)
  --db <name>       override the bench DB name (default recon_bench_<ts>)

Environment:
  BENCH_PG_HOST        postgres host for bench DB (default: localhost)
  BENCH_PG_PORT        postgres port            (default: 5432)
  BENCH_PG_USER        postgres user            (default: current OS user)
  BENCH_PG_PASSWORD    postgres password        (default: empty)
  BENCH_PG_SUPERDB     superuser db to CREATE/DROP from (default: postgres)
  BENCH_KEEP_DB=true   shorthand for --keep-db
`,
  );
}

// ---------------------------------------------------------------------------
// Bench DB lifecycle
// ---------------------------------------------------------------------------

interface BenchDb {
  name: string;
  url: string;
  pgHost: string;
  pgPort: number;
  pgUser: string;
  pgPassword: string;
  superDb: string;
}

function buildBenchDbConfig(dbName?: string): BenchDb {
  const ts = Date.now();
  const name = dbName ?? `recon_bench_${ts}`;
  const pgHost = process.env.BENCH_PG_HOST ?? 'localhost';
  const pgPort = Number(process.env.BENCH_PG_PORT ?? '5432');
  const pgUser = process.env.BENCH_PG_USER ?? process.env.USER ?? 'postgres';
  const pgPassword = process.env.BENCH_PG_PASSWORD ?? '';
  const superDb = process.env.BENCH_PG_SUPERDB ?? 'postgres';
  const auth = pgPassword ? `${pgUser}:${encodeURIComponent(pgPassword)}` : pgUser;
  const url = `postgresql://${auth}@${pgHost}:${pgPort}/${name}?sslmode=disable`;
  return { name, url, pgHost, pgPort, pgUser, pgPassword, superDb };
}

function psql(db: BenchDb, dbName: string, sql: string): void {
  const env = { ...process.env, PGPASSWORD: db.pgPassword };
  const res = spawnSync(
    'psql',
    ['-h', db.pgHost, '-p', String(db.pgPort), '-U', db.pgUser, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { env, encoding: 'utf8' },
  );
  if (res.status !== 0) {
    throw new Error(`psql failed: ${res.stderr || res.stdout}`);
  }
}

function createBenchDb(db: BenchDb): void {
  psql(db, db.superDb, `CREATE DATABASE "${db.name}";`);
}

function dropBenchDb(db: BenchDb): void {
  try {
    // Terminate connections then drop. Supabase-free local cluster only.
    psql(
      db,
      db.superDb,
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db.name}' AND pid<>pg_backend_pid();`,
    );
  } catch {
    /* ignore */
  }
  psql(db, db.superDb, `DROP DATABASE IF EXISTS "${db.name}";`);
}

function applyMigrations(db: BenchDb): void {
  const env = {
    ...process.env,
    DATABASE_URL: db.url,
    DIRECT_URL: db.url,
  };
  const cwd = path.resolve(__dirname, '..', 'apps', 'api');
  // `prisma db push` syncs the schema directly from schema.prisma rather than
  // replaying migrations in order. We use it here because the historical
  // migration files have ordering drift (e.g. 20260415143053_stitch_express
  // references "SubscriptionTier" before any migration creates it — the enum
  // exists only in the schema file). A migration-order fix is out of scope
  // for this benchmark; db push gives us a faithful representation of the
  // CURRENT prod schema, which is what we actually need to benchmark.
  const res = spawnSync(
    'npx',
    [
      'prisma',
      'db',
      'push',
      '--skip-generate',
      '--accept-data-loss',
      '--schema',
      '../../packages/prisma/schema.prisma',
    ],
    { cwd, env, encoding: 'utf8' },
  );
  if (res.status !== 0) {
    throw new Error(`prisma db push failed: ${res.stderr || res.stdout}`);
  }
}

async function detectPgVersion(prisma: PrismaClient): Promise<string> {
  const rows = await prisma.$queryRaw<{ version: string }[]>`SELECT version() as version`;
  return rows[0]?.version ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Fast pseudo-random generator (mulberry32) — deterministic seeds keep bench
 * runs reproducible when BENCH_SEED is set, otherwise we fall back to Date.now().
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS: LedgerAccount[] = [
  'brand_cash_received',
  'brand_reserve',
  'brand_refundable',
  'hunter_pending',
  'hunter_clearing',
  'hunter_available',
  'hunter_paid',
  'hunter_net_payable',
  'commission_revenue',
  'admin_fee_revenue',
  'global_fee_revenue',
  'processing_expense',
  'payout_fee_recovery',
  'bank_charges',
  'gateway_clearing',
  'payout_in_transit',
  'subscription_revenue',
] as LedgerAccount[];

interface SeedResult {
  groups: number;
  entries: number;
  paidBounties: number;
  unbalancedGroupId: string;
  duplicatePair: { referenceId: string; actionType: string };
  wallTimeMs: number;
}

interface SeedOpts {
  prisma: PrismaClient;
  nEntries: number;
  seed?: number;
}

/**
 * Bulk-inserts balanced double-entry groups plus exactly one imbalanced group
 * and one duplicate (referenceId, actionType) pair. Uses `$executeRawUnsafe`
 * with multi-row VALUES tuples — orders of magnitude faster than one Prisma
 * call per row.
 *
 * Layout per group:
 *   - legs ∈ {2,3,4,5,6}, 50/50 split (or ±1) between DEBIT and CREDIT
 *   - sum(debits) === sum(credits)  (balanced)
 *   - ~1% of groups are attached to a paid bounty with account=brand_reserve
 *     so the reserve check has real iterations to do
 */
async function seedLedger(opts: SeedOpts): Promise<SeedResult> {
  const { prisma, nEntries } = opts;
  const rng = mulberry32(opts.seed ?? Date.now() & 0xffffffff);
  const started = performance.now();

  // Create a dummy organisation + user so bounty FKs are satisfied.
  // (brandId is NOT NULL on bounties; createdById too.)
  const userId = 'bench-user-0000';
  const brandId = 'bench-brand-0000';
  await prisma.$executeRawUnsafe(
    `INSERT INTO users (id, email, "firstName", "lastName", role, status, "emailVerified", "updatedAt")
     VALUES ($1, $2, 'Bench', 'User', 'SUPER_ADMIN', 'ACTIVE', true, NOW())
     ON CONFLICT (id) DO NOTHING`,
    userId,
    `bench+${Date.now()}@social-bounty.local`,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO organisations (id, name, "contactEmail", status, "updatedAt")
     VALUES ($1, 'Bench Brand', 'bench@local', 'ACTIVE', NOW())
     ON CONFLICT (id) DO NOTHING`,
    brandId,
  );

  // Seed paid bounties (≈1% of N, min 1, max 1000 to keep reserve loop bounded
  // on large N — the loop is O(B) and we document that separately).
  // Bounty count scales with N. Upper-bound at 10_000 so the bench stays under
  // the 10-minute ceiling at N=100k even if the reserve-check is O(B) — which
  // is exactly what we're here to measure. Override via BENCH_PAID_BOUNTIES env
  // var for targeted stress runs.
  const envB = Number(process.env.BENCH_PAID_BOUNTIES);
  const nBounties = Number.isFinite(envB) && envB > 0
    ? Math.floor(envB)
    : Math.max(1, Math.min(10_000, Math.floor(nEntries / 100)));
  const bountyIds: string[] = [];
  for (let i = 0; i < nBounties; i++) {
    const id = `bench-bounty-${String(i).padStart(6, '0')}`;
    bountyIds.push(id);
  }
  // Bulk-insert bounties via multi-row VALUES. Chunk to stay under Postgres'
  // 32767 bind-parameter cap (we use 4 params per row).
  const BOUNTY_CHUNK = 2000;
  for (let i0 = 0; i0 < bountyIds.length; i0 += BOUNTY_CHUNK) {
    const slice = bountyIds.slice(i0, i0 + BOUNTY_CHUNK);
    const bountyValues: string[] = [];
    const bountyParams: unknown[] = [];
    let p = 1;
    for (const bid of slice) {
      bountyValues.push(
        `($${p++}, $${p++}, $${p++}, $${p++}, 'sd', 'fi', 'cat', 'CASH'::"RewardType", 'er', 'pr', 'DRAFT'::"BountyStatus", NOW(), 10000, 'PAID'::"PaymentStatus")`,
      );
      bountyParams.push(bid, brandId, userId, `Bench Bounty ${bid}`);
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO bounties (id, "organisationId", "createdById", title, "shortDescription", "fullInstructions", category, "rewardType", "eligibilityRules", "proofRequirements", status, "updatedAt", "faceValueCents", "paymentStatus")
       VALUES ${bountyValues.join(', ')}
       ON CONFLICT (id) DO NOTHING`,
      ...bountyParams,
    );
  }

  // Plan groups.
  // We'll generate groups until we've produced ~nEntries entries.
  // avg legs per group ~ 3.5 → groupsTarget = ceil(nEntries / 3.5)
  const groupsTarget = Math.max(3, Math.ceil(nEntries / 3.5));
  const legCounts: number[] = [];
  let entriesSoFar = 0;
  for (let g = 0; g < groupsTarget && entriesSoFar < nEntries; g++) {
    const legs = 2 + Math.floor(rng() * 5); // 2..6
    legCounts.push(legs);
    entriesSoFar += legs;
  }
  const actualGroups = legCounts.length;

  // Choose which groups get a brand_reserve credit pinned to a paid bounty.
  // Pattern: the FIRST group for each bounty plants a +faceValue credit, so
  // reserveBalance == faceValueCents (healthy state, triggers NO finding).
  // This exercises the reserve-check loop without polluting findings.
  const reserveGroupIndex = new Set<number>();
  for (let i = 0; i < Math.min(nBounties, actualGroups); i++) {
    reserveGroupIndex.add(i);
  }

  // Reserved identifiers for the injected faults.
  const unbalancedGroupId = 'bench-group-UNBAL';
  const dupRefId = 'bench-dup-ref';
  const dupActionType = 'BENCH_DUP';

  // Bulk insert groups. Split into chunks of 500 to keep statement size sane.
  const CHUNK = 500;
  let groupId = 0;

  async function insertGroupChunk(
    groups: { id: string; referenceId: string; actionType: string; description: string }[],
  ) {
    if (!groups.length) return;
    const values: string[] = [];
    const params: unknown[] = [];
    let pi = 1;
    for (const g of groups) {
      values.push(`($${pi++}, $${pi++}, $${pi++}, $${pi++})`);
      params.push(g.id, g.referenceId, g.actionType, g.description);
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO ledger_transaction_groups (id, "referenceId", "actionType", description)
       VALUES ${values.join(', ')}
       ON CONFLICT ("referenceId", "actionType") DO NOTHING`,
      ...params,
    );
  }

  async function insertEntryChunk(
    entries: {
      transactionGroupId: string;
      bountyId: string | null;
      account: LedgerAccount;
      type: LedgerEntryType;
      amount: bigint;
      referenceId: string;
      actionType: string;
    }[],
  ) {
    if (!entries.length) return;
    const values: string[] = [];
    const params: unknown[] = [];
    let pi = 1;
    for (const e of entries) {
      values.push(
        `(gen_random_uuid()::text, $${pi++}, $${pi++}, $${pi++}::"LedgerAccount", $${pi++}::"LedgerEntryType", $${pi++}::bigint, 'ZAR'::"Currency", 'COMPLETED'::"LedgerEntryStatus", $${pi++}, 'BenchRef', $${pi++}, 'bench')`,
      );
      params.push(
        e.transactionGroupId,
        e.bountyId,
        e.account,
        e.type,
        e.amount.toString(),
        e.referenceId,
        e.actionType,
      );
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO ledger_entries (
         id, "transactionGroupId", "bountyId", account, type, amount, currency, status, "referenceId", "referenceType", "actionType", "postedBy"
       ) VALUES ${values.join(', ')}`,
      ...params,
    );
  }

  // ---- Seed balanced groups -----------------------------------------------
  const pendingGroups: { id: string; referenceId: string; actionType: string; description: string }[] = [];
  const pendingEntries: {
    transactionGroupId: string;
    bountyId: string | null;
    account: LedgerAccount;
    type: LedgerEntryType;
    amount: bigint;
    referenceId: string;
    actionType: string;
  }[] = [];

  const FACE = BigInt(10_000);
  for (let g = 0; g < actualGroups; g++) {
    const legs = legCounts[g];
    const id = `bench-grp-${String(groupId++).padStart(8, '0')}`;
    const refId = `bench-ref-${id}`;
    const actionType = 'BENCH_FUND';
    pendingGroups.push({ id, referenceId: refId, actionType, description: `bench group ${g}` });

    // Generate `legs` amounts, half DEBIT half CREDIT, balanced.
    const halfLegs = Math.floor(legs / 2);
    const debitLegs = Math.max(1, halfLegs);
    const creditLegs = legs - debitLegs;

    const attachBountyIdx = reserveGroupIndex.has(g) ? g % bountyIds.length : -1;

    // For reserve-pinning groups we want exactly ONE credit leg equal to FACE
    // on the brand_reserve account, and the rest of the group to balance on
    // top. Strategy:
    //   - pick a random `extra` in [0, 90_000]
    //   - total = FACE + extra
    //   - credits = [FACE, ...split(extra, creditLegs-1)]   (sums to total)
    //   - debits = split(total, debitLegs)                  (sums to total)
    // For non-reserve groups we just pick a random total and split both sides.
    let total: bigint;
    let creditAmounts: bigint[];
    if (attachBountyIdx >= 0) {
      const extra = BigInt(Math.floor(rng() * 90_000));
      total = FACE + extra;
      const rest =
        creditLegs > 1 ? splitAmount(extra, creditLegs - 1, rng) : [];
      // If creditLegs === 1 and extra > 0, we'd drop `extra` cents and
      // unbalance the group; force creditLegs=1 ⇒ total=FACE to keep it clean.
      if (creditLegs === 1) {
        total = FACE;
      }
      creditAmounts = [FACE, ...rest];
    } else {
      total = BigInt(10_000 + Math.floor(rng() * 90_000));
      creditAmounts = splitAmount(total, creditLegs, rng);
    }
    const debitAmounts = splitAmount(total, debitLegs, rng);

    for (let k = 0; k < debitLegs; k++) {
      pendingEntries.push({
        transactionGroupId: id,
        bountyId: null,
        account: ACCOUNTS[Math.floor(rng() * ACCOUNTS.length)],
        type: 'DEBIT' as LedgerEntryType,
        amount: debitAmounts[k],
        referenceId: refId,
        actionType,
      });
    }
    for (let k = 0; k < creditLegs; k++) {
      const isReserveLeg = attachBountyIdx >= 0 && k === 0;
      pendingEntries.push({
        transactionGroupId: id,
        bountyId: isReserveLeg ? bountyIds[attachBountyIdx] : null,
        account: isReserveLeg
          ? ('brand_reserve' as LedgerAccount)
          : ACCOUNTS[Math.floor(rng() * ACCOUNTS.length)],
        type: 'CREDIT' as LedgerEntryType,
        amount: creditAmounts[k],
        referenceId: refId,
        actionType,
      });
    }

    // Flush groups first, then entries, so entries never reference a group
    // that hasn't been inserted yet (FK violation).
    if (pendingGroups.length >= CHUNK || pendingEntries.length >= CHUNK * 2) {
      if (pendingGroups.length) {
        await insertGroupChunk(pendingGroups.splice(0, pendingGroups.length));
      }
      if (pendingEntries.length) {
        await insertEntryChunk(pendingEntries.splice(0, pendingEntries.length));
      }
    }
  }

  // ---- Inject ONE unbalanced group ----------------------------------------
  pendingGroups.push({
    id: unbalancedGroupId,
    referenceId: 'bench-ref-UNBAL',
    actionType: 'BENCH_FUND_UNBAL',
    description: 'bench unbalanced group',
  });
  pendingEntries.push({
    transactionGroupId: unbalancedGroupId,
    bountyId: null,
    account: 'brand_cash_received' as LedgerAccount,
    type: 'DEBIT' as LedgerEntryType,
    amount: 10000n,
    referenceId: 'bench-ref-UNBAL',
    actionType: 'BENCH_FUND_UNBAL',
  });
  pendingEntries.push({
    transactionGroupId: unbalancedGroupId,
    bountyId: null,
    account: 'gateway_clearing' as LedgerAccount,
    type: 'CREDIT' as LedgerEntryType,
    amount: 9999n, // off-by-one cent — critical finding expected
    referenceId: 'bench-ref-UNBAL',
    actionType: 'BENCH_FUND_UNBAL',
  });

  // ---- Inject ONE duplicate group (same referenceId+actionType) -----------
  // The unique index would reject the second one, so we write via a RAW insert
  // that bypasses the unique constraint. We DROP the index, insert, re-ADD it
  // with WHERE clause off (no — we need the duplicate to persist). Cleaner:
  // temporarily drop and recreate WITHOUT a unique constraint.
  // Simpler: insert via a different referenceId for normal groups, then
  // bypass the constraint for the dup pair by disabling the index.
  pendingGroups.push({
    id: 'bench-dup-A',
    referenceId: dupRefId,
    actionType: dupActionType,
    description: 'bench dup A',
  });
  pendingEntries.push({
    transactionGroupId: 'bench-dup-A',
    bountyId: null,
    account: 'brand_cash_received' as LedgerAccount,
    type: 'DEBIT' as LedgerEntryType,
    amount: 100n,
    referenceId: dupRefId,
    actionType: dupActionType,
  });
  pendingEntries.push({
    transactionGroupId: 'bench-dup-A',
    bountyId: null,
    account: 'gateway_clearing' as LedgerAccount,
    type: 'CREDIT' as LedgerEntryType,
    amount: 100n,
    referenceId: dupRefId,
    actionType: dupActionType,
  });

  await insertGroupChunk(pendingGroups.splice(0, pendingGroups.length));
  await insertEntryChunk(pendingEntries.splice(0, pendingEntries.length));

  // Write the duplicate directly via raw SQL, bypassing the unique index
  // temporarily (drop → insert → recreate NOT UNIQUE? — no; we want to KEEP
  // the unique index in prod). We drop, insert, and leave the index dropped
  // for the duration of the run; the check uses GROUP BY and doesn't need it.
  // In `db push`-generated schemas the uniqueness is backed by a plain UNIQUE
  // INDEX (not a CONSTRAINT). Drop whichever exists so the dup insert below
  // can land. We do NOT recreate it — the duplicate-groups check uses GROUP BY
  // and doesn't need the index.
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ledger_transaction_groups DROP CONSTRAINT IF EXISTS "ledger_transaction_groups_referenceId_actionType_key"`,
  );
  await prisma.$executeRawUnsafe(
    `DROP INDEX IF EXISTS "ledger_transaction_groups_referenceId_actionType_key"`,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO ledger_transaction_groups (id, "referenceId", "actionType", description)
     VALUES ('bench-dup-B', $1, $2, 'bench dup B')`,
    dupRefId,
    dupActionType,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO ledger_entries (id, "transactionGroupId", account, type, amount, currency, status, "referenceId", "referenceType", "actionType", "postedBy")
     VALUES (gen_random_uuid()::text, 'bench-dup-B', 'brand_cash_received'::"LedgerAccount", 'DEBIT'::"LedgerEntryType", 50::bigint, 'ZAR'::"Currency", 'COMPLETED'::"LedgerEntryStatus", $1, 'BenchRef', $2, 'bench'),
            (gen_random_uuid()::text, 'bench-dup-B', 'gateway_clearing'::"LedgerAccount", 'CREDIT'::"LedgerEntryType", 50::bigint, 'ZAR'::"Currency", 'COMPLETED'::"LedgerEntryStatus", $1, 'BenchRef', $2, 'bench')`,
    dupRefId,
    dupActionType,
  );

  // ANALYZE so the query planner has stats.
  await prisma.$executeRawUnsafe(`ANALYZE ledger_entries`);
  await prisma.$executeRawUnsafe(`ANALYZE ledger_transaction_groups`);
  await prisma.$executeRawUnsafe(`ANALYZE bounties`);

  const wallTimeMs = performance.now() - started;

  // Count what we actually wrote.
  const [{ count: entriesCount }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM ledger_entries
  `;
  const [{ count: groupsCount }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM ledger_transaction_groups
  `;

  return {
    groups: Number(groupsCount),
    entries: Number(entriesCount),
    paidBounties: nBounties,
    unbalancedGroupId,
    duplicatePair: { referenceId: dupRefId, actionType: dupActionType },
    wallTimeMs,
  };
}

/**
 * Split `total` into `parts` non-negative bigint pieces that sum to `total`.
 * Last piece absorbs the remainder so no rounding loss.
 */
function splitAmount(total: bigint, parts: number, rng: () => number): bigint[] {
  if (parts <= 0) return [];
  if (parts === 1) return [total];
  const out: bigint[] = [];
  let remaining = total;
  for (let i = 0; i < parts - 1; i++) {
    // piece is a random share of the current remaining, bounded so last piece ≥ 0.
    const max = remaining - BigInt(parts - 1 - i);
    const piece = max > 0n ? BigInt(Math.floor(rng() * Number(max < 10_000_000n ? max : 10_000_000n))) : 0n;
    out.push(piece);
    remaining -= piece;
  }
  out.push(remaining);
  return out;
}

// ---------------------------------------------------------------------------
// Benchmark harness
// ---------------------------------------------------------------------------

export interface BenchResult {
  n: number;
  seedResult: SeedResult;
  pgVersion: string;
  nodeVersion: string;
  hostPlatform: string;
  timings: {
    checkGroupBalanceMs: number;
    checkDuplicateGroupsMs: number;
    checkReserveVsBountyMs: number;
    endToEndRunMs: number;
  };
  findings: {
    total: number;
    byCategory: Record<string, number>;
    unbalancedDetected: boolean;
    duplicateDetected: boolean;
  };
}

/**
 * Runs the three Phase-1 checks individually on `service`, then the full
 * `run()` end-to-end, capturing wall-clock for each.
 */
async function runBench(
  service: ReconciliationService,
  n: number,
  seedResult: SeedResult,
  prisma: PrismaClient,
): Promise<BenchResult> {
  // Per-check timing (via the private methods — reachable via `any` cast).
  const anySvc = service as any;

  const t1 = performance.now();
  const groupBalanceFindings: any[] = await anySvc.checkGroupBalance();
  const checkGroupBalanceMs = performance.now() - t1;

  const t2 = performance.now();
  const dupFindings: any[] = await anySvc.checkDuplicateGroups();
  const checkDuplicateGroupsMs = performance.now() - t2;

  const t3 = performance.now();
  const reserveFindings: any[] = await anySvc.checkReserveVsBounty();
  const checkReserveVsBountyMs = performance.now() - t3;

  // End-to-end run() — this also persists findings, so we TRUNCATE findings
  // afterwards to not corrupt the count if we re-run.
  const t4 = performance.now();
  const report = await service.run();
  const endToEndRunMs = performance.now() - t4;

  const byCategory: Record<string, number> = {};
  for (const f of report.findings) {
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
  }

  const unbalancedDetected = groupBalanceFindings.some(
    (f) => f.detail?.transactionGroupId === seedResult.unbalancedGroupId,
  );
  const duplicateDetected = dupFindings.some(
    (f) =>
      f.detail?.referenceId === seedResult.duplicatePair.referenceId &&
      f.detail?.actionType === seedResult.duplicatePair.actionType,
  );

  const pgVersion = await detectPgVersion(prisma);

  return {
    n,
    seedResult,
    pgVersion,
    nodeVersion: process.version,
    hostPlatform: `${process.platform} ${process.arch}`,
    timings: {
      checkGroupBalanceMs,
      checkDuplicateGroupsMs,
      checkReserveVsBountyMs,
      endToEndRunMs,
    },
    findings: {
      total: report.findings.length,
      byCategory,
      unbalancedDetected,
      duplicateDetected,
    },
  };
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatTable(r: BenchResult): string {
  const pad = (s: string, w: number) => s.padEnd(w);
  const fmt = (ms: number) => `${ms.toFixed(1)} ms`;
  const lines: string[] = [];
  lines.push(`── Reconciliation Benchmark ── N=${r.n}`);
  lines.push(`Host      : ${r.hostPlatform}`);
  lines.push(`Node      : ${r.nodeVersion}`);
  lines.push(`Postgres  : ${r.pgVersion.split(' on ')[0]}`);
  lines.push(
    `Seeded    : ${r.seedResult.entries} entries across ${r.seedResult.groups} groups (${r.seedResult.paidBounties} paid bounties) in ${r.seedResult.wallTimeMs.toFixed(0)} ms`,
  );
  lines.push('');
  lines.push(`${pad('Check', 30)} ${pad('Wall time', 14)}`);
  lines.push(`${pad('-----', 30)} ${pad('---------', 14)}`);
  lines.push(`${pad('checkGroupBalance', 30)} ${pad(fmt(r.timings.checkGroupBalanceMs), 14)}`);
  lines.push(`${pad('checkDuplicateGroups', 30)} ${pad(fmt(r.timings.checkDuplicateGroupsMs), 14)}`);
  lines.push(`${pad('checkReserveVsBounty', 30)} ${pad(fmt(r.timings.checkReserveVsBountyMs), 14)}`);
  lines.push(`${pad('run() end-to-end', 30)} ${pad(fmt(r.timings.endToEndRunMs), 14)}`);
  lines.push('');
  lines.push(`Findings  : ${r.findings.total} (${JSON.stringify(r.findings.byCategory)})`);
  lines.push(`Unbalanced detected : ${r.findings.unbalancedDetected ? 'YES' : 'NO'}`);
  lines.push(`Duplicate detected  : ${r.findings.duplicateDetected ? 'YES' : 'NO'}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main(args: CliArgs): Promise<BenchResult> {
  const db = buildBenchDbConfig(args.dbName);
  // eslint-disable-next-line no-console
  console.log(`[bench] creating throwaway DB ${db.name} on ${db.pgHost}:${db.pgPort}`);
  createBenchDb(db);

  let benchResult: BenchResult | null = null;
  let prisma: PrismaClient | null = null;

  try {
    // eslint-disable-next-line no-console
    console.log('[bench] applying prisma migrations...');
    applyMigrations(db);

    prisma = new PrismaClient({ datasourceUrl: db.url });
    await prisma.$connect();

    // eslint-disable-next-line no-console
    console.log(`[bench] seeding ~${args.n} ledger entries...`);
    const seedResult = await seedLedger({ prisma, nEntries: args.n, seed: 0x5b0bb1e });
    // eslint-disable-next-line no-console
    console.log(
      `[bench] seeded ${seedResult.entries} entries / ${seedResult.groups} groups in ${seedResult.wallTimeMs.toFixed(0)} ms`,
    );

    const ledger = new LedgerService(prisma as any);
    // kb stub: reconciliation calls recordRecurrence({...}); we no-op so we
    // don't pollute findings & to keep the persistFindings loop measuring only
    // application-side overhead.
    const kbStub = {
      recordRecurrence: async () => ({ isNew: true, issue: { id: 'noop', occurrences: 1 } }),
    };
    const service = new ReconciliationService(prisma as any, ledger, kbStub as any);

    // eslint-disable-next-line no-console
    console.log('[bench] running reconciliation...');
    benchResult = await runBench(service, args.n, seedResult, prisma);

    // Emit output
    if (args.output === 'table' || args.output === 'both') {
      // eslint-disable-next-line no-console
      console.log('\n' + formatTable(benchResult));
    }
    if (args.output === 'json' || args.output === 'both') {
      // eslint-disable-next-line no-console
      console.log('\n[bench] JSON:');
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(benchResult, bigintReplacer, 2));
    }
    if (args.reportPath) {
      fs.writeFileSync(args.reportPath, JSON.stringify(benchResult, bigintReplacer, 2));
      // eslint-disable-next-line no-console
      console.log(`[bench] wrote ${args.reportPath}`);
    }

    return benchResult;
  } finally {
    if (prisma) await prisma.$disconnect().catch(() => undefined);
    if (!args.keepDb) {
      try {
        dropBenchDb(db);
        // eslint-disable-next-line no-console
        console.log(`[bench] dropped ${db.name}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[bench] failed to drop ${db.name}: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[bench] --keep-db set; retained ${db.name}`);
    }
  }
}

function bigintReplacer(_k: string, v: unknown): unknown {
  return typeof v === 'bigint' ? v.toString() : v;
}

// Only run when invoked directly (not when imported from the .spec file).
if (require.main === module) {
  (async () => {
    try {
      const args = parseArgs(process.argv.slice(2));
      await main(args);
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[bench] FAILED: ${err instanceof Error ? err.stack : err}`);
      process.exit(1);
    }
  })();
}
