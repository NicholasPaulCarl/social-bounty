# Transaction Group Detail — `/admin/finance/groups/[transactionGroupId]`

**Route path:** `/admin/finance/groups/[transactionGroupId]`
**File:** `apps/web/src/app/admin/finance/groups/[transactionGroupId]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** **Drill-down only** — reached from multiple parents: `/admin/finance` (recent groups row click), Exception triage, Audit Trail, Overrides success toast, Refunds.
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Full transaction-group drill-down: header metadata, all ledger entries (debits + credits), and the associated audit log entry (actor, reason, before/after state JSON). This is the canonical "trace a ledger group end-to-end" screen.

**Historical note (CLAUDE.md):** This page's drill-down audit log initially rendered a wrong shape (local type declared `auditLog` as array; backend returns single-or-null). Fixed in commit `2eb7a0a` by swapping to shared `TransactionGroupDetail` type.

## Entry & exit
- **Reached from:**
  - `/admin/finance` overview (recent transaction groups table row click)
  - Any place that surfaces a `transactionGroupId` (Exceptions, Audit Trail, Overrides success toast, Refunds drilldowns)
  - Direct URL
- **Links out to:**
  - "Back to Finance" button (header action) → `/admin/finance`
  - Per-entry Links column: `/admin/users/{userId}`, `/admin/brands/{brandId}`, `/admin/bounties/{bountyId}`, `/admin/submissions/{submissionId}` (as applicable per leg)

## Data
- **React Query hooks:** `useTransactionGroup(id)` — `retry: false` so 404s don't spam the network
- **API endpoints called:**
  - GET `/api/v1/admin/finance/groups/{transactionGroupId}` (audited)
- **URL params:** `transactionGroupId` (uuid / ref id)
- **Search params:** none

## UI structure
- `PageHeader` with title `"Transaction group {referenceId}"`, subtitle = group description (if any). Action: Back to Finance.
- Group header `<Card>`:
  - 4-up responsive grid: Reference ID (mono, break-all), Action (Tag), Created (mono datetime), + optional description row below.
- Ledger entries `<Card title="Ledger entries">`:
  - `<DataTable>` stripedRows. Columns: Account (mono xs), Type (Tag — DEBIT=danger, CREDIT=success), Amount (mono cents), External reference (mono xs or `—`), Links (stacked mini-links for user / brand / bounty / submission — all 8-char id slices).
- Audit log `<Card title="Audit log">`:
  - If `auditLog === null`: "No audit log entry for this transaction group."
  - Otherwise a 3-up grid: Actor (id or `system`, with role chip), Action (plain label), When (mono datetime). Optional Reason block. Two `<JsonBlock>`s: "Before" and "After" state. JsonBlock collapses at > 400 chars with Expand/Collapse button.

## States
- **Loading:** `LoadingState type="detail"`
- **Empty:** N/A — either the group exists and has entries, or the route renders 404.
- **Error:**
  - 404 (`ApiError` + `statusCode === 404`) — `EmptyState` with `Search` icon, title "Transaction group not found", CTA "Back to Finance" → `/admin/finance`.
  - Other: `ErrorState` with retry CTA.
- **Success:** Detail renders; no polling.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Back to Finance | `router.push` | `/admin/finance` |
| Expand / Collapse (JSON blocks) | local state | Toggle truncation of >400-char JSON |
| user / brand / bounty / submission mini-links | `Link` | Respective admin drilldown |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- **Double-entry** — ledger-entries table typically shows an equal sum of DEBIT + CREDIT per group; the table renders both types colour-coded for visual verification.
- **Idempotency** via `UNIQUE(referenceId, actionType)` — referenceId is shown prominently in the header Card for easy copy-paste.
- **Transaction group integrity** — the very abstraction this page visualises.
- **Integer minor units, append-only ledger** — entries rendered via `formatCents`; no updates / deletes exist on the ledger so the shown rows are the full, final state.
- **AuditLog required for every mutation** — rendered in its own Card; "No audit log entry" indicates a bug for any operator-initiated or system mutation and should be reported.
- Plan snapshot per transaction (tier not re-priced) — snapshot JSON lives in `afterState` of the audit log when applicable.
- Global 3.5% fee independent of tier admin fee — visible as a discrete `global_fee_revenue` CREDIT leg when the group is a funding or subscription charge.
- Kill switch: read-only surface. Compensating override groups (posted via `/admin/finance/overrides`) surface here too and are not marked specially — same detail view regardless of kill-switch state at posting time.

Page-specific:
- This is the canonical drilldown target for reconciliation checks #1 (group balance), #3 (missing legs), #4 (status consistency) — any failed check that cites a `transactionGroupId` links here.
- Displays **live** state (no polling — entries are immutable, so no refresh needed after first load).
- No write operations.

## Edge cases
- 404 — `EmptyState` with Search icon + CTA.
- Audit log null — legitimate for some system-only groups (e.g. some inbound webhooks pre-audit refactor); rendered as a simple message.
- No `beforeState` / `afterState` on the audit log — `<JsonBlock>` returns null; sections gracefully omitted.
- Very large JSON (> 400 chars) — auto-truncation with an Expand control to avoid huge pages.
- All four link types absent on a leg — renders `—`. Legs like `global_fee_revenue` / `commission_revenue` typically have no entity linkage.
- Concurrent audit log write (e.g. double-refund correction race) — the audit log is 1:1 with the group per schema; the second write races on the unique key and fails (visible to the operator via a separate error path).
- Override group (posted from `/admin/finance/overrides`) — audit log shows actor + reason; no `beforeState`/`afterState` needed (overrides are additive).

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `getTransactionGroup` (including the CLAUDE.md `2eb7a0a` fix for the auditLog shape mismatch).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useTransactionGroup`
- `apps/web/src/lib/api/finance-admin.ts` — `getTransactionGroup`; re-exports `TransactionGroupDetailEntry`
- `apps/web/src/lib/api/client.ts` — `ApiError` (404 detection)
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`, `formatDateTime`
- `packages/shared/src/types/finance-admin.ts` — `TransactionGroupDetail`, `TransactionGroupDetailEntry` (commit `2eb7a0a` moved these to shared)
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts` (getGroup); ledger read-side
- `docs/adr/0005-ledger-idempotency-via-header-table.md`, `docs/adr/0006-compensating-entries-bypass-kill-switch.md`

## Open questions / TODOs
- No diff highlight between `beforeState` and `afterState` JSON — both rendered as plain `<pre>`. A colour-coded diff is a known UX improvement.
- Per-entry "trace" (which webhook / scheduler tick wrote this leg) is not shown; would require joining against `WebhookEvent` or `JobRun` tables.
- No "copy referenceId" icon; operators double-click / select-all manually.
- `retry: false` on the hook means a transient network error surfaces immediately as `ErrorState` — intentional for drilldowns but slightly brittle on flaky links.
