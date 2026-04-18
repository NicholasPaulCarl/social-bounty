-- Phase 2A: PostVisibility re-check scheduled cron support.
--
-- Adds three columns to `submissions` so the visibility scheduler can
-- determine eligibility, cadence bucket, and the consecutive-failure
-- counter that drives the auto-refund trigger:
--   * approvedAt — set when status transitions to APPROVED. Drives the
--     post-age cadence buckets (24h / 72h / 7d) without parsing
--     reviewHistory JSON every cron run.
--   * lastVisibilityCheckAt — last time the visibility scheduler picked
--     this submission. Powers the oldest-first selection that prevents
--     starvation under MAX_PER_RUN.
--   * consecutiveVisibilityFailures — increments on each FAILED re-scrape
--     and resets to 0 on success. The 2-failure threshold triggers the
--     auto-refund + email notification flow (one Apify hiccup is allowed,
--     two consecutive failures is a strong "post removed" signal).
--
-- Adds the `submission_url_scrape_histories` table — append-only audit
-- trail of every re-scrape pass per URL. Mirrors `submission_url_scrapes`
-- minus the unique-per-URL constraint, plus a checkedAt timestamp + FK
-- to the source row. Future Phase 3 admin UI reads this for the per-URL
-- visibility timeline.
--
-- Idempotent — every column / table / index / constraint is wrapped so
-- partially-migrated environments no-op cleanly. Pattern matches batch
-- 13A (20260415200200_reconcile_missing_tables).

-- ═════════════════════════════════════
-- submissions: 3 new columns
-- ═════════════════════════════════════

ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "lastVisibilityCheckAt" TIMESTAMP(3);
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "consecutiveVisibilityFailures" INTEGER NOT NULL DEFAULT 0;

-- Index: drives the scheduler's eligible-submission query.
-- Filter: status=APPROVED + approvedAt IS NOT NULL, sort by lastVisibilityCheckAt asc.
CREATE INDEX IF NOT EXISTS "submissions_approvedAt_lastVisibilityCheckAt_idx"
    ON "submissions"("approvedAt", "lastVisibilityCheckAt");

-- ═════════════════════════════════════
-- submission_url_scrape_histories
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "submission_url_scrape_histories" (
    "id" TEXT NOT NULL,
    "urlScrapeId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "channel" "SocialChannel" NOT NULL,
    "format" "PostFormat" NOT NULL,
    "scrapeStatus" "UrlScrapeStatus" NOT NULL,
    "scrapeResult" JSONB,
    "verificationChecks" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_url_scrape_histories_pkey" PRIMARY KEY ("id")
);

-- Indexes — read paths (per-URL timeline, per-submission rollup).
CREATE INDEX IF NOT EXISTS "submission_url_scrape_histories_urlScrapeId_idx"
    ON "submission_url_scrape_histories"("urlScrapeId");
CREATE INDEX IF NOT EXISTS "submission_url_scrape_histories_submissionId_idx"
    ON "submission_url_scrape_histories"("submissionId");
CREATE INDEX IF NOT EXISTS "submission_url_scrape_histories_checkedAt_idx"
    ON "submission_url_scrape_histories"("checkedAt");

-- Foreign keys — cascade with the parent rows. urlScrape FK is the
-- primary parent; submission FK denormalised for direct submission-level
-- queries without an extra join.
DO $$ BEGIN
    ALTER TABLE "submission_url_scrape_histories"
        ADD CONSTRAINT "submission_url_scrape_histories_urlScrapeId_fkey"
        FOREIGN KEY ("urlScrapeId") REFERENCES "submission_url_scrapes"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "submission_url_scrape_histories"
        ADD CONSTRAINT "submission_url_scrape_histories_submissionId_fkey"
        FOREIGN KEY ("submissionId") REFERENCES "submissions"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
