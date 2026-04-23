# `SubmissionsService.create()`

> Entry point for every hunter submission — per-format URL validation, Apify scraping trigger, and verification orchestration.

## What it does

`SubmissionsService.create()` is the write path for `POST /submissions`. It validates the inbound `CreateSubmissionRequest` against the bounty's declared channel+format pairs using `validateProofLinkCoverage()` (from `submission-coverage.validator.ts`) — every required `(channel, format)` pair from `bounty.channels` must have a matching `ProofLinkInput`, hostnames must match `CHANNEL_URL_PATTERNS`, paths must match `FORMAT_URL_HINTS` (Instagram `/reel/`, `/p/`, `/stories/`; TikTok `/video/`), no extras, no duplicates. It then opens a Prisma `$transaction` that (a) creates the `Submission` row with status `PENDING`, (b) creates one `SubmissionUrlScrape` child row per proof link with status `PENDING`, (c) writes an AuditLog entry, (d) decrements the bounty's submission counter. After the transaction commits, it fires `setImmediate(() => this.scraper.scrapeAndVerify(submissionId))` — a fire-and-forget that kicks off the per-URL Apify scrape and verification-check computation (Phase 1 of the bounty-submission branch, commit `88dffcf`).

## Why it exists

Every hunter-facing submission in the platform flows through this one method, which is why it collects 36 graph edges. The per-format-URL-coverage rule is the product decision that shapes the code: a bounty asking for `INSTAGRAM:[REEL,FEED_POST]` + `TIKTOK:[VIDEO_POST]` forces the hunter to submit 3 URLs — no more, no fewer — and the validator is the enforcement point. The hard approval gate that this feeds (via `SubmissionUrlScrape.scrapeStatus === VERIFIED`) is the substantive anti-abuse control of the platform; without it, brands couldn't trust that `submission.reportedMetrics` matched what was actually posted. `BREAKING` — in PR 1 (`88dffcf`) the `CreateSubmissionRequest.proofLinks` shape changed from `string[]` to `ProofLinkInput[]`, and this method is the enforcement point.

## How it connects

- **`SubmissionsService` (class)** — the container; `.create()` is one of its ~12 methods, the busiest alongside `.review()` (approve/reject) and `.updateSubmission()` (resubmit-only-failed flow).
- **`validateProofLinkCoverage()`** — the pure function that rejects the request before the transaction opens.
- **`SubmissionScraperService.scrapeAndVerify()`** — post-commit `setImmediate` trigger; fans out to Apify.
- **`AuditService.log()`** — per-submission audit row inside the transaction.
- **`BountyAccessService`** — invoked pre-create to confirm the hunter has an approved application for CLOSED bounties.
- **`SubmissionUrlScrape`** — the child table this method seeds; tracked by Phase 3's visibility re-check scheduler.
- **`CHANNEL_URL_PATTERNS`, `CHANNEL_POST_FORMATS` (shared)** — the regexes and format lists the validator consumes.

The graph shows `.create()` as the most-referenced submission method — semantically similar to `BountiesService.create()` and `DisputesService.create()`, both of which share the "validate → $transaction → audit → fire-and-forget side effect" shape.

---
**degree:** 36 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/submissions/submissions.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `setImmediate` for the scraper is load-bearing for response time (Apify calls can take 5–30 seconds). Phase 2C's stuck-PENDING scrape recovery scheduler (`920e605`) exists specifically to recover submissions where this `setImmediate` was lost across a process restart.
