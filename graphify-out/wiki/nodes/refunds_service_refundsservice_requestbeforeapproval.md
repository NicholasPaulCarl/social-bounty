# `RefundsService.requestBeforeApproval()`

> The pre-approval refund path — rejects/withdraws a submission and reverses the brand's reserved funds via a compensating ledger entry.

## What it does

`RefundsService.requestBeforeApproval(submissionId, reason, actor)` is the pre-approval refund path. Called when: (a) a brand rejects a PENDING submission; (b) a hunter withdraws a PENDING submission; (c) a bounty expires without the submission being reviewed in time. It writes a compensating `LedgerTransactionGroup` via `LedgerService.postTransactionGroup` that releases the brand's reserved funds back to their available balance — the leg pair is `brand_reserve DEBIT` / `brand_available CREDIT`, `actionType: 'refund_before_approval'`. The companion method `requestAfterApproval(submissionId, reason, actor)` handles the post-approval refund path (triggered by the ADR 0010 auto-refund scheduler for consecutive visibility failures) and issues a different leg pair that reverses the hunter's already-credited earnings.

## Why it exists

Separating the two refund paths (`before-` vs `after-approval`) is critical because the money is in different ledger accounts by the two points in time. Before approval, funds sit in `brand_reserve`; after approval, funds have moved to `hunter_available` with commission + global-fee splits. The compensating entries must reverse exactly what was posted. Hard Rule #3 is satisfied via `AuditService.log()` inside the ledger transaction. ADR 0005 (idempotency) + ADR 0006 (compensating entries bypass the kill switch with `allowDuringKillSwitch: true`) apply directly. Phase 3A's visibility auto-refund (commit `f24bde6`) is a direct consumer of the `requestAfterApproval` sibling.

## How it connects

- **`RefundsService` (class)** — the enclosing service; `requestBeforeApproval` is one of its two primary methods.
- **`LedgerService.postTransactionGroup`** — the ledger-write delegate, with `allowDuringKillSwitch: true` for the compensating-entry escape (ADR 0006).
- **`AuditService.log`** — per-refund audit row inside the transaction.
- **`BountiesService`** — invokes this path when a bounty's submission is rejected or withdrawn pre-approval.
- **`SubmissionsService.review`** — when a brand rejects a PENDING submission, the rejection path calls this.
- **`WebhookRouterService.dispatch`** — routes Stitch `REFUND+PROCESSED` events to `RefundsService.onRefundProcessed` (a sibling method that reconciles with the outbound provider after it confirms the money has left the platform).
- **ADR 0005 — Ledger Idempotency** — governs the `UNIQUE(referenceId, actionType)` guard on this method's writes.
- **ADR 0006 — Compensating Entries Bypass the Kill Switch** — governs the `allowDuringKillSwitch: true` flag this method passes.

---
**degree:** 16 • **community:** "Bounty access & mutation" (ID 15) • **source:** `apps/api/src/modules/refunds/refunds.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the two-refund-path design is load-bearing — conflating them would mean a single method deciding which account to touch based on submission state, which is a runtime branch on financial code. The current split makes each path's leg-pair shape statically inspectable.
