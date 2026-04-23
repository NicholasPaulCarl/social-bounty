# `ReconciliationService`

> The platform's integrity backstop — runs 7 checks on a 15-minute cadence, flags recurrences to KB, may trip the kill switch.

## What it does

`ReconciliationService.run()` is the periodic reconciliation driver. It runs 7 independent checks: (1) **group balance** — debit sum equals credit sum per `LedgerTransactionGroup`; (2) **duplicate detection** — no two groups with the same `(referenceId, actionType)` (complementing the DB `UNIQUE` constraint); (3) **missing legs** — groups with fewer legs than their `actionType` archetype expects; (4) **status consistency** — `Bounty.paymentStatus` / `Submission.payoutStatus` align with the latest ledger entries; (5) **wallet-projection drift** — `Wallet.availableCents` matches the sum of un-reserved ledger legs; (6) **Stitch-vs-ledger (renamed `payouts-vs-ledger` 2026-04-18)** — payouts reported by providers (Stitch + TradeSafe, union by `StitchPayout.provider`) match what the ledger says; (7) **reserve-vs-bounty** — `Bounty.reservedCents` per brand matches the sum of reserved ledger legs. Each finding is emitted as a `ReconciliationFinding { category, signature, system, errorCode, severity, title, detail }`. Critical findings route through `KbService.recordRecurrence` and may activate the kill switch via `LedgerService.setKillSwitch`.

## Why it exists

This service is the living proof of the platform's financial integrity promise. The 15-minute cadence is the SLA: any drift between Stitch and the internal ledger is detected within 15 minutes, not days. The reserve-check perf fix (commit, 184×–494× speedup via single `GROUP BY` replacing per-bounty aggregate) is what made the 15-minute cadence safe to ~1M paid bounties. Each of the 7 checks has fault-injection coverage in the test suite — 5-test matrix per handler per `claude.md` §5. The KB recurrence integration means the same signature seen twice within 90 days is automatically flagged for structural fix (charter §2 core principle: "If an issue recurs, treat it as a structural flaw, not a bug.").

## How it connects

- **`.run()` method (degree 14)** — the entry point; the per-tick executor.
- **`reconciliation.service.ts`** — source file; `contains` edge.
- **`.constructor()`** — DI-time wiring of PrismaService + LedgerService + optional KbService + optional ConfigService.
- **`.checkReserveVsBounty()` method** — the perf-sensitive check; single GROUP BY after the optimization.
- **`.checkGroupBalance()` method** — the core double-entry invariant check.
- **`.systemActorId()`** — reads `STITCH_SYSTEM_ACTOR_ID` from env so ledger writes (kill-switch flip) get a valid `actorId` FK.
- **`LedgerService.setKillSwitch`** — invoked when the service detects a critical finding and must pause payouts.
- **`KbService.recordRecurrence`** — called to log every finding; deduplicates by `(category, system, errorCode)` signature.
- **`ReconciliationScheduler`** (sibling) — the `@Cron(EVERY_15_MINUTES)` wrapper that calls `.run()`.
- **`bench-reconciliation.ts`** — the perf bench proving the reserve-check optimization.

---
**degree:** 17 • **community:** "Reconciliation engine" (ID 18) • **source:** `apps/api/src/modules/reconciliation/reconciliation.service.ts`
**last touched:** 4 days ago • **commits (90d):** 4 • **commits (total):** 4

> **Architectural note:** the check list is ordered by cost — cheap checks (group balance) run first, expensive ones (reserve-vs-bounty, Stitch-vs-ledger) run last. If a cheap check finds a critical issue that trips the kill switch, subsequent expensive checks can skip. This is load-bearing for the 15-minute SLA in the worst case.
