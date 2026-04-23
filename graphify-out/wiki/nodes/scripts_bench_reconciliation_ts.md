# `scripts/bench-reconciliation.ts`

> Standalone benchmark proving the reconciliation engine scales linearly up to ~1M paid bounties.

## What it does

`scripts/bench-reconciliation.ts` is a node CLI that seeds a synthetic dataset into Postgres (parameterised N via `BENCH_N=100000 npx tsx scripts/bench-reconciliation.ts`), runs `ReconciliationService.run()`, and prints the per-check timing breakdown for the 7 checks (group-balance, duplicate-detection, missing-legs, status-consistency, wallet-projection-drift, Stitch-vs-ledger, reserve-vs-bounty). Output goes to stdout and is also captured into `docs/perf/2026-04-15-reconciliation-benchmarks.md` as the canonical perf evidence. The reserve-check was the hot path — per-bounty `aggregate()` queries were 184×–494× slower than the single GROUP BY — and this bench is where that regression was spotted and fixed.

## Why it exists

The reconciliation engine is the platform's integrity backstop — it runs every 15 minutes and surfaces any drift between Stitch-reported funds and the internal ledger. If the engine took 10 minutes to run, the 15-minute cadence would collapse. This bench was the load test that proved the engine safe to ~1M paid bounties (the rough upper envelope for the MVP's first year). The file is the reference implementation for benchmarking any other reconciliation-adjacent component — a model for how to seed data deterministically and time individual check paths. Part of the Phase 2 delivery per `md-files/implementation-phases.md`.

## How it connects

- **`ReconciliationService.run()`** — the bench's main subject; called directly via a NestJS standalone app bootstrap.
- **`ReconciliationService`** — the class under test.
- **`PrismaService`** — the seed path writes bounties, submissions, ledger entries directly via Prisma.
- **`LedgerService.postTransactionGroup`** — the seed helper uses this to generate realistic ledger groups rather than hand-crafted rows.
- **`kb-context.ts`** — sibling script under `scripts/`; similar CLI pattern.
- **`docs/perf/2026-04-15-reconciliation-benchmarks.md`** — the output consumer; mitigation evidence for the reserve-check perf fix.
- **`bench-reconciliation.ts` → `reconciliation.service.spec.ts`** — the bench complements the unit-test suite.

---
**degree:** 17 • **community:** "Reconciliation engine" (ID 18) • **source:** `scripts/bench-reconciliation.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the bench is a script, not a test — it doesn't run in CI (N=100k is too slow). A tiered variant (BENCH_N=1000 in CI, BENCH_N=1M on-demand) would catch perf regressions earlier. Currently regressions surface only when a human runs the bench after a reconciliation change.
