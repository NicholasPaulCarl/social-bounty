# Per-System KB Drill-Down — `/admin/finance/insights/[system]`

**Route path:** `/admin/finance/insights/[system]`
**File:** `apps/web/src/app/admin/finance/insights/[system]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** **Drill-down only** — reached via card click from `/admin/finance/insights`.
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
List of all `RecurringIssue` rows filed against a specific `metadata.system` value (e.g. `stitch.webhooks`, `submission-scraper`, `reconciliation.reserves`). Most recent first. Highlights ineffective-fix rows (Phase 4 auto-flag) and resolved rows. Full audit-style view for engineering RCA. <!-- historical -->

## Entry & exit
- **Reached from:** `/admin/finance/insights` card click → `router.push('/admin/finance/insights/{encodeURIComponent(system)}')`.
- **Links out to:** "Back to insights" link (top-left). No per-row drilldowns — the `kbEntryRef` column shows the KB citation (e.g. `KB-2026-04-15-001`) but is not hyperlinked to the KB file itself.

## Data
- **React Query hooks:** `useSystemInsights(system)` (only fires when `system` is truthy)
- **API endpoints called:**
  - GET `/api/v1/admin/kb/insights/{system}` (URL-encoded)
- **URL params:** `system` — path segment, URL-decoded once via `decodeURIComponent(params.system)`
- **Search params:** none

## UI structure
- Back link at the top: "Back to insights" (pink-600 `ArrowLeft` chevron).
- `PageHeader` with title `"KB drill-down · {system}"`, subtitle "All RecurringIssue rows filed against this system, most recent first.". Action: Refresh.
- If zero rows: `EmptyState` with `LineChart` icon, title "No issues recorded", message `"No RecurringIssue rows matched metadata.system = \"{system}\"."`.
- Otherwise `<Card>` wrapping a paginated `<DataTable>` (25/page), stripedRows, custom `rowClassName`: <!-- historical -->
  - Ineffective-fix rows get `bg-danger-50/40` tint.
  - Resolved rows get `opacity-60` (muted).
- Columns: Severity Tag (via `SEVERITY_MAP` — critical=danger, warning=warning, info=info), Category, Signature (mono xs, break-all), Title, Hits (`occurrences`), Flags (Ineffective fix Tag with `AlertTriangle` icon if set), Status (resolved=success / open=warning), First seen (mono datetime), Last seen (mono datetime), KB ref (mono or `—`).

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** `EmptyState` with `LineChart` icon + explainer (see above).
- **Error:** `ErrorState` with retry CTA.
- **Success:** Table rendered; paginated.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Back to insights | `Link` | `/admin/finance/insights` |
| Refresh | `refetch()` | Re-query the system insights |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — this page is read-only
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: read-only surface, unaffected.

Page-specific:
- Per-system view of all 7 reconciliation checks indirectly (since reconciliation calls `KbService.recordRecurrence({ system, category, … })` from each check). For example, `system='reconciliation.reserves'` collects reserve-vs-bounty findings; `system='stitch.webhooks'` collects webhook-failure recurrences. <!-- historical -->
- Displays **live** state (React Query cache only — no polling here; rely on manual Refresh).
- No write operations. Ineffective-fix flags are set upstream by `KbService` when a previously-resolved issue recurs inside the 90 d window (CLAUDE.md §2 "If an issue recurs, treat it as a structural flaw, not a bug").

## Edge cases
- `system` segment empty / whitespace — hook disabled (`enabled: Boolean(system)`).
- Unknown system — empty state rendered.
- System name with slashes / special characters — `encodeURIComponent` in the link + single `decodeURIComponent` on the header.
- Resolved row mixed with open — resolved rendered at 60% opacity so active triage still stands out.
- Ineffective-fix AND resolved — the danger tint dominates (tint applied before opacity in the `rowClassName` logic — verify precedence if both apply).
- Signature column is free text (e.g. `SQLSTATE 25P02`) — mono font, word-break to prevent overflow.
- `kbEntryRef` missing — `—` muted text.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/kb-admin.service.spec.ts` (or equivalent) — `getSystemInsights`; `KbService.recordRecurrence` path with ineffective-fix auto-flag.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useSystemInsights`
- `apps/web/src/lib/api/finance-admin.ts` — `getSystemInsights`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatDateTime`
- `packages/shared/src/types/finance-admin.ts` — `KbSystemIssueRow`
- Backend: `apps/api/src/modules/kb/kb.service.ts` (system insights + ineffective-fix auto-flag)
- `md-files/knowledge-base.md` — KB schema + entry template
- `scripts/kb-context.ts` — CLI tool for KB context (Phase 4 automation)

## Open questions / TODOs
- `kbEntryRef` not hyperlinked — would ideally link to the KB markdown section via anchor (deferred; `md-files/knowledge-base.md` lives in-repo so a client-side markdown link is a small feature).
- No "mark resolved" action — state must be transitioned upstream by the engine.
- No filter by severity / resolved — list shows everything for the system.
- Signature column may overflow for long IDs; the `break-all` class prevents page overflow but creates ragged rows.
- Phase 4+ KB analytics for non-visibility categories cited in `/admin/finance/insights` as "still deferred" — this page is the likely home for the drilldown.
