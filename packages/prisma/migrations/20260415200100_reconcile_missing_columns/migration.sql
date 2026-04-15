-- R28 reconciliation (batch 12B) — pre-conditioning migration #2 of 3.
--
-- Adds columns on existing tables that schema.prisma declares but no
-- committed migration creates. Every ADD COLUMN uses IF NOT EXISTS so
-- environments that already have them (via `db push`) no-op.
--
-- Drafts folded in here:
-- - packages/prisma/drafts/ineffective_fix_flag/migration.sql
--     → recurring_issues.ineffectiveFix / ineffectiveFlaggedAt / ineffectiveFlaggedBy
--
-- Additional cleanup:
-- - users.passwordHash (created by 20260207124607_init, absent from current
--   schema.prisma, unread by any app code per orphan-sweep — see
--   `docs/reviews/2026-04-15-orphan-sweep.md`). Dropped here with IF EXISTS.
--   This is a no-op on environments whose schema was synced via `db push`
--   against the current schema.prisma (the column is already gone there).

-- ─────────────────────────────────────
-- bounties — new columns from schema.prisma
-- ─────────────────────────────────────

ALTER TABLE "bounties"
    ADD COLUMN IF NOT EXISTS "accessType" "BountyAccessType" NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN IF NOT EXISTS "adminFeeAmount" DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS "adminFeePercent" DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS "contentFormat" TEXT NOT NULL DEFAULT 'BOTH',
    ADD COLUMN IF NOT EXISTS "instructionSteps" JSONB,
    ADD COLUMN IF NOT EXISTS "payoutMethod" "PayoutMethod";

-- ─────────────────────────────────────
-- organisations — profile/brand columns
-- ─────────────────────────────────────

ALTER TABLE "organisations"
    ADD COLUMN IF NOT EXISTS "bio" VARCHAR(500),
    ADD COLUMN IF NOT EXISTS "coverPhotoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "handle" TEXT,
    ADD COLUMN IF NOT EXISTS "messagingEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "socialAnalytics" JSONB,
    ADD COLUMN IF NOT EXISTS "socialLinks" JSONB,
    ADD COLUMN IF NOT EXISTS "targetInterests" JSONB,
    ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;

-- ─────────────────────────────────────
-- payouts — proof of payment attachments
-- ─────────────────────────────────────

ALTER TABLE "payouts"
    ADD COLUMN IF NOT EXISTS "proofOfPaymentName" TEXT,
    ADD COLUMN IF NOT EXISTS "proofOfPaymentUrl" TEXT;

-- ─────────────────────────────────────
-- recurring_issues — draft/ineffective_fix_flag promoted
-- ─────────────────────────────────────

ALTER TABLE "recurring_issues"
    ADD COLUMN IF NOT EXISTS "ineffectiveFix" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "ineffectiveFlaggedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "ineffectiveFlaggedBy" TEXT;

-- ─────────────────────────────────────
-- users — add profile columns, drop orphan passwordHash
-- ─────────────────────────────────────

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "bio" VARCHAR(500),
    ADD COLUMN IF NOT EXISTS "interests" JSONB,
    ADD COLUMN IF NOT EXISTS "profilePictureUrl" TEXT;

-- users.passwordHash exists only in the init migration; schema.prisma has no
-- `password` field and no app code reads the column. Safe drop with IF EXISTS.
ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash";

-- ─────────────────────────────────────
-- Indexes on pre-existing tables that schema.prisma declares but no
-- committed migration creates. Idempotent via IF NOT EXISTS.
-- ─────────────────────────────────────

-- bounties (new indexes from schema.prisma @@index blocks)
CREATE INDEX IF NOT EXISTS "bounties_deletedAt_idx" ON "bounties"("deletedAt");
CREATE INDEX IF NOT EXISTS "bounties_status_deletedAt_idx" ON "bounties"("status", "deletedAt");
CREATE INDEX IF NOT EXISTS "bounties_createdAt_idx" ON "bounties"("createdAt");
CREATE INDEX IF NOT EXISTS "bounties_paymentStatus_idx" ON "bounties"("paymentStatus");
CREATE INDEX IF NOT EXISTS "bounties_accessType_idx" ON "bounties"("accessType");

-- brand_assets
CREATE INDEX IF NOT EXISTS "brand_assets_userId_idx" ON "brand_assets"("userId");

-- organisations (handle unique + index)
CREATE UNIQUE INDEX IF NOT EXISTS "organisations_handle_key" ON "organisations"("handle");
CREATE INDEX IF NOT EXISTS "organisations_handle_idx" ON "organisations"("handle");

-- submissions
CREATE INDEX IF NOT EXISTS "submissions_status_payoutStatus_verificationDeadline_idx"
    ON "submissions"("status", "payoutStatus", "verificationDeadline");
CREATE INDEX IF NOT EXISTS "submissions_createdAt_idx" ON "submissions"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_bountyId_userId_key"
    ON "submissions"("bountyId", "userId");
