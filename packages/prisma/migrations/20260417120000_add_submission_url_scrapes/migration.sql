-- Per-URL scrape + verification state for hunter submissions.
-- Source of truth for which URLs the hunter provided, their Apify scrape
-- result, and the pass/fail check computation against bounty rules.
-- A submission's APPROVED transition is blocked by bounties.service until
-- every row here has scrapeStatus='VERIFIED'. Failed URLs are surfaced
-- back to the hunter for resubmit; successful rows are cached and not
-- re-scraped on subsequent resubmits.
--
-- Idempotent DDL — safe to re-run against partially-migrated envs.

-- CreateEnum — UrlScrapeStatus drives the per-URL state machine.
DO $$ BEGIN
    CREATE TYPE "UrlScrapeStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum — PostFormat mirrors the shared TypeScript enum so the
-- new submission_url_scrapes table can store the requested format
-- (rather than embedding it in the URL or in JSONB).
DO $$ BEGIN
    CREATE TYPE "PostFormat" AS ENUM ('STORY', 'REEL', 'FEED_POST', 'VIDEO_POST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "submission_url_scrapes" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "channel" "SocialChannel" NOT NULL,
    "format" "PostFormat" NOT NULL,
    "scrapeStatus" "UrlScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "scrapeResult" JSONB,
    "verificationChecks" JSONB,
    "errorMessage" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_url_scrapes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — one URL per submission (dedupe), supports cache lookup.
CREATE UNIQUE INDEX IF NOT EXISTS "submission_url_scrapes_submissionId_url_key"
    ON "submission_url_scrapes"("submissionId", "url");

-- CreateIndex — supports recovery sweep for stuck PENDING rows.
CREATE INDEX IF NOT EXISTS "submission_url_scrapes_scrapeStatus_idx"
    ON "submission_url_scrapes"("scrapeStatus");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "submission_url_scrapes"
        ADD CONSTRAINT "submission_url_scrapes_submissionId_fkey"
        FOREIGN KEY ("submissionId") REFERENCES "submissions"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
