-- DRAFT MIGRATION — NOT YET APPLIED
--
-- Adds `subscription_revenue` to the LedgerAccount enum and a `tierSnapshot`
-- column to subscription_payments so every SubscriptionPayment carries a
-- plan-snapshot (Financial Non-Negotiable #9). Required by the
-- `subscription_charged` ledger posting wired into SubscriptionsService.
--
-- Review before running `prisma migrate deploy` — the directory name intentionally
-- omits the timestamp prefix that Prisma uses so this migration is NOT picked
-- up automatically. Rename to a timestamped folder (e.g. 20260416120000_subscription_revenue_ledger)
-- when ready to apply.

-- AlterEnum
ALTER TYPE "LedgerAccount" ADD VALUE 'subscription_revenue';

-- AlterTable
ALTER TABLE "subscription_payments"
    ADD COLUMN "tierSnapshot" "SubscriptionTier";
