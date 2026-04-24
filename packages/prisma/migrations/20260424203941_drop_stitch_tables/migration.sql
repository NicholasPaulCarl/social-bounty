-- Migration: Drop Stitch payment gateway tables + enums (ADR 0011).
--
-- Context:
--   The Stitch merchant account was declined. ADR 0011 converts the
--   platform to a single-rail TradeSafe architecture for both inbound
--   (bounty funding via hosted checkout) and outbound (hunter payouts)
--   flows. All Stitch-side persistence is removed here; the matching
--   application-layer sweep lives under agent 1A's work.
--
-- Idempotency:
--   This migration MUST apply cleanly against (a) a fresh local Postgres
--   (no Stitch tables — every DROP is a no-op), and (b) a Postgres that
--   has the Stitch tables (staging / prod — rows drop with the table).
--   All DDL uses IF EXISTS guards, matching the batch 13A pattern
--   (packages/prisma/migrations/20260415200000_reconcile_missing_enums).
--
-- Enum policy:
--   `PayoutRail.STITCH` is intentionally retained in schema.prisma and in
--   the database. Removing an enum value from Postgres requires
--   recreating the type (ALTER TYPE ... DROP VALUE does not exist),
--   which is disruptive for a cosmetic cleanup. No application path
--   creates new rows with STITCH after this migration, so the residual
--   value is inert. Same reasoning for `WebhookProvider.STITCH`:
--   historical webhook_events rows remain queryable; no new rows are
--   written under that provider.
--
-- Order of operations (reverse FK dependency to avoid dependent-object
-- errors; not strictly necessary with CASCADE but keeps intent obvious):
--   1. stitch_payouts       (references stitch_beneficiaries)
--   2. stitch_beneficiaries (leaf)
--   3. stitch_payment_links (leaf)
--   4. stitch_subscriptions (references subscriptions, but drops cleanly)
--   5. Drop the Stitch-specific enum types that no surviving table uses.
--   6. Drop the Refund.stitchRefundId column + unique index.
--
-- Financial Non-Negotiables: this migration removes no ledger rows,
-- no audit logs, no webhook envelopes, no refund records (only the
-- stale Stitch correlation id on Refund — no money moves).

-- ─────────────────────────────────────
-- 1. Drop Stitch tables (reverse FK order, idempotent)
-- ─────────────────────────────────────

-- stitch_payouts -> stitch_beneficiaries (FK). Drop child first.
DROP TABLE IF EXISTS "stitch_payouts" CASCADE;
DROP TABLE IF EXISTS "stitch_beneficiaries" CASCADE;

-- stitch_payment_links -> bounties (FK onDelete: Cascade, but the bounty
-- side doesn't care about its absence). Leaf for our purposes.
DROP TABLE IF EXISTS "stitch_payment_links" CASCADE;

-- stitch_subscriptions -> subscriptions (FK onDelete: Cascade). Drop the
-- child side only; subscriptions stays — the tier/status state machine
-- is provider-agnostic (see Subscription.provider being a plain string).
DROP TABLE IF EXISTS "stitch_subscriptions" CASCADE;

-- ─────────────────────────────────────
-- 2. Drop Refund.stitchRefundId (column + unique index)
-- ─────────────────────────────────────
--
-- The refund correlation id for the now-retired provider. TradeSafe
-- refunds use their own id carried via LedgerEntry.externalReference +
-- the transactionGroupId linkage; no new column is needed here.

DROP INDEX IF EXISTS "refunds_stitchRefundId_key";
ALTER TABLE "refunds" DROP COLUMN IF EXISTS "stitchRefundId";

-- ─────────────────────────────────────
-- 3. Drop Stitch-specific enum types
-- ─────────────────────────────────────
--
-- Safe to drop only AFTER the tables that used them are gone (Postgres
-- refuses to drop a type with dependent columns). The DROP TABLE CASCADE
-- above does not remove enum types, so we do it explicitly here.

DROP TYPE IF EXISTS "StitchPaymentLinkStatus";
DROP TYPE IF EXISTS "StitchPayoutStatus";
DROP TYPE IF EXISTS "StitchSubscriptionMandateStatus";

-- ─────────────────────────────────────
-- Intentionally NOT dropped
-- ─────────────────────────────────────
--   * "PayoutRail"              — STITCH value retained (see header note).
--   * "WebhookProvider"         — STITCH value retained so historical
--                                 webhook_events rows stay readable.
--   * subscription_payments     — provider-agnostic, providerPaymentId
--                                 column stays (used by future TradeSafe
--                                 subscription mandate shape too).
--   * bounties.stripePaymentIntentId — legacy Stripe column, out of scope
--                                 for this migration (ADR 0001 retirement).
