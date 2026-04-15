# Reconciliation Engine Performance Benchmarks — 2026-04-15

**Author**: QA/Performance agent (batch 10 task C)
**Tooling**: `scripts/bench-reconciliation.ts` (reproducible, throwaway DB)
**Target service**: `apps/api/src/modules/reconciliation/reconciliation.service.ts`
**Scope**: Phase-1 subset — the three checks currently implemented. `claude.md`
claims "7 checks"; today only three exist (`checkGroupBalance`,
`checkDuplicateGroups`, `checkReserveVsBounty`). The remaining four are gated
behind later phases and are flagged in §7 below so this benchmark can be
re-run as they land.

---

## 1. Hardware & software

| Component | Value |
| --- | --- |
| Host | Apple Silicon, `darwin arm64` (macOS 25.4) |
| Node | v24.4.1 |
| Postgres | 16.9 (Homebrew build, local cluster) |
| Prisma | 6.19.3 (libquery_engine-darwin-arm64) |
| DB mode | Throwaway DB per run (`recon_bench_<ts>`), dropped after the run |
| Schema | Applied via `prisma db push` from `packages/prisma/schema.prisma` |

The benchmark instantiates the **real** `ReconciliationService` +
`LedgerService` (no mocks) and drives them against fresh seed data. The KB
write path is stubbed to a no-op so we measure pure reconciliation latency
without also benchmarking `KbService.recordRecurrence`.

---

## 2. Seed profile

For each N, the script:

1. Creates `ceil(N / 3.5)` balanced double-entry groups (2–6 legs each),
   `amount ∈ [10 000, 100 000]` cents, random accounts from the 17-value
   `LedgerAccount` enum.
2. Pins `min(N/100, 10 000)` groups to a paid bounty with a
   `brand_reserve` credit of exactly `faceValueCents = 10 000` so the
   reserve check has real work (reserveBalance == face ⇒ healthy).
3. Injects **exactly one** unbalanced group (10 000 debit vs 9 999 credit)
   and **exactly one** duplicate `(referenceId, actionType)` pair, so we
   verify the checks still fire at scale.

All seed writes are bulk `INSERT ... VALUES` statements with `ANALYZE` at
the end so the query planner has stats.

---

## 3. Results — primary series (paid bounties scaled at 1 % of N)

All timings are wall-clock in milliseconds, captured via
`performance.now()`. End-to-end includes the three checks, kill-switch
handling, and the persistence loop.

| N (ledger entries) | Groups | Paid bounties | `checkGroupBalance` | `checkDuplicateGroups` | `checkReserveVsBounty` | `run()` end-to-end | Seed time |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 30 | 1 | 0.8 | 0.3 | 2.8 | 4.6 | 13 ms |
| 1 000 | 256 | 10 | 0.8 | 0.4 | 9.5 | 8.8 | 32 ms |
| 10 000 | 2 510 | 100 | 1.8 | 0.6 | 42.2 | 40.6 | 197 ms |
| 100 000 | 25 027 | 1 000 | 16.5 | 4.5 | 349.3 | 345.0 | 1 651 ms |

*(Raw JSON dumps: `/tmp/bench-1k.json`, `/tmp/bench-10k.json`,
`/tmp/bench-100k.json` on the runner host; regenerate any time via
`npm run bench:recon:run -- --n <N> --report ./out.json`.)*

### 3.1 Stress run — decoupling reserve-check from N

The reserve check's runtime scales with the number of **paid bounties**
(`B`), not with N directly. To isolate that dimension we re-ran N=100 000
with `BENCH_PAID_BOUNTIES=10 000`:

| N | Paid bounties | `checkReserveVsBounty` | `run()` end-to-end |
| ---: | ---: | ---: | ---: |
| 100 000 | 1 000 | 349 ms | 345 ms |
| 100 000 | 10 000 | **3 212 ms** | 3 187 ms |

That's a 9.2× jump for a 10× bounty increase — clean O(B) behaviour,
which matches the source: `checkReserveVsBounty` loops over every paid
bounty and issues **two** aggregate queries per iteration (debit sum +
credit sum).

---

## 4. Big-O observations

| Check | Observed complexity | Notes |
| --- | --- | --- |
| `checkGroupBalance` | O(N) in the DB, ~linear | Single `GROUP BY transactionGroupId` over `ledger_entries`. Postgres executes this as one sort or hash-aggregate; 100 k rows in 16 ms. Scales well. |
| `checkDuplicateGroups` | O(G) | Single `GROUP BY` over `ledger_transaction_groups`. At 25 k groups, 4.5 ms. Trivial. |
| `checkReserveVsBounty` | **O(B) with 2 round-trips per bounty** | Source loops `for (const b of bounties) { prisma.ledgerEntry.aggregate(...) × 2 }`. Each iteration is a network round trip + a filtered aggregate. This is the dominant cost and the only check with a structural issue. |
| `run()` end-to-end | Sum of above, dominated by reserve check | Within 5 % of `checkReserveVsBounty` at every N. |

---

## 5. Red flags

### 5.1 `checkReserveVsBounty` — chatty N+1 aggregation (HIGH)

**Smell**: every paid bounty costs two separate `prisma.ledgerEntry.aggregate`
calls. That's 2 × B round-trips between Node and Postgres per reconciliation
run.

**Evidence**: at B = 10 000 the check takes 3.21 s — entirely on two sequential
aggregate calls per bounty, each of which hits `ledger_entries` via the
`ledger_entries_bountyId_idx` index but pays a full round-trip anyway.

**Impact today**: with ≤ 1 000 paid bounties on the platform (where we are
pre-launch), the check runs in ~350 ms. Plenty of headroom against the
15-minute scheduler cadence.

**Impact at scale**: at the Phase-2 capacity target of ~20 000 paid bounties
(see `md-files/implementation-phases.md` §Phase 2), the check projects to
~6.4 s — still fine for a 15 min cron, but it's a regression waiting to
happen if the bounty count or clearance window grows.

**Mitigation (NOT applied in this batch — documentation only)**: rewrite the
loop as a **single** `GROUP BY bountyId` query joined against
`bounties.faceValueCents`, e.g.

```sql
SELECT b.id,
       b."faceValueCents",
       COALESCE(SUM(CASE WHEN le.type='CREDIT' THEN le.amount ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN le.type='DEBIT'  THEN le.amount ELSE 0 END), 0)
         AS reserve_balance
  FROM bounties b
  LEFT JOIN ledger_entries le
    ON le."bountyId" = b.id
   AND le.account   = 'brand_reserve'::"LedgerAccount"
   AND le.status    = 'COMPLETED'::"LedgerEntryStatus"
 WHERE b."paymentStatus" = 'PAID'
   AND b."faceValueCents" IS NOT NULL
 GROUP BY b.id, b."faceValueCents"
HAVING (reserve_balance) NOT IN (0, b."faceValueCents")
```

…which collapses 2 × B round-trips into one, and is trivially indexable
via the existing `ledger_entries_bountyId_idx` + `bounties_paymentStatus_idx`.
Expected drop: from 3.2 s → < 200 ms at B = 10 000.

This is a structural fix (per `claude.md` §2 "if an issue recurs, treat it
as a structural flaw, not a bug"). Routing through Agent Team Lead as a
separate batch when reconciliation touches come up again.

### 5.2 No other red flags

None of the three checks exceeded 30 s at any tested scale. Group-balance
and duplicate-groups both stayed well under 20 ms up to 100 k entries.

---

## 6. Recommendation — is the 15-minute cadence safe?

**Yes, at current scale and well beyond.**

The 15-minute cron interval is the key constraint: each run must finish
before the next tick fires. The hard cap is 15 min = 900 s.

Extrapolating the primary series (reserve-check dominated, 1 % of N as paid
bounties):

| N | Projected `run()` | Safety margin |
| ---: | ---: | --- |
| 100 000 | 0.35 s | 2 570 × |
| 1 000 000 | ~3.5 s | 257 × |
| 10 000 000 | ~35 s | 26 × |
| ~250 000 000 | ~900 s | **break-even** |

Extrapolating the stress series (reserve-check O(B), B grows linearly with
the platform):

| Paid bounties (B) | Projected reserve-check | Projected `run()` | Safe for 15-min cron? |
| ---: | ---: | ---: | --- |
| 1 000 | 0.35 s | 0.35 s | Yes, 2 570 × |
| 10 000 | 3.2 s | ~3.2 s | Yes, 280 × |
| 100 000 | ~32 s | ~32 s | Yes, 28 × |
| 1 000 000 | ~320 s | ~320 s | Yes, 2.8 × — **warning zone** |
| ~2 800 000 | ~900 s | ~900 s | **break-even** |

So the **current 15-minute cadence is safe until the platform reaches
~100 000 paid bounties** (with headroom narrowing from there). Apply the
§5.1 mitigation (single GROUP BY) long before we hit that — the fix is
cheap and buys roughly another 20 × of headroom.

There is **no need** to shorten the cron interval today. There is **no
need** to partition the sweep today. The one structural risk
(reserve-check N+1) is captured and ready to land as its own batch.

---

## 7. What this benchmark does NOT cover

The spec and `claude.md` both reference a 7-check reconciliation engine. As
of 2026-04-15 only three are in code. The other four will need bench
coverage when they land:

1. `missingLegs` — orphan `LedgerEntry` rows whose transaction group is
   incomplete.
2. `statusConsistency` — cross-table drift between `Bounty.paymentStatus`
   and the ledger.
3. `walletProjectionDrift` — `Wallet.balanceCents` vs the ledger's derived
   balance.
4. `stitchVsLedger` — `StitchPayment`, `StitchPayout` state mismatch vs the
   ledger.

The benchmark harness is **already scoped to discover new checks**: to
measure them, expose them as public methods on `ReconciliationService` and
add their timer to `runBench` in `scripts/bench-reconciliation.ts`.

---

## 8. Reproducibility

```bash
# prerequisite: local postgres cluster reachable at $USER@localhost:5432
# with the current shell user holding CREATEDB

# one-shot
npm run bench:recon:run -- --n 1000
npm run bench:recon:run -- --n 10000
npm run bench:recon:run -- --n 100000

# CI guard (N=1000, fails if any check exceeds baseline × 3)
npm run bench:recon

# stress the reserve-check independently
BENCH_PAID_BOUNTIES=10000 npm run bench:recon:run -- --n 100000
```

Every run creates and drops its own `recon_bench_<epoch_ms>` database on
the superuser's cluster (default db: `postgres`). The real dev DB
(`social_bounty`) and Supabase prod are **never touched**.

---

## 9. Production code changes in this batch

**None.** The reconciliation service, ledger service, Prisma schema, and
migrations were not modified. The mitigation in §5.1 is documentation only
— routing through Agent Team Lead as a separate batch in line with
`claude.md` §3.
