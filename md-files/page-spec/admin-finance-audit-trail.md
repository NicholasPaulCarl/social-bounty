# Finance Audit Trail — `/admin/finance/audit-trail`

**Route path:** `/admin/finance/audit-trail`
**File:** `apps/web/src/app/admin/finance/audit-trail/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (7th position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Filtered view of the `AuditLog` table limited to finance-relevant actions: refund approvals, payout retries, manual overrides, kill-switch toggles, funding events, reconciliation runs. Read-only. Satisfies CLAUDE.md Hard Rule #3 (audit logs required for all admin actions and status changes) — this page lets SA confirm that rule is being held in practice.

## Entry & exit
- **Reached from:** Finance sub-nav "Audit Trail" tab.
- **Links out to:** No inline drilldowns on this surface. Entity IDs are rendered in mono text but not hyperlinked; operators cross-reference by copy-paste.

## Data
- **React Query hooks:** `useFinanceAuditTrail(200)` (limit hardcoded to 200)
- **API endpoints called:**
  - GET `/api/v1/admin/finance/audit-trail?limit=200`
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Finance audit trail", subtitle "Refund, payout, override, kill-switch, funding, and approval actions". Action: Refresh.
- Single `<Card>` wrapping a paginated `<DataTable>` (25/page), stripedRows. <!-- historical -->
- Columns: When (mono datetime), Action (Tag — plain — the action name e.g. `REFUND_APPROVED`, `PAYOUT_RETRIED`, `OVERRIDE_POSTED`, `KILL_SWITCH_TOGGLED`), Entity type (free text), Entity ID (mono xs), Actor (truncated 8-char user id), Reason (text or `—`).

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Natural DataTable empty when there have been no finance-relevant admin actions in the window.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Re-fetches on `Refresh`; no polling.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query the last 200 audit rows |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- **AuditLog required for every mutation (Hard Rule #3) — this page is the visible enforcement surface.** Every finance mutation lands here.
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: read-only surface, unaffected. Kill-switch toggle actions are themselves audited and rendered as rows here.

Page-specific:
- No direct reconciliation check, but is the observability surface for all check-triggered actions (e.g. a reconciliation run that auto-activates the kill switch writes a `RECONCILIATION_RUN` row + a `KILL_SWITCH_TOGGLED` row).
- Displays **live** state; re-fetches on manual refresh only.
- No write operations on this surface.
- Actions surfaced include `SUBMISSION_VISIBILITY_AUTO_REFUND` (Phase 2A constant) when the visibility scheduler fires a refund.

## Edge cases
- Empty list in a seed / dev environment — natural empty.
- Actor id `null` (system action) — rendered as the 8-char slice of `null` string or empty; backend typically writes `system` for scheduled tasks (verify downstream).
- Action longer than the column allows — `Tag` auto-sizes.
- Hardcoded `limit=200` — older audit rows not visible from this page; for deeper history operators hit `/admin/audit-logs` (platform-wide) or filter via backend.
- Concurrent writes — order by `createdAt` desc keeps the feed stable; ties broken by insert order.
- Entity ID references may be stale if the entity was deleted — still shown in the log per append-only rule.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `listAuditTrail`; audit-log write coverage in each mutating service (refund, payout, override, kill-switch, reconciliation).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useFinanceAuditTrail`
- `apps/web/src/lib/api/finance-admin.ts` — `getAuditTrail`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatDateTime`
- `packages/shared/src/types/finance-admin.ts` — `FinanceAuditRow`
- Backend: `apps/api/src/modules/audit/audit.service.ts`, all mutating services
- `packages/shared/src/constants/audit-actions.ts` — `AUDIT_ACTIONS`
- CLAUDE.md Hard Rule #3; `/admin/audit-logs` sibling page for platform-wide view

## Open questions / TODOs
- No filters (action type / actor / entity / date range) — operators scroll or page.
- No drill-down — entity IDs are copy-paste only (e.g. no link to `/admin/finance/groups/{id}` even when entityType = `LedgerTransactionGroup`).
- Hardcoded limit of 200 — deeper history requires `/admin/audit-logs` and/or a backend query.
- Actor column shows a truncated id; resolving to user name is deferred (expensive join).
