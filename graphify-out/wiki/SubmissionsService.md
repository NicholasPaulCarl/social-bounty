# SubmissionsService

> God node · 20 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`

**Community:** [[API service layer]]

## Summary

`SubmissionsService` runs the hunter-submission lifecycle with two parallel state machines: review (`SUBMITTED → IN_REVIEW → APPROVED/REJECTED/NEEDS_MORE_INFO`) and payout (`NOT_PAID → PENDING → PAID`, where `PAID` is terminal). Its methods span creation (`.create()` — the busiest node in the graph with 36 edges), read (`.findById()`, `.listMySubmissions()`, `.listForBounty()`, `.getReviewQueue()`, `.getMyEarnings()`), mutation (`.updateSubmission()`, `.review()`, `.updatePayout()`), and asset handling (`.uploadFiles()`, `.formatProofImages()`). `.review()` enforces the hard approval gate added in Phase 1 — APPROVED transition is rejected if any `SubmissionUrlScrape` row is not `VERIFIED`.

It exists because submissions are where bounty rules, social-post scraping, eligibility gates, tier-snapshotted commission, and ledger writes all meet. `.create()` runs `validateProofLinkCoverage` (every required channel × format pair must have exactly one URL), then fires off `SubmissionScraperService` via `setImmediate` after the `$transaction` commits. Approval ultimately writes the two-leg `approval_escrow` ledger group through `ApprovalLedgerService` — integer minor units, idempotent, balanced, audited. Neighbors encode the ecosystem: `SubmissionScraperService` + `SubmissionScrapeRecoveryScheduler` (Apify orchestration + stuck-PENDING recovery), `BountyAccessService` (RBAC on submit), `WalletService` (participant earnings projection), `SubscriptionsService` (tier-snapshot commission via `COMMISSION_RATES`), and `MailService` (notify-on-review emails). `BountiesService` and `DisputesService` are `semantically_similar_to` peers.

## Connections by Relation

### contains
- [[submissions.service.ts]] `EXTRACTED`

### method
- [[.create()]] `EXTRACTED`
- [[.findById()]] `EXTRACTED`
- [[.updatePayout()]] `EXTRACTED`
- [[.updateSubmission()]] `EXTRACTED`
- [[.review()]] `EXTRACTED`
- [[.uploadFiles()]] `EXTRACTED`
- [[.formatProofImages()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.listForBounty()]] `EXTRACTED`
- [[.getMyEarnings()]] `EXTRACTED`
- [[.listMySubmissions()]] `EXTRACTED`
- [[.getReviewQueue()]] `EXTRACTED`

### semantically_similar_to
- [[BountiesService]] `INFERRED`
- [[DisputesService]] `INFERRED`
- [[SocialHandlesService]] `INFERRED`
- [[BrandsService]] `INFERRED`
- [[SubmissionScraperService]] `INFERRED`
- [[SubmissionScrapeRecoveryScheduler]] `INFERRED`
- [[AuditService]] `INFERRED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*