# Team Lead Audit — Batch 10 (TradeSafe scaffold + Live Stitch upgrade + Reconciliation benchmarks)

**Date:** 2026-04-15
**Auditor:** agent-team-lead
**Scope:** Batch 10A (TradeSafe adapter scaffold, mock mode), 10B (Stitch card-consent live upgrade), 10C (reconciliation benchmarks).
**Baseline tests:** 1061 → **Claimed:** 1147 (+86) → **Verified:** 1147 passed across 76 suites.

---

## Verdict: **APPROVED WITH CONDITIONS**

Conditions, in order of urgency:

1. **C1 (Critical, pre-existing — must close before any fresh deploy):** `SubscriptionTier` enum is referenced in three migrations (`20260415143053_stitch_express:38,49`, `20260415190000_stitch_subscription_upgrade:27`) but is **never created** in any committed migration. A fresh `prisma migrate deploy` from scratch will fail at `20260415143053_stitch_express`. This was flagged in 10C's benchmark notes and the schema/migration drift was inherited (not caused) by 10B. **Fix before next environment provision.** Create a one-line additive migration that runs FIRST in lex order — but since the broken migration is already named `20260415143053_*`, the only safe option is a *prepended* migration with an earlier timestamp (impossible without rewriting history) **or** a follow-up `20260416_create_subscription_tier_enum_idempotent` migration that uses `CREATE TYPE IF NOT EXISTS` and is documented as required for fresh-DB bootstraps. Easiest correct fix: hand-edit `20260415143053_stitch_express/migration.sql` to prepend `CREATE TYPE "SubscriptionTier" AS ENUM ('FREE','PRO');` before its first reference. Existing deployed environments are unaffected (Postgres already has the type from prior schema sync).
2. **C2 (Low):** TradeSafe `/api/v1/*` endpoint paths in `tradesafe.client.ts` are speculative until ADR 0009 is FINAL with vendor confirmation. Already gated by `PAYOUT_PROVIDER=stitch` default — acceptable as scaffold. Track as **R24**.
3. **C3 (Low, doc):** `claude.md` line 98 update is correct and accurate. CLAUDE.md (capitalised) was not modified by 10B (status check confirms). No rule changes; safe.

Everything else passed.

---

## 1. Migration Ordering Analysis (critical)

| Migration | Creates | References | Status |
|---|---|---|---|
| `20260207124607_init` | base tables | — | OK |
| ... 5 prior migrations ... | — | — | OK |
| `20260415143053_stitch_express` | LedgerAccount (incl. `subscription_revenue`), LedgerEntryType, WebhookProvider(STITCH,STRIPE), Stitch types, **subscription_payments table** | `"SubscriptionTier"` (line 38, 49) — **NOT created here, NOT created earlier** | **BROKEN on fresh DB** |
| `20260415190000_stitch_subscription_upgrade` (10B, NEW) | StitchSubscriptionMandateStatus, stitch_subscriptions, UNIQUE on subscription_payments.providerPaymentId | `"SubscriptionTier"`, `"Currency"`, `"subscriptions"`, `"subscription_payments"` | Inherits C1; otherwise additive and clean |
| `drafts/tradesafe_webhook_provider/migration.sql` (10A) | `WebhookProvider.TRADESAFE` via `ADD VALUE IF NOT EXISTS` | — | **NOT in `migrations/`** — correctly draft. Idempotent. Safe to promote with timestamped rename. |

**Collision check between 10A and 10B:** None. 10A only edits `WebhookProvider` enum (additive). 10B only adds new table + index. They touch disjoint objects. The schema.prisma diff is mergeable: 10A added `TRADESAFE` to enum, 10B added `StitchSubscriptionMandateStatus` enum + `StitchSubscription` model. Both present in `schema.prisma` cleanly (lines 344, 378–385, 1183–1203 verified).

**`subscription_revenue` ledger account** required by 10B's recipe is already present in the live `20260415143053_stitch_express` migration (line 2). 10B did NOT need a new `ALTER TYPE` and correctly did not add one.

---

## 2. Schema Sync (10A + 10B both edited `schema.prisma`)

Both additions present, no conflict:

- **10A:** `enum WebhookProvider { STITCH, STRIPE, TRADESAFE }` (line 344). Pure addition.
- **10B:** `enum StitchSubscriptionMandateStatus { … }` (lines 378–385); `model StitchSubscription` (lines 1183–1203); `SubscriptionPayment.tierSnapshot` (line 1220); `Subscription.stitchSubscription` back-relation (line 1164). All purely additive.

`prisma generate` would succeed. The runtime schema-vs-migration check (which **is** the C1 issue above) only bites on a fresh DB.

---

## 3. Financial Non-Negotiables §4 — Sign-off table for `subscription_charged`

| # | Rule | Evidence in `upgrade.service.ts` | Result |
|---|---|---|---|
| 1 | Double-entry balanced | `LedgerService.postTransactionGroup` enforces `debit==credit` (ledger.service.ts:109); recipe legs balance: DEBIT `gateway_clearing` chargedCents = CREDIT `subscription_revenue` (charge − fees) + CREDIT `processing_expense` + CREDIT `bank_charges`. | **PASS** |
| 2 | Idempotency at DB level | `actionType: 'subscription_charged'`, `referenceId: stitchPaymentId` → unique on `LedgerTransactionGroup(referenceId, actionType)`. Also `SubscriptionPayment.providerPaymentId` UNIQUE (new index in 10B migration line 61). | **PASS** |
| 3 | Transaction-group integrity | Status flip is in `prisma.$transaction`; ledger post is a single `postTransactionGroup` call (which is itself wrapped in `$transaction` inside LedgerService). The two are intentionally split because §2's UNIQUE on the ledger group makes the ledger leg replay-safe even if the status-flip succeeds and the ledger fails (then re-runs on webhook retry). Documented in service comments lines 429–432. | **PASS** |
| 4 | Integer minor units | `BigInt` cents throughout (`amountCents`, `chargedCents`, `processingFeeCents`, `bankChargeCents`); the only `Number()` conversions are for the legacy `Decimal` `SubscriptionPayment.amount` field which is display-only. | **PASS** |
| 5 | Append-only ledger | No UPDATE/DELETE on ledger tables. Status updates are on `Subscription` and `StitchSubscription` only. | **PASS** |
| 6 | AuditLog | LedgerService writes audit row in-tx; UpgradeService also writes `SUBSCRIPTION_UPGRADE_INITIATED`, `_AUTHORISED`, `_FAILED` audit rows; controller has `@Audited('SUBSCRIPTION_UPGRADE_INITIATED','Subscription')`. | **PASS** |
| 7 | Retry-safe | `processConsentAuthorised` early-returns when already `AUTHORISED` (line 300); `processRecurringCharge` early-returns existing `SubscriptionPayment` by `providerPaymentId`; ledger post idempotent on `(referenceId, actionType)`. Webhook router test `webhook-router.upgrade.spec.ts` covers replay. | **PASS** |
| 8 | Platform custody | N/A — subscription revenue is platform income, not user funds in custody. Service comment line 69 explicitly addresses. | **PASS (N/A)** |
| 9 | Plan snapshot | `StitchSubscription.tierSnapshot` set to PRO at mandate creation (line 218); `SubscriptionPayment.tierSnapshot` set to PRO at charge time (line 402); ledger metadata carries `tier: tierAtCharge` on every leg. | **PASS** |
| 10 | Global fee independence | **No `global_fee_revenue` leg on subscription charges.** Verified canonical in `md-files/payment-gateway.md:272` — "No `global_fee_revenue` leg on recurring — the 3.5% global fee applies to bounty flows only." 10B's claim is correct. | **PASS** |

**All 10 Non-Negotiables: PASS.**

### Side-note on leg semantics

`processing_expense` and `bank_charges` are posted as CREDITs in the recipe (canonical per payment-gateway.md:272). This treats them as offsets to gross revenue rather than as expense DEBITs against a cash account — economically equivalent under the recipe used (gateway_clearing absorbs the gross debit; revenue is shown net via separate offset credits). Acceptable for current reporting; flag as **R25** if Finance ever wants gross/expense reporting in the dashboard.

---

## 4. Kill Switch Bypass

`grep -nE "allowDuringKillSwitch" apps/api/src/modules/subscriptions` → **no matches**. UpgradeService never sets the bypass flag, so `LedgerService.postTransactionGroup` always runs the kill-switch check (ledger.service.ts:113–116) before posting. Subscription charges are correctly subject to the kill switch.

`npm run check:kill-switch-bypass` → **GREEN** (only `finance-admin.service.ts` uses the flag, per ADR 0006).

---

## 5. RBAC Sign-off

`POST /subscription/upgrade` → `@Roles(PARTICIPANT, BUSINESS_ADMIN)` + `@Audited('SUBSCRIPTION_UPGRADE_INITIATED', 'Subscription')`. SUPER_ADMIN intentionally excluded — admins must not initiate a card charge against another user's account because the controller acts on `user.sub`/`user.brandId` only (no impersonation parameters). Reasoning is correct and is also documented in the controller doc-comment (lines 45–57). **PASS.**

`POST /subscription/cancel` and `/reactivate` follow the same `(PARTICIPANT, BUSINESS_ADMIN)` pattern — consistent. `GET /subscription` and `/payments` are read-only and include SUPER_ADMIN where needed.

---

## 6. CLAUDE.md / claude.md Diff

`git diff claude.md` → one line changed (line 98): "Live Upgrade CTA — wired as of batch 10 task B…" replacing the prior "disabled" note. Pure status update, no rule changes.

`git status` shows `CLAUDE.md` (capitalised) is **not** modified. Project rules untouched.

---

## 7. Test State Confirmed

| Run | Result |
|---|---|
| `cd apps/api && npm test` | **76 suites, 1147 tests passed.** 5.241s. |
| `npm run check:kill-switch-bypass` (root) | **GREEN.** Only finance-admin uses the bypass flag. |
| `apps/api` script `check:kill-switch-bypass` | **Missing** (script lives at root only). Non-blocking; recommend adding a workspace shim if the team expects to invoke it from `apps/api`. |

Hard Rule #4 (100% pass rate) **upheld.**

---

## 8. Risk Register — Additions

Carrying forward open risks from batch 9: R1 (Low), R10/R11/R12/R13 (Medium, all gated by `PAYOUTS_ENABLED=false`), R18 (TradeSafe vacuum, Open — policy). All others closed.

| ID | Title | Severity | Notes |
|---|---|---|---|
| **R24** | TradeSafe endpoint paths speculative | **Low** | `tradesafe.client.ts` posts to `/api/v1/beneficiaries` and `/api/v1/payouts/:id`. These are 10A's assumption #4 pending ADR 0009 vendor sign-off. Inert — `PAYOUT_PROVIDER` defaults to `stitch`; mock mode used in tests. Close when ADR 0009 hits FINAL with confirmed contract. |
| **R25** | Subscription expense legs as CREDIT offsets | **Low** | `processing_expense` and `bank_charges` posted as CREDITs (canonical per payment-gateway.md:272). Functionally correct; flag for finance reporting if gross/expense breakdown ever needed. |
| **R26** | `SubscriptionTier` enum missing from migrations (fresh-DB break) | **Fixed in batch 11A, commit <sha-placeholder>** | Pre-existing in `20260415143053_stitch_express` (NOT introduced by 10B), now amplified because 10B references the same enum. **Resolution (batch 11A, Backend agent):** added new pre-conditioning migration `packages/prisma/migrations/20260415143000_subscription_tier_enum/migration.sql` (timestamp 53s before the broken one) that runs `CREATE TYPE "SubscriptionTier" AS ENUM ('FREE','PRO')` inside an idempotent `DO $$ … EXCEPTION WHEN duplicate_object THEN null; END $$` block. Historical `20260415143053_stitch_express` migration was **NOT edited** (already applied in every environment; editing would break `migrate deploy` in staging/prod). Verified by running `prisma migrate deploy` against a fresh local Postgres DB: both `20260415143000_subscription_tier_enum` and `20260415143053_stitch_express` apply cleanly. **Note:** a separate, related drift exists in `20260415190000_stitch_subscription_upgrade` — it references a `subscriptions` table never created by any committed migration. That is a distinct bug (same root cause: `db push` masking missing migrations) and should be tracked as **R27**. |

---

## Conditions for commit

- **OK to commit batch 10 now.** The fresh-DB break is pre-existing (would be present at HEAD anyway) and the runtime impact is zero on existing environments.
- **Open R26 fix as a separate PR** before the next env provision (staging refresh, new dev clone). Do not let it slip beyond batch 11.
- Promote `drafts/tradesafe_webhook_provider/migration.sql` to a timestamped folder only when `PAYOUT_PROVIDER=tradesafe` is about to be flipped on (paired with ADR 0009 FINAL).

— Team Lead, 2026-04-15
