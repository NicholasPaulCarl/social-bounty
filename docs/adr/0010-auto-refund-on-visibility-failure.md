# ADR 0010 — Auto-Refund on PostVisibility Failure

**Status:** Accepted
**Date:** 2026-04-18
**Supersedes:** —
**Related:** `claude.md` Financial Non-Negotiables (§4), ADR 0006 (kill-switch bypass scope), ADR 0005 (idempotency), `~/.claude/plans/quizzical-growing-owl.md` (Phase 2A scope)

## Context

Phase 1 of the hunter submission verification feature (merged 2026-04-18, commit `16e2095`) added per-URL Apify scraping and a hard approval gate. Phase 2A (merged 2026-04-18, commit `071f98f`) extended this with **scheduled re-scraping** to enforce the bounty's `PostVisibility` rule (`MUST_NOT_REMOVE` or `MINIMUM_DURATION`) **after** the brand has approved the submission and (potentially) paid the hunter.

The visibility scheduler — `apps/api/src/modules/submissions/submission-visibility.scheduler.ts` — runs every 6 hours, picks up to 100 eligible approved submissions, and re-scrapes the URLs the hunter originally provided. When a re-scrape fails (the post 404s, the actor times out, the profile flips private, the URL stops resolving), the failure increments `Submission.consecutiveVisibilityFailures`. After **two consecutive failures**, the scheduler invokes `RefundService.requestAfterApproval(submissionId, reason, systemUser)` — posting a compensating ledger group that returns the bounty's payout to the brand and (if `PAYOUTS_ENABLED=true`) initiates a Stitch outbound transfer.

This is the platform spending money — moving funds out of the hunter's earnings and back to the brand — **without a human in the loop**, on the basis of an automated read of an external service (Apify). That deserves an explicit decision record, not a buried implementation detail.

## Decision

The auto-refund path is allowed, gated by the following constraints (all enforced in code, not aspirational):

### 1. Two-failure threshold

The threshold for "post is gone" is **two consecutive failed re-scrapes**, never one.

Rationale: a single failed Apify call can be the actor having a bad minute, a transient platform rate-limit, a CDN hiccup. Two failures across a ≥6h gap (the cron cadence) is a much stronger signal that the post itself is not retrievable. This trades a 6-hour lag in the worst case for a meaningful reduction in false-positive refunds.

The counter resets to zero on any successful re-scrape (`submission-scraper.service.ts:rescrapeForVisibility`). A single intermittent failure between two successes therefore never triggers a refund.

### 2. First-failure is observable, not actionable

On the **first** failure for a given submission:
- Log line emitted from the scheduler.
- `KbService.recordRecurrence({ category: 'post_visibility', system: 'submission-scraper', severity: 'warning', errorCode: 'POST_VISIBILITY_FIRST_FAILURE', metadata: { submissionId, channel, url } })` — auto-flagged as Ineffective Fix on the second occurrence within 90d (existing KB pattern from §6 of `claude.md`), so structural Apify or platform issues surface to the admin dashboard before they cascade into mass refunds.
- Hunter notified by email (template: `apps/api/src/modules/mail/templates/post-visibility-warning-hunter.hbs`) so they have ~6h before the next tick to fix the issue or contact the brand. **Brand is not notified on first failure** — keeps the brand's inbox quiet for the noise case.

On the **second** consecutive failure:
- `RefundService.requestAfterApproval` invoked.
- `AuditLog` entry written with `action = AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND` and a structured `metadata` payload (submissionId, bountyId, hunterId, both failure timestamps, `errorMessage`s).
- Both brand and hunter notified by email (`post-removed-brand.hbs` + `post-removed-hunter.hbs`).
- Counter reset (so a third future failure starts fresh).

### 3. Kill switch is absolute (and fail-closed)

The Financial Kill Switch (`SystemSetting.financial.kill_switch.active`) **blocks** the auto-refund. The scheduler calls `LedgerService.isKillSwitchActive()` immediately before invoking `RefundService.requestAfterApproval` and short-circuits with a log line + KB recurrence (`errorCode: 'POST_VISIBILITY_REFUND_KILL_SWITCHED'`) if active.

The kill-switch read itself is **fail-closed** — `isKillSwitchActive().catch(true)` — so a transient DB read failure biases toward not moving money. A switch we can't read is treated as on.

When the gate trips, `consecutiveVisibilityFailures` is held at its pre-tick value (typically `1`) rather than pinned at `2`. This preserves the retry semantic (the next tick after the switch clears will trigger the refund) without leaving rows in a state that, post-hoc, looks like 3+ failures occurred.

Per ADR 0006, only `compensating_entry` posts may bypass the kill switch — and only from the two enumerated Super-Admin call sites in `FinanceAdminService`. The visibility scheduler is **not** on that list, and per ADR 0006's "scoped to one action type" constraint must not be added to it. The auto-refund therefore queues until the kill switch is cleared by an admin investigating the underlying incident — exactly the right behaviour during a financial incident.

### 4. Per-bounty cost cap

A bounty whose visibility scheduler has already triggered `MAX_VISIBILITY_RESCRAPES_PER_BOUNTY = 30` re-scrapes (across all of its submissions, counted by `SubmissionUrlScrapeHistory` rows for submissions belonging to that bounty) is skipped on subsequent ticks. Prevents a popular bounty whose hunters are gaming the visibility rule from running the platform's Apify spend dry.

The cap is generous enough that legitimate bounties (≤10 submissions, weekly cadence, ≤30 day window) never approach it under normal operation. Bounties that hit the cap surface as a `KbService.recordRecurrence({ errorCode: 'VISIBILITY_RESCRAPE_CAP_REACHED', ...})` for admin attention.

### 5. Counter caps

`consecutiveVisibilityFailures` is the only state that drives the auto-refund. It is incremented inside the same `prisma.$transaction` as the history-row write, never updated outside that path. There is no API or admin UI to set it directly — admins who want to suppress an auto-refund for a specific submission must use `RefundService` overrides directly, leaving an audit trail.

### 6. Audit trail is the contract

Every auto-refund writes:
- A `LedgerTransactionGroup` row (the compensating entry, balanced double-entry per Non-Negotiable #1).
- An `AuditLog` row with `action = SUBMISSION_VISIBILITY_AUTO_REFUND`, `actorId = STITCH_SYSTEM_ACTOR_ID`, and the structured failure metadata.
- A `SubmissionUrlScrapeHistory` row capturing the second failure that triggered the refund.
- A `RecurringIssue` row (or bumped occurrences on an existing one) under `category = 'post_visibility'`.

Together these four artefacts let an admin reconstruct exactly why the refund happened, when, and against what evidence. Hard Rule #3 + Section 4 §6 are satisfied.

## Risks & mitigations

**Risk 1 — Apify systemic failure causes mass false refunds.** A bug in `apify/instagram-scraper` or a platform API change could 404 every Instagram URL globally for a window. Two ticks (12h) later, every approved Instagram submission is auto-refunded — potentially thousands of dollars in incorrect movements.

*Mitigation.* The KB recurrence on first failure (constraint #2) bumps `errorCode: POST_VISIBILITY_FIRST_FAILURE` for every affected submission. Phase 3D adds a per-channel failure-rate analytics endpoint + insights surface (warning ≥30% across ≥10 settled rows, critical ≥50% across ≥20) so admins see the cluster before the second tick. They can flip the kill switch (constraint #3) to pause all auto-refunds while they confirm whether it's an Apify bug. Refunds resume — or are manually overridden — once the underlying cause is known.

**Future hardening.** A pre-refund "is this a global outage?" check inside the scheduler itself — query the last 30 minutes of `SubmissionUrlScrapeHistory` for failure rate by channel; if >50% of recent re-scrapes for the same channel failed, skip the refund and log "suspected outage". Not in scope for this ADR — the analytics surface + manual kill switch is the answer for now.

**Risk 2 — Hunter takes down their own post intentionally.** The auto-refund correctly triggers, but the hunter has effectively been paid for content they retracted. The platform recovers the money but the hunter has banked it for whatever 12h+N period elapsed.

*Mitigation.* The clearance period (`CLEARANCE_HOURS`, currently 48h on Free plan, see `md-files/payment-gateway.md`) means the hunter's earnings only become withdrawable some hours after approval. Most auto-refunds will land while funds are still in the clearance reserve, so no real cash leaves the platform. Cases where the hunter withdraws faster than the 12h-minimum auto-refund window are absorbed by the platform — accepted as a fraud-tolerance cost given the alternative (no auto-refund) leaves the brand permanently out-of-pocket.

**Risk 3 — Brand gets refunded for a post that's actually fine.** The Apify scraper returns "post not found" for a post that's still publicly accessible (rare but happens — caching, geo-blocking, account-level rate limits).

*Mitigation.* Two-failure threshold (constraint #1) plus the manual override path (`RefundService.adminReverseRefund`, audit-logged) for the brand to flag false-positive refunds. The hunter's email on first failure (constraint #2) gives them a chance to reach out and pre-empt the refund — they can prove the post is live before the second tick.

**Risk 4 — Kill-switch deadlock.** During a long financial incident, every approved submission's clock is ticking. If the kill switch is active for >6h, the visibility scheduler's checks log `POST_VISIBILITY_REFUND_KILL_SWITCHED` repeatedly but no refunds fire. When the switch clears, all queued auto-refunds drop in at once.

*Mitigation.* This is by design — refunds during a financial incident would compound the integrity problem. Admins operating the kill switch own the responsibility to clear it before the visibility queue grows unmanageable. The Phase 3B admin surface displays `consecutiveVisibilityFailures` per submission so the queue depth is observable.

## Out of scope (explicitly deferred)

- **Pre-refund outage detection** in the scheduler itself (cross-submission failure-rate aggregation, distinct from the Phase 3D admin-facing analytics).
- **Per-hunter rate limit on auto-refunds.** A hunter who consistently has posts auto-refunded is suspicious; a rate limit would surface them. Defer until pattern data exists.
- **Refund-decision review queue.** Some teams will want every auto-refund to land in a human review queue first before the ledger move. Out of scope here — the platform's MVP cycle prioritises throughput. Add behind a `AUTO_REFUND_HUMAN_REVIEW_REQUIRED` flag if commercial pressure demands.

## References

- `apps/api/src/modules/submissions/submission-visibility.scheduler.ts` — implementation
- `apps/api/src/modules/submissions/submission-scraper.service.ts:rescrapeForVisibility` — call path
- `apps/api/src/modules/refunds/refunds.service.ts:requestAfterApproval` — refund post path
- `apps/api/src/modules/ledger/ledger.service.ts:isKillSwitchActive` — kill switch helper
- `packages/shared/src/constants.ts:AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND` — audit action
- `~/.claude/plans/quizzical-growing-owl.md` — feature plan
- ADR 0006 — kill-switch bypass scope (this ADR honours it)
- `md-files/financial-architecture.md` — ledger mechanics
- `md-files/knowledge-base.md` — KB schema + auto-flag rules
