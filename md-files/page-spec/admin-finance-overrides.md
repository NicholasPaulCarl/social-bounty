# Manual Override — `/admin/finance/overrides`

**Route path:** `/admin/finance/overrides`
**File:** `apps/web/src/app/admin/finance/overrides/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (8th position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Write a balanced, append-only **compensating ledger entry** by hand. This is the operator escape hatch for correcting reconciliation drift that can't be resolved via the normal flow (refund, payout retry, etc). Per CLAUDE.md §4 point 5 (append-only ledger): there are no updates or deletes — corrections must be compensating entries. Per ADR 0006, overrides **bypass the Kill Switch by design** (the whole point is to let SA repair the ledger when the switch is tripped).

## Entry & exit
- **Reached from:** Finance sub-nav "Overrides" tab.
- **Links out to:** Success toast references the new `transactionGroupId` — operator can navigate manually to `/admin/finance/groups/{id}` for the resulting entry.

## Data
- **React Query hooks:** `usePostOverride()`
- **API endpoints called:**
  - POST `/api/v1/admin/finance/overrides` (audited)
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Manual override", subtitle "Compensating ledger entries — bypasses Kill Switch by design".
- Yellow `<Message severity="warn">` banner: "Overrides write append-only compensating entries to the ledger. They run even when the Kill Switch is active. Every entry is audited; both debits and credits must balance."
- `<Card title="New override">` with:
  - Two required text fields: Reason (≥ 10 chars, for audit log), Description (≥ 10 chars, group label).
  - Dynamic list of legs — each leg has: Account (`Dropdown` of 16 known accounts: `brand_cash_received`, `brand_reserve`, `brand_refundable`, `hunter_pending`, `hunter_clearing`, `hunter_available`, `hunter_paid`, `hunter_net_payable`, `commission_revenue`, `admin_fee_revenue`, `global_fee_revenue`, `processing_expense`, `payout_fee_recovery`, `bank_charges`, `gateway_clearing`, `payout_in_transit`), Type (DEBIT / CREDIT), Amount (cents, integer-only — regex-cleaned).
  - "Add leg" button to extend the list; Trash icon per leg (disabled when only 2 legs remain).
  - Live running total box: `DEBIT total: N cents / CREDIT total: N cents` + green `Balanced` or red `Unbalanced — debits must equal credits, both > 0`.
  - Confirmation input — operator must type the literal word `OVERRIDE` to enable the Post button.
  - "Post override" submit button (danger severity warning, disabled unless all validations pass).

## States
- **Loading:** Button shows loading spinner via `loading={post.isPending}`; form remains interactive until submission.
- **Empty:** N/A — form is always pre-populated with 2 empty legs.
- **Error:** Toast on submit failure.
- **Success:** Toast `"Override posted as group {id}…"`; form resets to 2 empty legs.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Add leg | `setLegs` | Appends an empty leg row |
| Remove leg (trash per row) | `setLegs` filter | Drops the leg; disabled when ≤ 2 legs |
| Post override | POST `/admin/finance/overrides` | Writes the balanced compensating group + AuditLog row |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- **Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity** — the form enforces debit-equals-credit balance client-side; backend validates + enforces idempotency.
- **Integer minor units, append-only ledger** — amount is regex-constrained to digits; no floats. Override writes a new group, never updates.
- **AuditLog required for every mutation** — `OVERRIDE_POSTED` audit row with the operator's `reason` (min 10 chars).
- Plan snapshot per transaction (tier not re-priced) — overrides do not re-price; they are corrections.
- Global 3.5% fee independent of tier admin fee — the `global_fee_revenue` account is present in the dropdown; corrections to it must be posted directly.
- **Kill switch: override bypasses the kill switch by design** (ADR 0006). The banner says so explicitly.

Page-specific:
- No reconciliation check; this page is the remediation surface for findings on the Exceptions / Reserves / Earnings & Payouts pages.
- Displays **live** form state.
- Write operations:
  - `LedgerEntry` rows (one per leg) inside a `LedgerTransactionGroup`
  - `AuditLog` row with reason
  - Both committed in a single DB transaction per §4 point 3 (transaction-group integrity)

## Edge cases
- Debits != credits — Balanced flag stays red; submit disabled.
- Any leg missing account or amount — submit disabled.
- Reason or description under 10 chars — submit disabled.
- Confirmation text != `OVERRIDE` — submit disabled.
- Same override posted twice (operator double-click) — idempotency at backend prevents dupe; the second call returns the first group's id.
- Account not in dropdown — defensive UI prevents typing a free string; additions require a source-code change (intentional — wide-open account strings are a liability).
- Zero-amount legs — blocked by `/^\d+$/` cleanse + non-empty check.
- Kill switch active — the API accepts the override per ADR 0006 (explicitly exempt).
- Concurrent override posts — independent referenceIds (generated server-side); no lock contention.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `postOverride` + idempotency + bypass-kill-switch case.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `usePostOverride`
- `apps/web/src/lib/api/finance-admin.ts` — `postOverride`
- `apps/web/src/components/common/PageHeader.tsx`
- `packages/shared/src/types/finance-admin.ts` — `OverrideLeg`, `OverrideRequest`
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts`, `apps/api/src/modules/ledger/ledger.service.ts`
- `docs/adr/0006-compensating-entries-bypass-kill-switch.md` — rationale
- CLAUDE.md §4, §5 — financial non-negotiables + required tests for ledger code

## Open questions / TODOs
- Account dropdown is a hardcoded list (16 accounts) — adding a new account requires a source change; consider surfacing from backend `/api/v1/admin/finance/accounts` (deferred).
- No preview of the resulting ledger entry before submit — operator confirms via `OVERRIDE` text alone.
- No link from a KB / Exceptions row into a pre-populated override form — manual copy-paste each time.
- Labels on the warn banner could be richer (e.g. display kill-switch state so the operator knows before submit).
- Deferred items in `docs/reviews/2026-04-15-team-lead-audit-batch-*.md` flag override-UX as a Phase 4 item.
