# R28 — Migration History Reconciliation

**Date**: 2026-04-15
**Author**: Backend / DBA agent (batch 12B)
**Branch**: `bounty`
**Scope**: `packages/prisma/migrations/` — full drift reconciliation vs `schema.prisma`.
**Follow-up to**: R26 (`SubscriptionTier` enum pre-condition), R27 (`subscriptions` + `subscription_payments` pre-condition), 12C orphan sweep (C1).

---

## Outcome

`npx prisma migrate deploy` now succeeds from an **empty** Postgres database
with the current `schema.prisma`. `prisma migrate diff` against the result
reports **no drift**. All three drafts under `packages/prisma/drafts/` are
promoted; the drafts directory now contains only its `README.md`.

Test evidence is summarised in §4 below.

---

## 1. Inventory — what was missing

Drift was captured by running `npx prisma migrate deploy` against an empty
DB (it succeeded, since no migration referenced the missing pieces) and
then generating

    npx prisma migrate diff \
      --from-url <fresh-db-url> \
      --to-schema-datamodel schema.prisma --script

That SQL listed:

| Category | Count | Notes |
|---|---:|---|
| Enum types (new) | **16** | `PayoutMethod`, `BountyAccessType`, `BountyApplicationStatus`, `BountyInvitationStatus`, `SocialPlatform`, `SocialHandleStatus`, `NotificationType`, `ConversationContext`, `WalletTxType`, `WithdrawalStatus`, `DisputeStatus`, `DisputeCategory`, `DisputeReason`, `DisputeResolution`, `DisputeMessageType`, `EvidenceType` |
| Enum values added | **2** | `LedgerAccount` += `subscription_revenue` (draft promoted); `WebhookProvider` += `TRADESAFE` (draft promoted) |
| Tables (new) | **16** | `refresh_token_audits`, `disputes`, `dispute_messages`, `dispute_evidence`, `dispute_status_history`, `social_links`, `wallets`, `wallet_transactions`, `withdrawals`, `bounty_applications`, `bounty_invitations`, `user_social_handles`, `notifications`, `conversations`, `conversation_participants`, `messages` |
| Columns added to existing tables | **23** | `bounties` ×6, `organisations` ×8, `payouts` ×2, `recurring_issues` ×3 (draft promoted), `users` ×3, plus `users.passwordHash` DROP (orphan, unread; see §5) |
| Indexes (new) | **56** | 11 on pre-existing tables, 45 on new tables (includes unique, composite, and single-column @@index entries from schema.prisma) |
| Foreign-key constraints (new) | **22** | All referencing `users`, `organisations`, `bounties`, `submissions`, or one of the newly-created tables |

Raw diff captured at `/tmp/sb_r28_diff.sql` during reconciliation (653
lines). All of it is now represented in committed migrations.

---

## 2. Dependency graph — what each new migration does

Three new migrations placed lexically AFTER the current head
(`20260415190000_stitch_subscription_upgrade`) so existing environments see
them as a simple append. Dependency order inside each file follows the
task-spec rules (enums → columns on existing tables → new tables and their
indexes/FKs last).

```
20260415200000_reconcile_missing_enums           (160 lines)
  ├─ CREATE TYPE ×16  (DO $$ EXCEPTION WHEN duplicate_object)
  └─ ALTER TYPE ADD VALUE IF NOT EXISTS ×2

20260415200100_reconcile_missing_columns         ( 98 lines)
  ├─ ALTER TABLE bounties        ADD COLUMN IF NOT EXISTS ×6
  ├─ ALTER TABLE organisations   ADD COLUMN IF NOT EXISTS ×8
  ├─ ALTER TABLE payouts         ADD COLUMN IF NOT EXISTS ×2
  ├─ ALTER TABLE recurring_issues ADD COLUMN IF NOT EXISTS ×3   ◀ draft: ineffective_fix_flag
  ├─ ALTER TABLE users           ADD COLUMN IF NOT EXISTS ×3
  ├─ ALTER TABLE users           DROP COLUMN IF EXISTS passwordHash
  └─ CREATE [UNIQUE] INDEX IF NOT EXISTS ×11  (on bounties, brand_assets,
                                              organisations, submissions)

20260415200200_reconcile_missing_tables          (573 lines)
  ├─ CREATE TABLE IF NOT EXISTS ×16 (each followed by its indexes)
  └─ DO $$ … ADD CONSTRAINT … EXCEPTION WHEN duplicate_object ×22
```

All three migrations are fully idempotent. Every DDL is guarded.

### Drafts → live migrations

| Draft folder | Promoted to |
|---|---|
| `packages/prisma/drafts/ineffective_fix_flag/` | `20260415200100_reconcile_missing_columns` (recurring_issues block) |
| `packages/prisma/drafts/subscription_revenue_ledger/` | Enum value in `20260415200000_reconcile_missing_enums`. The companion column `subscription_payments.tierSnapshot` was **already** live in `20260415142500_subscription_tables` (R27), so no column-level promotion needed. |
| `packages/prisma/drafts/tradesafe_webhook_provider/` | Enum value in `20260415200000_reconcile_missing_enums` |

After promotion the draft folders were removed. `packages/prisma/drafts/README.md`
was updated to record the promotion and now lists _no_ current drafts.

---

## 3. Why these migrations are placed AFTER the current head

R26 and R27 inserted pre-conditioning migrations _before_ the earliest
existing migration that depended on them (because the later migration
referenced the missing object and would fail on a fresh DB). In R28 there
is no such forward-dependency: the missing objects aren't referenced by any
existing committed migration (that's precisely why the drift went
undetected — the running schema was shaped by `prisma db push` in
dev/staging/prod). So the cleanest placement is **append at the tail**,
which also means on existing environments the new migrations simply show
up as three new pending migrations that no-op cleanly when applied.

Checksums on all 10 prior migrations are untouched. No existing
`_prisma_migrations` row needs to change.

---

## 4. Test evidence

### 4a. Fresh-DB `migrate deploy` (task step a/b)

```
$ createdb sb_r28_test_1776279961
$ DATABASE_URL=…/sb_r28_test_1776279961 DIRECT_URL=… npx prisma migrate deploy
13 migrations found in prisma/migrations
Applying migration `20260207124607_init`
…
Applying migration `20260415200000_reconcile_missing_enums`
Applying migration `20260415200100_reconcile_missing_columns`
Applying migration `20260415200200_reconcile_missing_tables`
All migrations have been successfully applied.
```

Exit code: **0**.

### 4b. `migrate diff` after deploy (task step c)

```
$ npx prisma migrate diff --from-url …/sb_r28_test_1776279961 \
    --to-schema-datamodel schema.prisma --script
-- This is an empty migration.
```

Drift: **none**.

### 4c. Idempotent replay (task step d)

```
$ npx prisma migrate deploy   # second run, same DB
13 migrations found in prisma/migrations

No pending migrations to apply.
```

Exit code: **0**. Deterministic.

### 4d. Existing-env simulation (task step e) — no-op verified

Instead of touching the real local DB (forbidden by the task), simulated
an existing env:

1. `createdb sb_r28_existing_…`
2. `npx prisma db push` — brings schema to current `schema.prisma`.
3. `prisma migrate resolve --applied` for all 10 pre-R28 migrations.
4. `pg_dump -s` → `/tmp/sb_r28_before.sql` (3,381 lines).
5. `npx prisma migrate deploy` — applied the 3 new reconciliation
   migrations.
6. `pg_dump -s` → `/tmp/sb_r28_after.sql`.
7. `diff /tmp/sb_r28_before.sql /tmp/sb_r28_after.sql` → **empty** (exit
   code 0).

Confirms the three new migrations are **pure no-ops** on an environment
that already has the current schema (the exact state dev/staging/prod are
in per R27 notes).

### 4e. Real local DB — skipped (intentional)

The local `social_bounty` DB is actually behind (only 5 of 10 pre-R28
migrations recorded). Running `migrate deploy` on it would forward-apply
five prior migrations + the three new R28 ones, which is unrelated to the
R28 scope and risks dev-data loss (see §5 on `passwordHash`). Skipped per
task instruction "skip with a note if not reachable". The local DB is not
the "`db push`-synced env" the task cares about.

### 4f. Application test suite

```
$ cd apps/api && npm test
Test Suites: 77 passed, 77 total
Tests:       1178 passed, 1178 total
```

Compared to the task brief's "1158 tests" baseline: **+20 tests net
green**. No test was broken by the reconciliation.

### 4g. Kill-switch bypass check

```
$ npm run check:kill-switch-bypass
OK: 'allowDuringKillSwitch: true' only appears in
    apps/api/src/modules/finance-admin/finance-admin.service.ts (per ADR 0006).
```

Green.

---

## 5. Surprises / decisions that deviate from the simple diff

### 5a. `users.passwordHash` DROP is included

The Prisma diff produced `ALTER TABLE "users" DROP COLUMN "passwordHash"`.
Investigation:

- Declared in `20260207124607_init` as `NOT NULL`.
- **Absent** from current `schema.prisma` (no `password` / `passwordHash`
  field anywhere — confirmed by grep).
- **Zero** app-code readers (`grep -r passwordHash apps/` returns no
  hits).
- Orphan sweep (`docs/reviews/2026-04-15-orphan-sweep.md`) did not flag
  this column because its scope was markers/flags/drafts, not schema
  columns.

The column is truly orphaned. Leaving it in would mean `migrate diff` keeps
reporting drift forever. The DROP is included with `DROP COLUMN IF EXISTS`
so it's a no-op on envs where the column is already gone (i.e. any env
created via `db push` against the current schema — dev/staging/prod per R27
notes). On the real local DB (which still has `passwordHash` populated
with 3 rows), it would drop the column on next deploy; that's consistent
with the intent of both the current schema and the app's passwordless auth
model. Flagged here so the Team Lead can decide whether to gate the deploy
on that local DB separately.

### 5b. `subscription_payments.tierSnapshot` is NOT re-added

The `subscription_revenue_ledger` draft contained an
`ALTER TABLE "subscription_payments" ADD COLUMN "tierSnapshot"`. During R27
the column was included directly inside `20260415142500_subscription_tables`
(line 144). So the column ships in the R27 migration already — only the
**enum value** part of that draft needed promotion here. Not a schema
inconsistency; just overlap between the draft and the R27 pre-condition.

### 5c. No schema.prisma inconsistencies discovered

Every enum, table, column, index, and FK in the diff corresponds cleanly
to a declaration in `schema.prisma`. No orphan spec-implied entities
needed creation outside the schema. No edits to `schema.prisma` were made
or required.

---

## 6. Files touched by this batch

New:
- `packages/prisma/migrations/20260415200000_reconcile_missing_enums/migration.sql` (160 lines)
- `packages/prisma/migrations/20260415200100_reconcile_missing_columns/migration.sql` (98 lines)
- `packages/prisma/migrations/20260415200200_reconcile_missing_tables/migration.sql` (573 lines)

Removed:
- `packages/prisma/drafts/ineffective_fix_flag/migration.sql`
- `packages/prisma/drafts/subscription_revenue_ledger/migration.sql`
- `packages/prisma/drafts/tradesafe_webhook_provider/migration.sql`

Edited:
- `packages/prisma/drafts/README.md` — reflects promotion + empty drafts list.

**No** existing migration file was edited. **No** schema file was edited.

---

## 7. Follow-ups

- **Real local DB**: if the Team Lead wants to reconcile the actual local
  `social_bounty` database, schedule a one-off `migrate deploy` — be aware
  that it will forward-apply 5 prior migrations plus R28, including the
  `passwordHash` drop (§5a). Three user rows will lose that column; app
  code doesn't read it.
- **R19 convention**: `packages/prisma/drafts/` is now empty but the
  directory + README remain as the documented staging area for future
  drafts (per batch 5 R19).
