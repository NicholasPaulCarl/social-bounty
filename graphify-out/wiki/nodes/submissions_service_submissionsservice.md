# `SubmissionsService`

> The end-to-end service owning hunter submissions — create, list, review, resubmit-failed, approve with hard verification gate.

## What it does

`SubmissionsService` is the NestJS service managing the Submission aggregate. Its methods: `.create()` validates per-format URL coverage and fires Apify scraping; `.updateSubmission()` is the resubmit-only-failed path that re-scrapes only PENDING/FAILED URLs (verified scrapes cached across resubmits); `.listMySubmissions(user, params)` returns the hunter's own list; `.listForBounty(bountyId, params)` returns the brand's review queue; `.findById(id)` is the detail read path; `.review(id, user, dto)` is the brand's approve/reject — the approval path is the hard verification gate that rejects `APPROVED` with `BadRequestException({ details: [...] })` unless every `SubmissionUrlScrape.scrapeStatus === VERIFIED`; `.markNeedsMoreInfo()` sends the submission back to the hunter with a reviewer note. The approval path also delegates to `ApprovalLedgerService` for the double-entry ledger write (commission + hunter-available + global fee splits per §4.10).

## Why it exists

This is the service that earned the hard approval gate — a core anti-abuse control. Without it, a brand could approve a submission where the hunter claimed 10k views but the scraped post had 50. The 10 verification-check rules (`tagAccount`, `mention`, `minViews`/`minLikes`/`minComments`, `contentFormat`, `formatMatch`, `minFollowers`, `publicProfile`, `minAccountAgeDays`) fire inside `SubmissionScraperService.scrapeAndVerify` and their results roll up into this service's `review()` method — if any check fails, `APPROVED` is blocked. Phase 1–3 of the bounty-submission branch all flowed through this service. Hard Rule #3 is satisfied via `AuditService.log()` on every state transition.

## How it connects

- **`.create()` method (degree 36)** — the busiest entry point on the service.
- **`SubmissionScraperService.scrapeAndVerify`** — the async side-effect fired after `.create()` / `.updateSubmission()` commits.
- **`validateProofLinkCoverage` pure function** — the per-format coverage validator from `submission-coverage.validator.ts`.
- **`ApprovalLedgerService`** — the ledger writer for the approval transaction group; separate from `LedgerService` only to encapsulate the fee-split computation.
- **`BountyAccessService`** — consulted during `.create()` to confirm the hunter has an approved application for CLOSED bounties.
- **`SubscriptionsService`** — consulted for the tier snapshot recorded on the approval transaction (plan-snapshot per §4.9).
- **`RefundsService.requestAfterApproval`** — invoked when ADR 0010's auto-refund scheduler detects two consecutive visibility failures.
- **`MailService`** — approval / rejection / needs-more-info emails.

---
**degree:** 20 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/submissions/submissions.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the hard approval gate's dependence on `SubmissionUrlScrape.scrapeStatus === VERIFIED` means the service is tightly coupled to the scraper. If the scraper is unhealthy (Apify outage), brands can't approve. Phase 3D's visibility-analytics dashboard is the operator's signal for this; Phase 3A's kill-switch gate on auto-refunds is the safety against mass false-negatives.
