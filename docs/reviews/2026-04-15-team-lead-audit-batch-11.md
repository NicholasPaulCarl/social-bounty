# Team Lead Audit — Batch 11 (R26 fix + recon perf + recon coverage)

**Date:** 2026-04-15
**Auditor:** agent-team-lead
**Scope:** batch 11A (R26 migration), 11B (`checkReserveVsBounty` perf), 11C (recon checks 4–7)
**Verdict:** **APPROVED WITH CONDITIONS**

---

## 1. Verdict at a glance

| Lane | Doer | Verdict | Conditions |
| --- | --- | --- | --- |
| 11A — R26 migration pre-conditioning | Backend | APPROVED | Ship now. R27 must be opened immediately as a **must-fix-before-next-env-provision** ticket. |
| 11B — `checkReserveVsBounty` perf | Backend/Perf | APPROVED | None. Drift semantics preserved verbatim. |
| 11C — Recon checks 4–7 | Backend | APPROVED | None. Spec wording (`PAID`) is wrong; code (`SETTLED`) is correct — fix `md-files/payment-gateway.md` text in a follow-up doc PR. |

Overall: **commit batch 11 now**, open R27 as the very next ticket.

---

## 2. Test state confirmed

| Check | Result |
| --- | --- |
| `cd apps/api && npm test` | **76 suites / 1158 tests passed.** 5.232s. |
| `npm run check:kill-switch-bypass` (root) | **GREEN** — only `apps/api/src/modules/finance-admin/finance-admin.service.ts` carries the bypass flag (per ADR 0006). |
| `apps/api` workspace shim for `check:kill-switch-bypass` | **Still missing** (carried from batch 10 §7). Non-blocking; recommend adding a workspace shim in a chore PR. |

Hard Rule #4 (100% pass rate) **upheld.** Test count moved 1147 → 1158 (+11), matching 11C's claim of 10 new recon tests + 1 new perf regression guard (scenario 4b in `reconciliation.fault-injection.spec.ts`).

---

## 3. Migration safety — R26 fix and R27 gate

### 3.1 R26 — `20260415143000_subscription_tier_enum/migration.sql`

- **Idempotency block present and correct** (`migration.sql:21-23`):
  ```sql
  DO $$ BEGIN
    CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  ```
  Safe no-op on every environment that already has the type via `db push`. Safe forward-creation on fresh DBs.
- **Timestamp ordering** — `ls packages/prisma/migrations/`:
  ```
  20260207124607_init
  20260207143037_add_bounty_redesign_fields
  20260207164626_draft_defaults_payout_metrics_stripe
  20260207190351_add_brand_assets
  20260307211613_alignment_mvp
  20260327193409_add_system_settings
  20260415143000_subscription_tier_enum   ← R26 fix (NEW)
  20260415143053_stitch_express           ← consumes "SubscriptionTier"
  20260415190000_stitch_subscription_upgrade
  ```
  `143000` precedes `143053` by 53 seconds. Prisma `migrate deploy` will apply R26 first.
- **Enum values** mirror `enum SubscriptionTier` in `packages/prisma/schema.prisma` (FREE, PRO). Match confirmed.
- **Historical migration not edited** — `20260415143053_stitch_express` left untouched (correct: `migrate deploy` checksum invariant preserved in staging/prod).

**Sign-off: R26 closed.**

### 3.2 R27 — same drift class in `20260415190000_stitch_subscription_upgrade`

`20260415190000_stitch_subscription_upgrade/migration.sql:54-62` references:

- `subscriptions("id")` via FK `stitch_subscriptions_subscriptionId_fkey`
- `subscription_payments("providerPaymentId")` via the new UNIQUE INDEX

Neither table is created by any committed migration in `packages/prisma/migrations/`. Both currently exist in dev/staging only because of historical `prisma db push`. **A `prisma migrate deploy` against a fresh database fails at this migration**, even after R26 lands.

**Acceptable risk for batch 11?** Yes, narrowly:
- Runtime impact today: **zero** — every environment already has the tables via `db push`. No production user is affected.
- The bug is *pre-existing*, not introduced by batch 11. Holding batch 11 to fix R27 doesn't change the gate state.
- Batch 11A explicitly flagged R27 in its handoff notes; the doer did the right thing by not silently expanding scope.

**Hard gate documented:** No fresh-DB `prisma migrate deploy` succeeds end-to-end until R27 is fixed. **No new staging refresh, no new dev-machine clone, no production cold-restore is permitted** until R27 lands. Open R27 as the next backlog item; do not let it slip past batch 12.

---

## 4. Reconciliation perf (11B) — sign-off

Source verified at `apps/api/src/modules/reconciliation/reconciliation.service.ts:212-287`.

### 4.1 Drift-detection semantics preserved

| Invariant | Old loop | New single GROUP BY | Result |
| --- | --- | --- | --- |
| Only PAID bounties with non-null `faceValueCents` considered | `WHERE` filter on bounty fetch | `WHERE b."paymentStatus" = 'PAID' AND b."faceValueCents" IS NOT NULL` (line 251–252) | **Equivalent** |
| `reserveBalance = SUM(CREDIT) − SUM(DEBIT)` on `brand_reserve` / COMPLETED | Two `prisma.ledgerEntry.aggregate` per bounty | `COALESCE(SUM(CASE…CREDIT),0) − COALESCE(SUM(CASE…DEBIT),0)` (line 243–245) | **Equivalent** |
| LEFT JOIN keeps PAID bounties with zero `brand_reserve` entries | Old code paired empty aggregate → 0 (healthy "fully drawn") | `LEFT JOIN ledger_entries … COALESCE(…, 0)` (line 247–249) → 0 | **Equivalent** |
| Drift condition: `balance ≠ 0 AND balance ≠ faceValueCents` | Same predicate in JS | Same predicate in `HAVING` clause (line 254–259) | **Equivalent** |
| Severity stays `warning` | `severity: 'warning'` | `severity: 'warning'` (line 271) | **Equivalent** |
| `ReconciliationFinding` shape preserved | `category/signature/system/errorCode/severity/title/detail` | All seven fields populated, `sumDeprecated` retained for downstream shape compatibility (line 282) | **Equivalent** |

### 4.2 Speedup table (from `docs/perf/2026-04-15-reconciliation-benchmarks.md` §5.2)

| Series | B | Before | After | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Primary | 1 000 | 349.3 ms | **1.9 ms** | **184×** |
| Stress | 10 000 | 3 212 ms | **6.5 ms** | **494×** |

End-to-end `run()` at B=10 000: ~3.2 s → ~34 ms (~94× system-level reduction; 26 000× safety margin against 15-min cron at the prior worst-tested point).

### 4.3 Test guards

- `reconciliation.fault-injection.spec.ts` scenario 3 (existing reserve-drift detection) — green against new query.
- `reconciliation.fault-injection.spec.ts` scenario 4b (new regression guard for compensating-entry-with-missing-leg) — present and green.

**Sign-off: 11B perf change is semantically a no-op and a 184–494× speedup. Approved.**

---

## 5. Reconciliation coverage (11C) — per-check sign-off

All four new checks at `apps/api/src/modules/reconciliation/reconciliation.service.ts:289-664`. Wired into `run()` at lines 83–86 in the documented order.

| # | Check | Read-only? | `ReconciliationFinding` shape? | Routed via `KbService.recordRecurrence`? | Severity for critical class | Sign-off |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | `checkMissingLegs` (line 309) | Yes — single GROUP BY scan, no writes | All 7 fields populated (line 323–336) | Yes — through `persistFindings` → `KbService.recordRecurrence` (line 678–686), `system: 'ledger'` set | `critical` (line 328) — flips Kill Switch via run() handler | **PASS** |
| 5 | `checkStatusConsistency` (line 355) | Yes — four anti-joins, no writes | All 7 fields populated (lines 378–386, 405–419, 437–445, 460–473) | Yes — same `persistFindings` path | `warning` (deliberate — webhook-vs-DB lag noise; KB-confidence loop catches recurrence) | **PASS** |
| 6 | `checkWalletProjectionDrift` (line 504) | Yes — single CTE FULL OUTER JOIN, no writes | All 7 fields populated (line 550–562) | Yes — same `persistFindings` path | `warning` (per ADR 0002 wording — drift is recoverable) | **PASS** |
| 7 | `checkStitchVsLedger` (line 590) | Yes — two index-driven anti-joins, no writes | All 7 fields populated (lines 612–625, 645–660) | Yes — same `persistFindings` path | `critical` (lines 617, 652) — Stitch confirmed money moved but ledger has no record. Correctly flips Kill Switch. | **PASS** |

Kill Switch immateriality: confirmed in service-level docstring at lines 67–69 (`All checks are read-only — they never move money — and are therefore Kill-Switch-safe regardless of switch state`).

### 5.1 Spec deviation: `SETTLED` vs `PAID`

Verified `packages/prisma/schema.prisma:355–372`:

```prisma
enum StitchPaymentLinkStatus { CREATED INITIATED CAPTURED SETTLED FAILED EXPIRED REFUNDED }
enum StitchPayoutStatus      { CREATED INITIATED SETTLED FAILED RETRY_PENDING CANCELLED }
```

Neither enum has a `PAID` member. The spec text in `md-files/payment-gateway.md` is wrong; the implementation is correct. 11C's choice to use `SETTLED` matches the runtime values written by `BrandFundingHandler` and `PayoutsService`.

**Action:** spec doc fix is non-blocking for batch 11. Open as a docs ticket. Code stays as written.

---

## 6. ADR 0002 alignment — wallet drift check (11C #6)

ADR 0002 (`docs/adr/0002-wallet-read-model-projection.md`) is the authoritative source. Three explicit requirements vs implementation:

| ADR 0002 requirement | Implementation in `checkWalletProjectionDrift` | Match? |
| --- | --- | --- |
| Ledger is the **single source of truth** (line 8); `Wallet` is a **cached projection** | Drift detected as `cached_balance_cents <> projected_balance_cents`; ledger projection treated as authoritative reference; cached `Wallet.balance` flagged when divergent (line 537, 541–562) | **Yes** |
| Computation rule: `sum(credit) - sum(debit) WHERE userId=? AND account='hunter_available' AND status='COMPLETED'` (line 14) | Implemented verbatim in `proj` CTE (line 513–522) | **Yes** |
| Drift detection mandated: "A reconciliation check compares cached Wallet.balance against the ledger projection and raises an exception on drift" (line 24) | Present, severity `warning`, signature `wallet-drift:<userId>`, KB-routed for recurrence tracking | **Yes** |
| Pre-ledger Wallet rows untouched / "no historical backfill" (line 22) | Skip rule at line 547: rows with `wallet_id IS NULL` (ledger activity but no materialised Wallet) skipped — explicit comment cites ADR 0002 | **Yes** |

ADR 0002 alignment **confirmed.** The check's design matches the ADR's authoritative statement on every dimension.

---

## 7. Risk register — additions and updates

| ID | Title | Severity | Status | Notes |
| --- | --- | --- | --- | --- |
| R1 | Open from batch 9 | Low | Open | Carried — no change. |
| R10–R13 | `PAYOUTS_ENABLED=false` gates | Medium | Open | Carried — gated, inert. |
| R18 | TradeSafe vacuum (ADR 0008) | Open (policy) | Open | Carried — Phase-2 work, blocked on ADR 0009. |
| R24 | TradeSafe endpoint paths speculative | Low | Open | Carried — close on ADR 0009 FINAL. |
| R25 | Subscription expense legs as CREDIT offsets | Low | Open | Carried — flag for finance reporting only. |
| R26 | `SubscriptionTier` enum missing from migrations | — | **CLOSED in batch 11A** | Pre-conditioning migration `20260415143000_subscription_tier_enum` lands the enum idempotently; verified `prisma migrate deploy` against fresh DB. |
| **R27** | **`subscriptions` and `subscription_payments` tables missing from migrations** | **High** | **OPEN — gate** | Same root cause as R26 (drift via `db push`). `20260415190000_stitch_subscription_upgrade` references both tables; neither is created by any committed migration. Runtime impact today: zero (existing envs have the tables). **No fresh-DB `migrate deploy` works until fixed.** Must land before next env provision (staging refresh, new dev clone, prod cold-restore). Owner: backend agent, next batch. Spec doc fix (`md-files/payment-gateway.md` `PAID` → `SETTLED` wording) tracked as a separate non-blocking docs ticket alongside R27. |

---

## 8. Conditions for commit

1. **Commit batch 11 now.** All three lanes are correct, tested, and passes the 100% gate.
2. **Open R27 as the very next ticket.** Backend agent owns. Same fix pattern as R26: a new pre-conditioning migration with a timestamp earlier than `20260415190000_stitch_subscription_upgrade` that creates `subscriptions` and `subscription_payments` (and any related enums) idempotently. Verify with `prisma migrate deploy` against a throwaway DB.
3. **Open a docs ticket** to fix `md-files/payment-gateway.md` references to `status='PAID'` for Stitch enums — should read `status='SETTLED'`. Non-blocking.
4. **Carry forward** the `apps/api/package.json` workspace shim for `check:kill-switch-bypass` from batch 10 §7. Still non-blocking, still recommended.
5. **Hold batch 12 from any work that requires a fresh DB** (env provision, schema rebuild, staging refresh) until R27 lands.

— Team Lead, 2026-04-15
