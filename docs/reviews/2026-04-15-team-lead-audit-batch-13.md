# Team Lead Audit — Batch 13 (R28 migration reconciliation + env cleanup)

**Date:** 2026-04-15
**Auditor:** Agent Team Lead
**Scope:** 13A (three reconciliation migrations promoting schema.prisma ↔ migration history to parity) + 13B (env validation cleanup, `FINANCIAL_KILL_SWITCH` removal, nine newly validated env vars).
**Priors referenced:** `docs/reviews/2026-04-15-r28-migration-reconciliation.md`, `docs/reviews/2026-04-15-orphan-sweep.md`, `docs/reviews/2026-04-15-team-lead-audit-batch-11.md`.

---

## Verdict: **APPROVED**

Commit now. No blockers. One new medium-severity risk (R29) logged; one closed (R30 is cosmetic on the only DB where it could matter).

---

## 1. Migration idempotency sign-off

Each guard is mandatory per the R26/R27 convention. All three files verified by direct read.

| Check | 200000_enums | 200100_columns | 200200_tables | Result |
|---|---|---|---|---|
| `CREATE TYPE` wrapped in `DO $$ EXCEPTION WHEN duplicate_object` | 16/16 | n/a | n/a | PASS |
| `ALTER TYPE ... ADD VALUE` uses `IF NOT EXISTS` | 2/2 | n/a | n/a | PASS |
| `CREATE TABLE` uses `IF NOT EXISTS` | n/a | n/a | 16/16 | PASS |
| `ADD COLUMN` uses `IF NOT EXISTS` | n/a | 23/23 | n/a | PASS |
| `CREATE INDEX` / `CREATE UNIQUE INDEX` uses `IF NOT EXISTS` | n/a | 11/11 | 45/45 | PASS |
| `ALTER TABLE ... ADD CONSTRAINT` (FK) wrapped in `DO $$ EXCEPTION` | n/a | n/a | 22/22 | PASS |
| Destructive ops | 0 | 1 (`DROP COLUMN users.passwordHash IF EXISTS`) | 0 | See §3 |
| Self-referential FK safe (disputes → disputes) | n/a | n/a | 1 | PASS — CREATE TABLE precedes FK in same file |

Fresh `migrate deploy` against empty DB: green (per 13A report).
Pg_dump snapshot diff on an existing-schema env: identical byte-for-byte (per 13A report).

Conclusion: every statement is genuinely idempotent. Re-running the batch on any known environment is a safe no-op except for the one exception in §3.

## 2. Placement strategy sign-off

13A placed the three migrations **AFTER** the head `20260415190000_stitch_subscription_upgrade`, not **BEFORE**. This is a departure from R26/R27 but is justified.

Verification:
- Read `20260415190000_stitch_subscription_upgrade/migration.sql`. It creates one new enum (`StitchSubscriptionMandateStatus`) and one new table (`stitch_subscriptions`), plus a unique index on `subscription_payments.providerPaymentId`. It does **not** reference any of the 16 tables, 16 enums, or 23 columns in the reconciliation set.
- Older committed migrations likewise do not reference the reconciled objects (they live only in `schema.prisma` and app code — confirmed by the orphan sweep).
- No checksum disturbance for already-applied migrations → no `_prisma_migrations` table rewrite needed on existing envs.

Sign-off: **PASS**. Placement is safe; rewriting history would have been the greater risk.

## 3. `DROP COLUMN users.passwordHash IF EXISTS` — safety sign-off

Hard Rule #4 and Section 4 of the Financial Non-Negotiables require explicit scrutiny of any destructive op, even outside the ledger.

Evidence gathered:
- `Grep passwordHash apps/` → **zero** matches in `apps/**`.
- `Grep passwordHash packages/prisma/schema.prisma` → zero matches; the column is not declared in the current schema.
- `Grep -r "password|bcrypt|argon" apps/api/src/modules/auth` → zero matches. The auth module does not implement password auth at all; the codebase uses JWT issued by other identity flows.
- `packages/prisma/migrations/20260207124607_init/migration.sql:29` — the only migration that ever created `passwordHash` (as `TEXT NOT NULL`).
- Documentation references (`md-files/agents/agent-backend.md`, `docs/architecture/database-schema.md`) describe a *future* password-auth design, not current behaviour.

Impact assessment:
- On any env whose schema was already synced via `db push` against current `schema.prisma`: column is already gone → `IF EXISTS` makes this a no-op.
- On the one local dev DB that still has `passwordHash`: the column (and any dev-seed values in it) is dropped. No app code reads or writes it, so there is no runtime breakage.
- Production has not been deployed (MVP pre-launch). No production data affected.

Sign-off: **PASS — no blocker**. The column is a true orphan. Dropping it on the stale local DB eliminates a non-obvious attack surface (a `NOT NULL` dead column someone could accidentally repopulate via raw SQL) and brings schema.prisma and the DB into sync. See R30 below for the residual (cosmetic) risk.

## 4. Environment validation sign-off

- `FINANCIAL_KILL_SWITCH` removal: confirmed clean. Grep in `apps/` shows only (a) the removal comment in `env.validation.ts:71`, (b) a test confirming lingering env values are ignored, and (c) a defensive comment in `ledger.service.ts:13`. No readers remain. The kill switch is a DB row (`SystemSetting.financial.kill_switch.active`) — architecturally correct (one source of truth).
- `STITCH_SYSTEM_ACTOR_ID` is correctly guarded by `@ValidateIf(payments !== 'none')`, matching the runtime throw pattern in the services that depend on it.
- `BENEFICIARY_ENC_KEY` retains its `JWT_SECRET` fallback. The validator explicitly comments that the fallback is preserved for legacy dev behaviour. See R29 below — this is a real concern but does not block 13B.
- Nine new validators added (`PAYOUTS_ENABLED`, `RECONCILIATION_ENABLED`, `EXPIRED_BOUNTY_RELEASE_ENABLED`, `STITCH_SYSTEM_ACTOR_ID`, `BENEFICIARY_ENC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APIFY_API_TOKEN`, `APIFY_ACTOR_TIMEOUT_MS`). 20-test spec (`env.validation.spec.ts`) covers happy path, missing values, garbage input, and `FINANCIAL_KILL_SWITCH` ignore.
- Current `.env` shape (Stitch sandbox) satisfies all new validators — no boot break.

Sign-off: **PASS**.

## 5. Cross-cutting checks

- `cd apps/api && npm test` → **77 suites / 1178 tests passed**.
- `npm run check:kill-switch-bypass` → **green**. Only the admin override in `finance-admin.service.ts` carries `allowDuringKillSwitch: true` (per ADR 0006).
- `git diff packages/prisma/schema.prisma` → **empty**. 13A correctly did not edit the schema; the schema was already the source of truth and the migrations are catching up.
- Drafts cleanup: all three draft folders deleted (`packages/prisma/drafts/{ineffective_fix_flag, subscription_revenue_ledger, tradesafe_webhook_provider}`). Drafts README updated to reflect empty state.

## 6. Risk register update

- **R24** (TradeSafe speculative endpoint paths): status unchanged — blocked on ADR 0009 follow-up and live API docs.
- **R25** (cosmetic subscription expense leg): status unchanged.
- **R26, R27, R28**: **CLOSED**. Schema.prisma, migration history, and running code are now in three-way parity.

### R29 — `BENEFICIARY_ENC_KEY` silent fallback to `JWT_SECRET`

- **Severity:** High (NOT Critical).
- **Financial impact:** Medium — beneficiary bank details are encrypted with a key that, if `BENEFICIARY_ENC_KEY` is unset in production, defaults to the JWT signing secret. Compromising one token-signing key would then also decrypt every stored bank account number. The two should be cryptographically independent.
- **Why not Critical-escalate now:** payouts are still gated (`PAYOUTS_ENABLED=false`); no live beneficiary records are created in production yet. The time-to-flip-live is the deadline.
- **Required action before `PAYOUTS_ENABLED=true`:** add a conditional validator (`@ValidateIf(NODE_ENV==='production')` + `@IsString()` with a minimum length), fail boot if unset, and key-rotate any records written under the fallback during dev. Owner: Agent Team Lead to route on next batch.
- **KB entry:** required (automatic trigger — new High-severity financial risk). Template at `md-files/knowledge-base.md#entry-template`.
- **Status:** **Fixed in batch 14A, commit `<sha-placeholder>`.**
  - `env.validation.ts`: `BENEFICIARY_ENC_KEY` is now `@ValidateIf(o => o.PAYOUTS_ENABLED === 'true') @IsString() @MinLength(32)`. Boot fails with a clear message when payouts are live and the key is missing or shorter than 32 characters. The 32-char floor is documented inline — AES-256 key material needs ≥32 bytes of entropy; shorter input yields a weak scrypt-derived key.
  - `beneficiary.service.ts`: constructor throws a `Configuration error: BENEFICIARY_ENC_KEY is required when PAYOUTS_ENABLED=true…` before any encryption attempt. The JWT_SECRET fallback survives ONLY on the `PAYOUTS_ENABLED=false` path and logs a loud warn at boot (`BENEFICIARY_ENC_KEY unset — using JWT_SECRET derivation. ONLY VALID WITH PAYOUTS_ENABLED=false.`).
  - `.env.example`: `BENEFICIARY_ENC_KEY` now carries a placeholder plus documentation of the 32-char minimum and the `PAYOUTS_ENABLED` coupling.
  - Tests: 6 new cases in `env.validation.spec.ts` (throws on missing/short key with payouts on; passes with 32-char key; passes with payouts off regardless of key) and 4 new cases in `beneficiary.service.spec.ts` (constructor throws with clear message, does not read JWT_SECRET on the payouts-on missing-key path, warns on the dev fallback, silent when explicitly configured).
  - `PAYOUTS_ENABLED` remains `false` — this change only hardens the gate, it does not flip it.

### R30 — `users.passwordHash` drop on stale local DB

- **Severity:** Low.
- **Financial impact:** None.
- **Why logged:** the dev DB that retains the column will lose it on next `prisma migrate deploy`. No app code reads it, no production data is affected, and the drop is itself the fix that restores parity with `schema.prisma`. Recording only so future auditors don't re-discover it as a surprise.
- **Action:** none required.

## 7. Commit recommendation

**Commit now.** Files to include:
- `packages/prisma/migrations/20260415200000_reconcile_missing_enums/migration.sql`
- `packages/prisma/migrations/20260415200100_reconcile_missing_columns/migration.sql`
- `packages/prisma/migrations/20260415200200_reconcile_missing_tables/migration.sql`
- `packages/prisma/drafts/README.md` (updated)
- deletions of the three draft folders
- `apps/api/src/common/config/env.validation.ts`
- `apps/api/src/common/config/env.validation.spec.ts`
- `docs/reviews/2026-04-15-r28-migration-reconciliation.md`
- this audit file

Suggested message: `fix: R28 schema/migration reconciliation + env validation cleanup`.

Follow-up task (new batch): implement R29 hardening on `BENEFICIARY_ENC_KEY` before flipping `PAYOUTS_ENABLED`. Owner: Agent Team Lead to assign.
