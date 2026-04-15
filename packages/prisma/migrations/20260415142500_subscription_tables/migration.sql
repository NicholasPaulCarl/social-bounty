-- Pre-conditioning migration for the `subscriptions` and `subscription_payments`
-- tables and their supporting enums.
--
-- Context (R27, batch 11 audit → fixed in batch 12A):
-- The follow-up migration `20260415190000_stitch_subscription_upgrade` adds a
-- foreign key to `subscriptions("id")` and a UNIQUE INDEX on
-- `subscription_payments("providerPaymentId")`. Neither table is created by
-- any committed migration. Existing dev/staging/prod databases acquired these
-- tables via an earlier `prisma db push`, so the drift went undetected. A
-- `prisma migrate deploy` against an empty database would fail at
-- `20260415190000_stitch_subscription_upgrade` with
--   relation "subscriptions" does not exist
-- (and similarly for `subscription_payments`).
--
-- This is the same class of drift as R26 (`SubscriptionTier` enum) which was
-- fixed by the pre-conditioning migration `20260415143000_subscription_tier_enum`.
--
-- Fix strategy (mirrors R26):
-- - Do NOT edit the already-applied historical migrations (would break
--   `migrate deploy` checksum invariants in staging/prod where they are
--   recorded in `_prisma_migrations`).
-- - Insert this idempotent pre-conditioning migration with a timestamp
--   strictly earlier than `20260415143000_subscription_tier_enum` and
--   `20260415143053_stitch_express`, so Prisma applies it first on fresh
--   databases. On environments that already have the tables, every CREATE is
--   guarded by either `IF NOT EXISTS` or a `DO $$ … EXCEPTION` block so the
--   migration is a safe no-op.
--
-- Columns and indexes mirror `model Subscription` / `model SubscriptionPayment`
-- in packages/prisma/schema.prisma (authoritative). Enum values mirror
-- `enum SubscriptionTier` / `enum SubscriptionStatus` /
-- `enum SubscriptionEntityType` / `enum SubscriptionPaymentStatus`.
--
-- NOTE on enum ordering: `SubscriptionTier` is also created idempotently in
-- `20260415143000_subscription_tier_enum` (R26 fix). Creating it here first is
-- harmless — the R26 block is wrapped in the same `DO $$ … EXCEPTION WHEN
-- duplicate_object` pattern and will no-op when the type already exists.

-- ─────────────────────────────────────
-- Enums (all idempotent)
-- ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionEntityType" AS ENUM ('HUNTER', 'BRAND');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'FREE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- Table: subscriptions
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT,
    "entityType" "SubscriptionEntityType" NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "gracePeriodEndsAt" TIMESTAMP(3),
    "failedPaymentCount" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "providerSubId" TEXT,
    "providerCustomerId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Single-column uniques (from @unique on userId and @map("organisationId"))
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_key"
    ON "subscriptions"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_organisationId_key"
    ON "subscriptions"("organisationId");

-- Composite uniques (@@unique)
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_entityType_key"
    ON "subscriptions"("userId", "entityType");

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_organisationId_entityType_key"
    ON "subscriptions"("organisationId", "entityType");

-- Non-unique indexes (@@index)
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx"
    ON "subscriptions"("status");

CREATE INDEX IF NOT EXISTS "subscriptions_currentPeriodEnd_idx"
    ON "subscriptions"("currentPeriodEnd");

CREATE INDEX IF NOT EXISTS "subscriptions_tier_idx"
    ON "subscriptions"("tier");

-- Foreign keys (wrapped so replays on existing envs no-op)
DO $$ BEGIN
  ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- Table: subscription_payments
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "subscription_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerPaymentId" TEXT,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "tierSnapshot" "SubscriptionTier",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- Indexes (@@index on subscriptionId and status)
-- NOTE: the UNIQUE INDEX on "providerPaymentId" is intentionally NOT created
-- here. It is created by `20260415190000_stitch_subscription_upgrade` (the
-- migration that motivated R27) and that migration must remain the source of
-- truth for that index. Creating it here without IF NOT EXISTS would break
-- the later migration; creating it here WITH IF NOT EXISTS is harmless but
-- would drift the declared owner. We leave it to `20260415190000_*`.
CREATE INDEX IF NOT EXISTS "subscription_payments_subscriptionId_idx"
    ON "subscription_payments"("subscriptionId");

CREATE INDEX IF NOT EXISTS "subscription_payments_status_idx"
    ON "subscription_payments"("status");

-- Foreign key
DO $$ BEGIN
  ALTER TABLE "subscription_payments"
    ADD CONSTRAINT "subscription_payments_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
