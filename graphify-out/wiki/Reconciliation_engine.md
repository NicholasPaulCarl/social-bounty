# Reconciliation engine

> 31 nodes · cohesion 0.12

## Key Concepts

- **ReconciliationService** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **bench-reconciliation.ts** (17 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **.run()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **main()** (11 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **runBench()** (7 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **seedLedger()** (5 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **.checkReserveVsBounty()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **applyMigrations()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **createBenchDb()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **dropBenchDb()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **formatTable()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **printHelp()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **psql()** (3 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **.checkDuplicateGroups()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.checkGroupBalance()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.checkWalletProjectionDrift()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.persistFindings()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.systemActorId()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **bigintReplacer()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **buildBenchDbConfig()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **detectPgVersion()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **mulberry32()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **parseArgs()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **splitAmount()** (2 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **LedgerTransactionGroup header idempotency** (2 connections) — `docs/adr/0005-ledger-idempotency-via-header-table.md`
- *... and 6 more nodes in this community*

## Relationships

- [[API service layer]] (18 shared connections)
- [[Webhook handlers & triggers]] (2 shared connections)
- [[Controllers & RBAC guards]] (1 shared connections)
- [[Wallet service]] (1 shared connections)
- [[Project charter & ADRs]] (1 shared connections)
- [[Bounty service & tests]] (1 shared connections)
- [[Finance admin dashboard]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.spec.ts`
- `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- `docs/adr/0005-ledger-idempotency-via-header-table.md`
- `docs/perf/2026-04-15-reconciliation-benchmarks.md`

## Audit Trail

- EXTRACTED: 101 (76%)
- INFERRED: 32 (24%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*