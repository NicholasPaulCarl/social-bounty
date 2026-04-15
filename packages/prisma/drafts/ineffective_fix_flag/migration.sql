-- Draft migration (per R19 convention — NOT applied until backend agent
-- promotes drafts/ into the live migrations/ tree).
--
-- Adds three columns to recurring_issues so KbService.flagIneffectiveFix
-- can mark a resolved KB entry as an "Ineffective Fix" when the same
-- (category, signature) recurs within 90 days of resolution.

ALTER TABLE "recurring_issues"
  ADD COLUMN "ineffectiveFix" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ineffectiveFlaggedAt" TIMESTAMP(3),
  ADD COLUMN "ineffectiveFlaggedBy" TEXT;
