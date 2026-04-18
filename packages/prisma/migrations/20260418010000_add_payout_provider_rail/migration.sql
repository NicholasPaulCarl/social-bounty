-- R32 — TradeSafe reconciliation coverage.
--
-- Adds a minimal provider discriminator to `stitch_payouts` so
-- ReconciliationService.checkPayoutsVsLedger can split Stitch vs TradeSafe
-- drift into per-rail findings. This is the minimum slice of ADR 0009 §3
-- Option B needed to land R32; the full model rename is deferred to ADR 0010.
--
-- Migration is strictly additive:
--   * new enum `PayoutRail` (values STITCH, TRADESAFE) — existing rows are
--     backfilled to `STITCH` via the column default.
--   * new column `stitch_payouts.provider` with NOT NULL DEFAULT 'STITCH'.
--   * new index on `(provider, status)` so the reconciliation anti-join stays
--     index-driven per `docs/perf/2026-04-15-reconciliation-benchmarks.md`.
--
-- Idempotency: every block uses IF NOT EXISTS / DO $$ EXCEPTION wrappers per
-- the batch 12B / batch 13A pattern, so a `migrate deploy` against an env
-- that already has the objects (e.g. a prior `db push`) is a safe no-op.
--
-- Financial Non-Negotiable #7 / Hard Rule #4 safety:
--   * no data is rewritten — existing rows keep their ledger mapping.
--   * no FK, no unique constraint change.
--   * the new column is NOT NULL with a default so no application code needs
--     to know about it before write-time.
--
-- Hand-off to R34: when the TradeSafe webhook dispatch lands, the handler
-- sets `provider = 'TRADESAFE'` on newly-created rows. Until then all rows
-- remain STITCH, which matches the current truth that `PAYOUTS_ENABLED=false`.

-- ─────────────────────────────────────
-- Enum: PayoutRail
-- ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "PayoutRail" AS ENUM ('STITCH', 'TRADESAFE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- stitch_payouts.provider
-- ─────────────────────────────────────
ALTER TABLE "stitch_payouts"
    ADD COLUMN IF NOT EXISTS "provider" "PayoutRail" NOT NULL DEFAULT 'STITCH';

-- Covering index so the reconciliation anti-join stays index-driven. The
-- existing (status, nextRetryAt) index only helps the scheduler's retry
-- query; the new check filters on (provider, status) before anti-joining
-- into ledger_transaction_groups.
CREATE INDEX IF NOT EXISTS "stitch_payouts_provider_status_idx"
    ON "stitch_payouts" ("provider", "status");
