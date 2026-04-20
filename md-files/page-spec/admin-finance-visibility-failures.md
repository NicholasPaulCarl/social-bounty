# Visibility Failures — `/admin/finance/visibility-failures`

**Route path:** `/admin/finance/visibility-failures`
**File:** `apps/web/src/app/admin/finance/visibility-failures/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (between Refunds and Exceptions — added in Phase 3B)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Phase 3B admin triage surface for ADR 0010 — lists approved submissions whose post is no longer reachable by Apify (consecutive `PostVisibility` re-check failures > 0). Two consecutive failures auto-trigger a post-approval refund via the visibility scheduler. This page is **read-only**; all manual refund overrides route through `/admin/finance/refunds`. Also surfaces critical open KB recurring issues in the `post_visibility` category as a red alert banner.

## Entry & exit
- **Reached from:** Finance sub-nav "Visibility Failures" tab. Also linked from the admin submission detail page (`/admin/submissions/{id}`) when `consecutiveVisibilityFailures > 0`.
- **Links out to:**
  - `/admin/bounties/{bountyId}` (Bounty link)
  - `/admin/brands/{brandId}` (Brand link)
  - `/admin/users/{hunterId}` (Hunter link)
  - `/admin/submissions/{submissionId}` (Submission "Open" link)
  - Inline dialog: per-submission `SubmissionUrlScrapeHistory`

## Data
- **React Query hooks:** `useAdminVisibilityFailures({ page, limit })` (30 s refetch), `useAdminVisibilityHistory(submissionId)`, `useFinanceExceptions()` (for the KB banner)
- **API endpoints called:**
  - GET `/api/v1/admin/finance/visibility-failures?page=&limit=` (audited, SUPER_ADMIN)
  - GET `/api/v1/admin/finance/visibility-failures/{submissionId}/history` (audited, SUPER_ADMIN)
  - GET `/api/v1/admin/finance/exceptions` (for the KB banner — reuses existing endpoint, no new route added)
- **URL params:** none
- **Search params:** none (page/limit in local state)

## UI structure
- `PageHeader` with title "Visibility failures", subtitle "Approved submissions whose post is no longer accessible to Apify. Two consecutive failures auto-trigger a refund (ADR 0010)." Action: Refresh.
- Red banner (`AlertTriangle` icon, danger tinting) when any open `RecurringIssue` in `post_visibility` category has `severity='critical'`. Shows count + up to 3 titles + "+N more".
- `<Card>` wrapping a `<DataTable>` (no PrimeReact paginator on this variant; custom Prev/Next in the footer using `ChevronLeft`/`ChevronRight`).
- Columns: Bounty (link), Brand (link), Hunter (link), Approved (mono datetime or `—`), Last checked (mono datetime or `—`), Failures (Tag colour-coded — `>= 2` danger, `= 1` warning, else success), Latest error (line-clamp-2 with `title` tooltip), History ("View (N)" text button → opens dialog), Submission ("Open" link).
- `<HistoryDialog>` — 90vw modal, list of `SubmissionUrlScrapeHistory` rows newest-first: each row is a `glass-card` with channel + URL (external link in pink-600), scrape status Tag, checked timestamp, optional red error box, optional scraped-result JSON snippet, per-rule verification checks with `CheckCircle2`/`XCircle` Lucide icons.
- Footer pagination: "Page N of M · X submissions" + Prev / Next buttons.

## States
- **Loading:** `LoadingState type="table"` for the main list; `LoadingState type="detail"` inside the dialog.
- **Empty:** `emptyMessage="No submissions are currently failing visibility re-checks."` on the DataTable.
- **Error:** `ErrorState` with retry CTA (outer); inline error inside the dialog if the history query fails.
- **Success:** Polls every 30 s; dialog closes on `onHide`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query visibility failures |
| View (N) (per-row) | opens `<Dialog>` | Fetches per-submission history |
| Bounty / Brand / Hunter links | `Link` | Respective admin drilldown |
| Open (Submission column) | `Link` | `/admin/submissions/{submissionId}` |
| Prev / Next | `setPage` | Client-side page change; re-queries page |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — this page is read-only; the **upstream** auto-refund writes `SUBMISSION_VISIBILITY_AUTO_REFUND` audit action (Phase 2A constant).
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: the upstream **visibility scheduler** is NOT in the kill-switch bypass list (per ADR 0006 + ADR 0010) — when active, refunds defer and the counter holds at its prior value (Phase 3A). This page reflects that paused state passively via row counts holding at 1/2/3.

Page-specific:
- No reconciliation-check implementation here; the page is the **admin surface for ADR 0010** auto-refund policy. It partly informs check #4 (status consistency) — an APPROVED submission with visible failures should eventually reach `AFTER_APPROVAL` refund state; if the chain breaks, the Exceptions page flags it.
- Displays **live** state, polling every 30 s; the scheduler runs every 6 h (Phase 2A), so the cadences are mismatched by design.
- Write operations: none on this surface. Upstream writes:
  - `SubmissionUrlScrapeHistory` append (scheduler)
  - `Refund.requestAfterApproval(...)` at 2nd consecutive failure
  - `AuditLog` with action `SUBMISSION_VISIBILITY_AUTO_REFUND`
  - `KbService.recordRecurrence(...)` per failure

## Edge cases
- Empty list — clear message; no action needed. Scheduler hasn't seen any qualifying row.
- Counter at 1 — warning Tag; one more tick away from auto-refund. No action currently exposed on-page (operators use Refunds to override).
- Counter >= 2 — danger Tag; auto-refund either fired or blocked by kill switch. Scheduler resets counter on success and holds it on kill-switch block.
- KB banner — only shows `category = 'post_visibility'` critical open issues (filters `resolved=false` client-side). Banner never shown for info/warning severities (low-noise).
- Concurrent scheduler tick — the `UrlScrapeStatus` transition is idempotent at the DB level; history rows append-only.
- Per-bounty cost cap reached (Phase 3A: 30 re-scrapes lifetime) — no dedicated UI marker on this page; surfaces via KB recurrence banner (`VISIBILITY_RESCRAPE_CAP_REACHED`).

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: Phase 3B `apps/api/src/modules/admin/finance-admin.controller.spec.ts` (+19 new tests), Phase 2A scheduler spec `apps/api/src/modules/submissions/submission-visibility.scheduler.spec.ts` (+10 tests for the refund trigger), Phase 3A hardening spec (+8 tests).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useAdminVisibilityFailures`, `useAdminVisibilityHistory`, `useFinanceExceptions`
- `apps/web/src/lib/api/finance-admin.ts` — `listVisibilityFailures`, `getVisibilityFailureHistory`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatDateTime`
- `packages/shared/src/types/finance-admin.ts` — `VisibilityFailureRow`, `VisibilityHistoryRow`, `AdminVisibilityFailureListResponse`
- Backend: `apps/api/src/modules/submissions/submission-visibility.scheduler.ts`, `submission-scraper.service.ts`
- Templates: `apps/api/src/mail/templates/post-removed-brand.hbs`, `post-removed-hunter.hbs`, `post-visibility-warning-hunter.hbs`
- `docs/adr/0010-auto-refund-on-visibility-failure.md`

## Open questions / TODOs
- No inline "force refund now" button — operators drop back to the Refunds tab.
- No "whitelist this submission from future re-checks" toggle (Phase 4 deferred — flag in CLAUDE.md "still deferred for Phase 4+").
- Apify outage scenario surfaces on the Insights page (per-channel failure-rate analytics from Phase 3D) — the cross-link between this page and Insights is implicit.
- Pagination is custom (not PrimeReact paginator) — intentional per component spec; revisit when DataTable paginator API matches.
