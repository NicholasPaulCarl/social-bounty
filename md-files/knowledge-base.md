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
