# Knowledge Base

System-memory layer for incidents, fixes, and recurring patterns. Claude reads this file before proposing any fix (see `claude.md` §7).

Runtime recurring-issue tracking lives in the database (`RecurringIssue` table) and is surfaced in the Admin Dashboard — not in this file. This file holds **narrative incident records and structural lessons**.

---

## KB Entry Schema

```
KBEntry
- id                 string              KB-YYYY-MM-DD-###
- title              string
- type               Bug | Incident | Regression | Improvement | Refactor | Financial | Integration
- severity           Low | Medium | High | Critical
- system             Wallet | Bounty | Admin | Auth | Payments | Integration
- module             string
- environment        Local | Staging | Production
- detectedBy         string
- financialImpact    None | Low | Medium | High | Critical
- userImpact         None | Minor | Moderate | Severe
- tags               string[]
- rootCause          string
- fixApplied         string
- relatedLedgerIds   string[]
- relatedEntries     string[]            (other KB entry ids)
- recurrenceCount    integer
- patternType        One-off | Emerging | Recurring | Structural flaw
- createdAt          ISO 8601
```

Severity and Financial Impact definitions are in `claude.md` §8.

---

## Entry Template

Copy this block for every new entry. Keep prose terse.

```
## [KB-YYYY-MM-DD-###] <Title>

Date:
Type:
Severity:
System:
Module:
Environment:
Detected By:
Financial Impact:
User Impact:
Tags:

### Summary
One or two sentences — what happened.

### Problem
Observed behaviour.

### Root Cause
The actual underlying cause. Not the symptom.

### Trigger
Retry | Timeout | Webhook replay | Race condition | Config drift | Other

### Action Taken
- Fix 1
- Fix 2

### Ledger Impact
Duplication? Imbalance? Reconciliation affected?

### Files / Services Affected
- path/to/file.ts
- service-name

### Data Impact
What data was affected; whether repair was needed.

### Outcome
Resolved | Mitigated | Monitoring | Open

### Pattern Classification
One-off | Emerging | Recurring | Structural flaw

### Related Entries
- KB-YYYY-MM-DD-###

### Required Safeguards
- [ ] Idempotency
- [ ] Input validation
- [ ] DB constraint
- [ ] Retry handling
- [ ] Logging
- [ ] Monitoring / alerting
- [ ] Tests added

### Regression Risk
Low | Medium | High — and why.

### Lessons for Claude
One or two durable takeaways future Claude sessions should apply.
```

---

## Example Entry

## [KB-2026-04-15-001] Duplicate payout on retry

Date: 2026-04-15
Type: Financial
Severity: Critical
System: Payments
Module: payout-service
Environment: Production
Detected By: Reconciliation engine
Financial Impact: Critical
User Impact: Moderate
Tags: idempotency, retry, payout, stitch

### Summary
Payout webhook retried after a 30s gateway timeout produced two ledger credits for the same bounty approval.

### Problem
Hunter wallet credited twice for bounty `b_8821`. Platform ledger imbalanced by the duplicated amount.

### Root Cause
Payout handler had no idempotency key; retries created a second `LedgerEntry` with a new `referenceId`.

### Trigger
Retry after timeout.

### Action Taken
- Added `idempotencyKey` parameter to payout handler, derived from `submissionId + actionType`.
- Added `UNIQUE(referenceId, actionType)` constraint to `LedgerEntry`.
- Backfilled reversing entry for the duplicate credit.

### Ledger Impact
One duplicate credit reversed via compensating debit; reconciliation passes.

### Files / Services Affected
- `apps/api/src/payments/payout.service.ts`
- `packages/prisma/schema.prisma` (LedgerEntry constraint)

### Data Impact
One hunter wallet corrected; audit log entries preserved.

### Outcome
Resolved.

### Pattern Classification
Structural flaw — applies to every ledger-writing handler, not just payouts.

### Related Entries
(none yet)

### Required Safeguards
- [x] Idempotency
- [x] DB constraint
- [x] Retry handling
- [x] Tests added
- [ ] Monitoring / alerting (pending)

### Regression Risk
Medium — other ledger-writing handlers need the same audit.

### Lessons for Claude
Always verify idempotency before modifying payout or ledger-writing code. A missing unique constraint is a structural flaw, not a bug — sweep the module for the same pattern.

---

## Entries

<!-- Append new entries below, newest first. -->

## [KB-2026-04-15-004] Webhook event-type routing mismatch

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: webhook-router-service
Environment: Sandbox
Detected By: Manual smoke test (first real sandbox payment completion)
Financial Impact: None
User Impact: Severe
Tags: webhook, stitch, routing, payload-shape, brand-funding

### Summary
Stitch webhook arrived and was stored, but the router switched on a field name / value pattern that never matched, so the brand-funding handler never ran and the bounty stayed DRAFT.

### Problem
After a live sandbox payment completed, `WebhookEvent` rows were persisted but no `LedgerEntry` rows appeared and the bounty did not flip to LIVE. Logs showed `LINK/PAID` being observed but no handler dispatching.

### Root Cause
`WebhookRouterService.dispatch` switched on `event.eventType` expecting values like `"payment.settled"` (resource.action form). Stitch actually sends `{ type: "LINK", status: "PAID", linkId, amount }` — a resource+status pair, not a dotted event type. No case matched, so dispatch silently no-op'd. `BrandFundingHandler.extractSettlementData` also assumed the older `{ data: { payment: { ... } } }` shape instead of the real `{ id, linkId, fees[] }`.

### Trigger
Webhook replay | **Other (external-provider payload shape assumption)**

### Action Taken
- Rewrote `WebhookRouterService.dispatch` to switch on the `(payload.type, payload.status)` tuple: `LINK/{PAID|SETTLED}` -> brand-funding settled, `WITHDRAWAL/{PAID|SETTLED}` -> payout settled, `REFUND/{PROCESSED|COMPLETED}` -> refund processed, plus the FAILED / EXPIRED variants.
- Updated `BrandFundingHandler.extractSettlementData` to understand the real `{ id, linkId, fees[] }` payload; kept the nested `{ data: { payment: { ... } } }` path for backwards compatibility.
- Confirmed `WebhookEvent` already persists the raw payload, which is what made this diagnosable.
- Added a dev-only replay endpoint `POST /webhooks/stitch/replay/:eventId` for rerunning stored events.

### Ledger Impact
None. The handler was never reached, so no entries were written. Once routing was fixed, the ledger was correct end-to-end (no replay or psql surgery needed).

### Files / Services Affected
- `apps/api/src/modules/webhooks/webhook-router.service.ts`
- `apps/api/src/modules/payments/brand-funding.handler.ts`

### Data Impact
One DRAFT bounty blocked from going LIVE until the router was fixed; no corrupt data, no repair required.

### Outcome
Resolved.

### Pattern Classification
Structural flaw — any new webhook type we add will hit this unless we verify the real payload shape first.

### Related Entries
- KB-2026-04-15-002
- KB-2026-04-15-003

### Required Safeguards
- [x] Input validation (switch now covers the real tuple space)
- [x] Logging (raw payload persisted on `WebhookEvent`)
- [x] Tests added (fixture captured from real sandbox payload)
- [ ] Monitoring / alerting (alert on `dispatch` no-op for known types — pending)

### Regression Risk
Medium — every new Stitch webhook type needs a matching case; a silent miss will not throw.

### Lessons for Claude
For any webhook-receiving endpoint, capture one real sandbox payload into a test fixture before writing router logic. Never infer external payload shape from our own docs or prior integrations — verify against the live provider.

---

## [KB-2026-04-15-003] Stitch merchantReference rejects special characters

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: stitch-payments-service
Environment: Sandbox
Detected By: Manual smoke test (first fund attempt)
Financial Impact: None
User Impact: Severe
Tags: stitch, validation, merchant-reference, error-surfacing, idempotency

### Summary
Stitch rejected `POST /payment-links` because `merchantReference = "bounty:{id}:fund"` contained colons; the error was swallowed as a generic "Invalid data provided" 500 until we surfaced the response body.

### Problem
First live brand-funding attempt failed with an opaque 500. Stitch's real response was `400 "Reference should not contain special characters"` but our `StitchApiError` did not include the provider response body, so the underlying cause was invisible.

### Root Cause
Two compounding issues:
1. Our `merchantReference` pattern (`bounty:{id}:fund`) violated Stitch's undocumented alphanumeric-only constraint.
2. `StitchApiError` threw with a generic message and dropped the provider response body, hiding the real 4xx reason.

### Trigger
Other — input-validation rule on the external provider, masked by our own error handling.

### Action Taken
- Collapsed `merchantReference` to alphanumeric only: `bountyfund{uuidCompact}t{timestamp}`. Made it unique-per-attempt to avoid collisions on retry.
- Applied the same alphanumeric pattern to payout merchantReferences and idempotency keys.
- Tightened `StitchApiError` to embed the Stitch response body in the thrown message so future 4xx failures surface the real reason instead of a blank 500.

### Ledger Impact
None. The request never succeeded, so no ledger row was written.

### Files / Services Affected
- `apps/api/src/modules/payments/stitch-payments.service.ts`
- `apps/api/src/modules/payouts/payouts.service.ts`
- `apps/api/src/modules/stitch/stitch.client.ts`

### Data Impact
None.

### Outcome
Resolved.

### Pattern Classification
Structural flaw — same pattern (reference/idempotency-key encoding) exists in every Stitch POST and in our error-handling wrapper.

### Related Entries
- KB-2026-04-15-002
- KB-2026-04-15-004

### Required Safeguards
- [x] Input validation (alphanumeric-only reference generator)
- [x] Logging (provider response body embedded in thrown error)
- [x] Retry handling (unique-per-attempt reference avoids collision on retry)
- [ ] Tests added (client-side regex guard on merchantReference — pending)

### Regression Risk
Low — the reference generator is centralised; the error-surfacing change is generic.

### Lessons for Claude
Never swallow 4xx response bodies from external providers — always embed the body in the thrown error. Validate merchantReference / idempotency-key patterns in the client method before POSTing, not after a provider 400.

---

## [KB-2026-04-15-002] Stitch payment-links response shape mismatch

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: stitch-client
Environment: Sandbox
Detected By: Manual smoke test (first live sandbox funding attempt)
Financial Impact: None
User Impact: Severe
Tags: stitch, payment-links, response-shape, api-contract, brand-funding

### Summary
`StitchClient.createPaymentLink` assumed the wrong response shape from `POST /api/v1/payment-links`; the parsed `id` and `hostedUrl` came back undefined and Prisma threw before any ledger write.

### Problem
First live sandbox funding attempt failed with `PrismaClientKnownRequestError: Argument hostedUrl is missing`. Stitch had actually returned a valid 200 with a payment link, but our unwrap pulled nothing out of it.

### Root Cause
We typed the response as `{ data: { id, url, status } }`. The real Stitch response is `{ data: { payment: { id, link, status } } }` — nested under `payment`, with `link` (not `url`) as the URL key. This was a response-shape assumption that was never verified against the live sandbox.

### Trigger
Other — external-API response-shape assumption not grounded in the real API.

### Action Taken
- Updated the response type and unwrapping in `StitchClient.createPaymentLink` to return `{ id: json.data.payment.id, url: json.data.payment.link, status: json.data.payment.status }`.

### Ledger Impact
None. The request never reached a ledger write.

### Files / Services Affected
- `apps/api/src/modules/stitch/stitch.client.ts`

### Data Impact
None.

### Outcome
Resolved.

### Pattern Classification
Emerging — the same assumption risk applies to every other Stitch client method we have not yet smoke-tested against the live sandbox.

### Related Entries
- KB-2026-04-15-003
- KB-2026-04-15-004

### Required Safeguards
- [x] Input validation (response typed against the real shape)
- [ ] Tests added (integration fixture stubbing the real Stitch response — pending)
- [ ] Monitoring / alerting (alert on unwrap returning undefined id/url — pending)

### Regression Risk
Medium — any new Stitch client method added without sandbox verification will repeat this.

### Lessons for Claude
When adding a new external-API client method, verify the response shape against the live sandbox before writing the unwrap logic. Write integration tests that stub the real response, not the imagined one.

---
