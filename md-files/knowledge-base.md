# Knowledge Base

System-memory layer for incidents, fixes, and recurring patterns. Claude reads this file before proposing any fix (see `claude.md` §7).

Runtime recurring-issue tracking lives in the database (`RecurringIssue` table) and is surfaced in the Admin Dashboard — not in this file. This file holds **narrative incident records and structural lessons**.

> **Historical context (pre-2026-04-24):** Entries KB-2026-04-15-001 through KB-2026-04-15-004 describe incidents on the legacy Stitch Express integration, which was fully removed per ADR 0011 single-rail TradeSafe cutover (2026-04-24). The structural lessons — idempotency, response-shape verification, error-body surfacing, router-payload-tuple switching — remain applicable to TradeSafe integration work. <!-- historical -->

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

> **Historical (pre-2026-04-24 ADR 0011 cutover).** The legacy Stitch-era bug; the idempotency lesson still applies to TradeSafe work. <!-- historical -->

Date: 2026-04-15
Type: Financial
Severity: Critical
System: Payments
Module: payout-service
Environment: Production
Detected By: Reconciliation engine
Financial Impact: Critical
User Impact: Moderate
Tags: idempotency, retry, payout, historical-stitch

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

> **Historical (pre-2026-04-24 ADR 0011 cutover).** Legacy Stitch webhook routing bug; retained because the structural lesson (verify real payload shape before writing router logic) applies to TradeSafe and any future provider integration. <!-- historical -->

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: webhook-router-service
Environment: Sandbox
Detected By: Manual smoke test (first real sandbox payment completion)
Financial Impact: None
User Impact: Severe
Tags: webhook, historical-stitch, routing, payload-shape, brand-funding

### Summary
Historical — legacy provider webhook arrived and was stored, but the router switched on a field name / value pattern that never matched, so the brand-funding handler never ran and the bounty stayed DRAFT.

### Problem
Historical — after a live sandbox payment completed, `WebhookEvent` rows were persisted but no `LedgerEntry` rows appeared and the bounty did not flip to LIVE. Logs showed `LINK/PAID` being observed but no handler dispatching.

### Root Cause
Historical — `WebhookRouterService.dispatch` switched on `event.eventType` expecting values like `"payment.settled"` (resource.action form). The legacy provider actually sent `{ type: "LINK", status: "PAID", linkId, amount }` — a resource+status pair, not a dotted event type. No case matched, so dispatch silently no-op'd.

### Trigger
Webhook replay | **Other (external-provider payload shape assumption)**

### Action Taken
- Rewrote `WebhookRouterService.dispatch` to switch on the `(payload.type, payload.status)` tuple: `LINK/{PAID|SETTLED}` -> brand-funding settled, `WITHDRAWAL/{PAID|SETTLED}` -> payout settled, `REFUND/{PROCESSED|COMPLETED}` -> refund processed, plus the FAILED / EXPIRED variants.
- Updated `BrandFundingHandler.extractSettlementData` to understand the real `{ id, linkId, fees[] }` payload; kept the nested `{ data: { payment: { ... } } }` path for backwards compatibility.
- Confirmed `WebhookEvent` already persists the raw payload, which is what made this diagnosable.
- Added a dev-only replay endpoint for rerunning stored events (historical provider; endpoint removed post-cutover).

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
Historical — every new provider webhook type needs a matching case; a silent miss will not throw. Lesson carries over to TradeSafe.

### Lessons for Claude
For any webhook-receiving endpoint, capture one real sandbox payload into a test fixture before writing router logic. Never infer external payload shape from our own docs or prior integrations — verify against the live provider.

---

## [KB-2026-04-15-003] Stitch merchantReference rejects special characters (historical)

> **Historical (pre-2026-04-24 ADR 0011 cutover).** Legacy Stitch-specific validation bug; the structural lesson (embed provider response body in thrown errors, sweep every provider POST for reference-encoding constraints) applies to any provider integration. <!-- historical -->

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: historical-stitch-payments-service
Environment: Sandbox
Detected By: Manual smoke test (first fund attempt)
Financial Impact: None
User Impact: Severe
Tags: historical-stitch, validation, merchant-reference, error-surfacing, idempotency

### Summary
Historical — the legacy provider rejected `POST /payment-links` because `merchantReference = "bounty:{id}:fund"` contained colons; the error was swallowed as a generic "Invalid data provided" 500 until we surfaced the response body.

### Problem
Historical — first live brand-funding attempt failed with an opaque 500. The provider's real response was `400 "Reference should not contain special characters"` but our `ApiError` wrapper did not include the provider response body, so the underlying cause was invisible.

### Root Cause
Historical. Two compounding issues:
1. Our `merchantReference` pattern (`bounty:{id}:fund`) violated the legacy provider's undocumented alphanumeric-only constraint.
2. The provider `ApiError` threw with a generic message and dropped the provider response body, hiding the real 4xx reason.

### Trigger
Other — input-validation rule on the external provider, masked by our own error handling.

### Action Taken
- Collapsed `merchantReference` to alphanumeric only: `bountyfund{uuidCompact}t{timestamp}`. Made it unique-per-attempt to avoid collisions on retry.
- Applied the same alphanumeric pattern to payout merchantReferences and idempotency keys.
- Historical — tightened the provider `ApiError` to embed the full provider response body in the thrown message so future 4xx failures surface the real reason instead of a blank 500. (Pattern applied to `TradeSafeApiError` post-cutover.)

### Ledger Impact
None. The request never succeeded, so no ledger row was written.

### Files / Services Affected
- Historical: `apps/api/src/modules/payments/stitch-payments.service.ts` (file removed post-cutover) <!-- historical -->
- `apps/api/src/modules/payouts/payouts.service.ts`
- Historical: `apps/api/src/modules/stitch/stitch.client.ts` (file removed post-cutover) <!-- historical -->

### Data Impact
None.

### Outcome
Resolved.

### Pattern Classification
Historical structural flaw — same pattern (reference/idempotency-key encoding) existed in every legacy provider POST and in our error-handling wrapper. Lesson re-applied to TradeSafe adapter.

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

## [KB-2026-04-15-002] Stitch payment-links response shape mismatch (historical)

> **Historical (pre-2026-04-24 ADR 0011 cutover).** Legacy Stitch-specific integration bug; the structural lesson (verify external-API response shape against the live sandbox before writing the unwrap) applies to TradeSafe work. <!-- historical -->

Date: 2026-04-15
Type: Integration
Severity: High
System: Payments
Module: historical-stitch-client
Environment: Sandbox
Detected By: Manual smoke test (first live sandbox funding attempt)
Financial Impact: None
User Impact: Severe
Tags: historical-stitch, payment-links, response-shape, api-contract, brand-funding

### Summary
Historical — the legacy provider client's `createPaymentLink` method assumed the wrong response shape from `POST /api/v1/payment-links`; the parsed `id` and `hostedUrl` came back undefined and Prisma threw before any ledger write.

### Problem
Historical — first live sandbox funding attempt failed with `PrismaClientKnownRequestError: Argument hostedUrl is missing`. The provider had actually returned a valid 200 with a payment link, but our unwrap pulled nothing out of it.

### Root Cause
Historical — we typed the response as `{ data: { id, url, status } }`. The real provider response was `{ data: { payment: { id, link, status } } }` — nested under `payment`, with `link` (not `url`) as the URL key. A response-shape assumption that was never verified against the live sandbox.

### Trigger
Other — external-API response-shape assumption not grounded in the real API.

### Action Taken
- Historical — updated the response type and unwrapping in the legacy client's `createPaymentLink` to return `{ id: json.data.payment.id, url: json.data.payment.link, status: json.data.payment.status }`. Client code fully removed post-cutover.

### Ledger Impact
None. The request never reached a ledger write.

### Files / Services Affected
- Historical: `apps/api/src/modules/stitch/stitch.client.ts` (file removed post-cutover) <!-- historical -->

### Data Impact
None.

### Outcome
Resolved.

### Pattern Classification
Historical — the same assumption risk applied to every legacy provider client method not yet smoke-tested against the live sandbox. Lesson applied end-to-end to the TradeSafe GraphQL adapter (Phase 1b live sandbox smoke per ADR 0011).

### Related Entries
- KB-2026-04-15-003
- KB-2026-04-15-004

### Required Safeguards
- [x] Input validation (response typed against the real shape)
- [ ] Tests added (historical — integration fixture stubbing the legacy provider response was pending at time of removal)
- [ ] Monitoring / alerting (alert on unwrap returning undefined id/url — pending)

### Regression Risk
Historical — any new provider client method added without sandbox verification will repeat this. Lesson carries over to TradeSafe GraphQL adapter work.

### Lessons for Claude
When adding a new external-API client method, verify the response shape against the live sandbox before writing the unwrap logic. Write integration tests that stub the real response, not the imagined one.

---
