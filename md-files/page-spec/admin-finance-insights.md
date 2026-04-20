# KB Insights — `/admin/finance/insights`

**Route path:** `/admin/finance/insights`
**File:** `apps/web/src/app/admin/finance/insights/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (9th position — last entry)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Two-part dashboard:
1. **Phase 3D — Visibility failure rate (24 h)** — per-channel post-visibility re-scrape outcomes with two-tier alert thresholds (warning at 30% / critical at 50%, sample floors included). Surfaces Apify outages before the ADR 0010 auto-refund machinery compounds false positives.
2. **Per-system confidence** — score band (0–100) per system derived from open critical/high KB issues, 90-day recurrences, and recent failed reconciliation runs. Cards are clickable and drill into `/admin/finance/insights/{system}`.

## Entry & exit
- **Reached from:** Finance sub-nav "Insights" tab.
- **Links out to:** `/admin/finance/insights/{system}` via per-card click or keyboard (Enter/Space) — `encodeURIComponent(s.system)`.

## Data
- **React Query hooks:** `useAdminVisibilityAnalytics({ windowHours: 24 })` (30 s refetch), `useConfidenceScores()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/visibility-analytics?windowHours=24`
  - GET `/api/v1/admin/kb/confidence`
- **URL params:** none
- **Search params:** none (windowHours hardcoded at 24)

## UI structure
- `PageHeader` with title "KB insights", subtitle "Per-system confidence scores derived from open issues, 90d recurrences, and recent failed reconciliation runs.". Action: Refresh.
- Top section — `<VisibilityAnalyticsSection>`:
  - Eyebrow label "Visibility failure rate (24h)" + explainer paragraph referencing ADR 0010 Risk 1 + Refresh button.
  - PrimeReact `<Message>` alerts rendered above the table, one per service-emitted alert (warning / critical).
  - `<Card>` with `<DataTable>` — columns: Channel, Total, Verified (success green), Failed (danger red), Failure rate (colour-banded: < 10% success, 10–30% warning, > 30% danger; formatted as `XX.X%`).
  - Footer totals row: Total rows / Verified / Failed / Combined failure rate.
  - Inline own loading / empty / error states so failure-rate query doesn't block the confidence cards.
- Per-system grid: eyebrow "Per-system confidence", then a 3-up grid of clickable `<Card>`s.
  - Each card: system name (mono, top-left), severity Tag (top-right, colour-banded: ≥ 80 success / 60–79 warning / < 60 danger), optional `Ineffective fix(es)` Tag with `AlertTriangle` icon.
  - Giant mono score number (e.g. 72), eyebrow "Confidence score".
  - Counters: Critical open, High open, Recurrences (90 d), Failed recon (7 d).

## States
- **Loading:**
  - Analytics section: inline "Loading visibility analytics…" in a Card.
  - Confidence grid: `LoadingState type="cards-grid" cards={6}`.
- **Empty:**
  - Analytics: "No visibility re-checks recorded in the last 24h."
  - Confidence: `EmptyState` with `LineChart` icon, title "No insights yet", message "No KB recurrence data yet — once reconciliation flags an issue, systems will appear here."
- **Error:**
  - Analytics: red `<Message>` with the error text; grid still loads.
  - Confidence: `ErrorState` with retry CTA (short-circuits the page below the header).
- **Success:** Analytics polls every 30 s; confidence is manually refetched.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh (page header) | `refetch()` | Re-query confidence scores |
| Refresh (analytics) | analytics `refetch()` | Re-query visibility analytics |
| Card click / Enter / Space | `router.push` | `/admin/finance/insights/{system}` |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — this page is read-only
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: read-only surface. The visibility analytics explicitly positions itself as a pre-check to ADR 0010's auto-refund machinery — a channel-wide failure spike should prompt manual kill-switch activation from the Overview page.

Page-specific:
- Surfaces **all 7 reconciliation checks** transitively (Failed recon 7 d) through the confidence-score computation — each failed reconciliation run decrements the system's score.
- Phase 3D thresholds (from `docs/adr/0010`): warning at 30% failure rate AND ≥ 10 total; critical at 50% AND ≥ 20 total. Small-sample noise cannot trip critical.
- Displays **live** state; analytics polls every 30 s, matching the scheduler cadence.
- No write operations on this surface.

## Edge cases
- Zero systems with KB rows — `EmptyState` rendered.
- Analytics window has zero re-checks — empty-state message inside the card; the rest of the page still loads.
- Alerts with "warning" severity map to PrimeReact `warn`; "critical" → `error` (explicit map in `alertSeverityToMessageType`).
- Channel total below the sample-size floor — rate shown but no alert emitted.
- Score below 60 — danger banding; an Ineffective fix Tag may also display (Phase 4 KB auto-flag).
- Polling race (tab hidden / network slow) — React Query's stale-while-revalidate keeps the last-good view visible.
- Invalid `windowHours` (e.g. 0 or 5000) — backend clamps to `[1h, 720h]`, falls back to 24 h on NaN.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: Phase 3D `apps/api/src/modules/admin/finance-admin.service.spec.ts` (+16 tests covering empty window, all-VERIFIED, mixed rate, transient-row exclusion, warning + critical thresholds, sub-floor false-positive suppression, multi-channel isolation, totals roll-up, controller clamp + NaN fallback).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useConfidenceScores`, `useAdminVisibilityAnalytics`
- `apps/web/src/lib/api/finance-admin.ts` — `getConfidenceScores`, `getVisibilityAnalytics`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`
- `packages/shared/src/types/finance-admin.ts` — `ConfidenceScore`, `VisibilityAnalyticsResponse`, `VisibilityFailureBucket`, `VisibilityAnalyticsAlert`
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts` (visibility-analytics `$queryRaw`); `apps/api/src/modules/kb/kb.service.ts` (confidence scoring)
- `docs/adr/0010-auto-refund-on-visibility-failure.md`
- CLAUDE.md §7 — Claude's workflow for fixes (cites KB + reconciliation)

## Open questions / TODOs
- Window is locked at 24 h — a `windowHours` selector would surface 1 h, 6 h, 7 d trend views. Deferred.
- Per-channel drill-down (click a channel row → filter to that system's KB) is implicit — no explicit link yet.
- Confidence-score formula weights currently derived server-side and not documented in-page.
- KB analytics for non-visibility categories on the same surface is listed as "still deferred" in Phase 3D close-out (CLAUDE.md).
