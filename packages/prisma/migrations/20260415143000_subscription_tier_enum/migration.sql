-- Pre-conditioning migration for the SubscriptionTier enum.
--
-- Context (R26, batch 10 audit):
-- The follow-up migration `20260415143053_stitch_express` references
-- the "SubscriptionTier" enum on the `bounties` and `submissions` tables
-- but no committed migration creates the enum. Existing dev/staging/prod
-- databases acquired the type via an earlier `prisma db push`, so the
-- drift went undetected. A `prisma migrate deploy` against an empty
-- database would fail at `20260415143053_stitch_express`.
--
-- Fix strategy:
-- - Do NOT edit the already-applied historical migration (would break
--   `migrate deploy` invariants in staging/prod where it is recorded).
-- - Insert this idempotent pre-conditioning migration with a timestamp
--   strictly earlier than 20260415143053, so Prisma applies it first on
--   fresh databases. On environments that already have the type, the
--   `EXCEPTION WHEN duplicate_object` block makes it a safe no-op.
--
-- Enum values mirror `enum SubscriptionTier` in schema.prisma.

DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');
EXCEPTION WHEN duplicate_object THEN null; END $$;
