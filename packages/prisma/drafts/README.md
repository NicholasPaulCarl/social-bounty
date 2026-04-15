# Prisma Migration Drafts

Drafts in this directory are **NOT** auto-applied. Each is a Prisma migration
SQL that needs review + a real timestamped migration folder before it runs.

## Convention

- One subfolder per draft, named after the change (no `YYYYMMDD…` prefix).
- Each subfolder contains a single `migration.sql` with the candidate DDL/DML.
- `prisma migrate deploy` does **not** scan this directory; only
  `packages/prisma/migrations/` is ever applied.

## Promoting a draft

When a draft is ready to ship:

1. Review the SQL against the current `schema.prisma`.
2. Generate a real, timestamped migration folder under
   `packages/prisma/migrations/` via `npx prisma migrate dev --name <name>`
   (or create the `YYYYMMDDHHMMSS_<name>/` folder by hand if you have to
   preserve exact SQL).
3. Copy the reviewed SQL into the new folder's `migration.sql`.
4. Update `migration_lock.toml` if needed, then delete the draft subfolder.
5. Deploy with `prisma migrate deploy` in staging before prod.

## Why this directory exists

See `docs/reviews/2026-04-15-team-lead-audit-batch-5.md#R19`: a draft with
the `_draft` suffix living under `migrations/` would be lexically sorted
after the live migrations and executed on the next `prisma migrate deploy`.
Drafts live outside `migrations/` so operator error cannot apply them.

## Current drafts

_None._ All previously listed drafts were promoted during R28 (batch 12B,
`docs/reviews/2026-04-15-r28-migration-reconciliation.md`):

- `ineffective_fix_flag/` → folded into
  `packages/prisma/migrations/20260415200100_reconcile_missing_columns/`.
- `subscription_revenue_ledger/` → `tierSnapshot` column was already live in
  `20260415142500_subscription_tables/`; the `LedgerAccount` enum value is
  now in `20260415200000_reconcile_missing_enums/`.
- `tradesafe_webhook_provider/` → folded into
  `20260415200000_reconcile_missing_enums/`.
