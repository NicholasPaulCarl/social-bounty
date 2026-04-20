# Subscriptions — `/admin/finance/subscriptions`

**Route path:** `/admin/finance/subscriptions`
**File:** `apps/web/src/app/admin/finance/subscriptions/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** **Deep-link only** — not in the Finance sub-nav bar (per `docs/architecture/sitemap.md` line 156). Reached from the Subscription drilldowns or direct URL.
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Platform-wide, read-only list of all hunter and brand subscriptions. Surfaces the tier (Free / Pro), state (ACTIVE / PAST_DUE / CANCELLED / EXPIRED / FREE), price snapshot at signup, period end, grace-period end, and `failedPaymentCount` so SA can triage collection-at-risk accounts at a glance. Cancellation actions live on the per-subscription drilldown pages (`/admin/subscriptions:id/cancel` per sitemap line 324) — this listing is triage-only.

## Entry & exit
- **Reached from:** Deep-link only (no Finance sub-nav entry). Also linked from user / brand profile pages where applicable.
- **Links out to:** Implicit via `userId` / `brandId` — this listing does not currently render links directly (limitation).

## Data
- **React Query hooks:** `useFinanceSubscriptions({ page, limit })`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/subscriptions?page=&limit=`
- **URL params:** none
- **Search params:** none (pagination in local state)

## UI structure
- `PageHeader` with title "Subscriptions", subtitle "All hunter and brand subscriptions (read-only)". Action: Refresh.
- `<Card>` wrapping a lazy-loaded `<DataTable>` (25/page), server-paginated via `totalRecords` + `first` + `onPage`.
- Columns:
  - Owner (name + email stacked)
  - Entity (Tag with `entityType`: HUNTER / BRAND)
  - Tier (Tag — PRO=success, FREE=null/muted)
  - Status (colour-coded Tag via `STATUS_SEVERITY`: ACTIVE=success, PAST_DUE=warning, CANCELLED=info, EXPIRED=danger, FREE=null)
  - Price (mono currency via `formatCurrency(priceAmount, currency)`)
  - Period end (mono datetime)
  - Grace ends (mono datetime or `—`)
  - Failed count (mono; danger-tone if > 0)

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Natural DataTable empty when no subscriptions.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Paginated list; no mutations on this page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query the current page |
| Row click | (none wired on this page currently) | Cancellation lives at `/admin/subscriptions:id/cancel` (sitemap line 324) |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger (subscription charges write to `subscription_revenue` via `subscription_charged` groups)
- AuditLog required for every mutation — this page is read-only
- **Plan snapshot per transaction (tier not re-priced)** — explicitly enforced on the Subscription lifecycle (CLAUDE.md: "Subscription lifecycle — tier snapshot, auto-downgrade state machine, grace period, cancel-at-period-end UI"). In-flight SubscriptionPayments keep the tier they were issued under.
- Global 3.5% fee independent of tier admin fee
- Kill switch: read-only surface, unaffected. Subscription-charge webhooks honour the kill switch; renewal failures increment `failedPaymentCount`.

Page-specific:
- No direct reconciliation check, but `failedPaymentCount > 0` rows should be triaged before auto-downgrade fires (grace period ends → EXPIRED).
- Displays **live** state; polling is not enabled.
- No write operations on this surface. Cancellation + refunds route through the admin-subscriptions namespace.

## Edge cases
- Owner with no name or email (e.g. deleted user) — renders `—` / empty.
- Currency mismatch (non-ZAR) — `formatCurrency` consumes `r.currency`.
- Subscription in FREE tier — shows as `FREE` with no period-end, null price.
- PAST_DUE with positive `failedPaymentCount` — amber Tag + red count; collection-at-risk signal.
- Concurrent admin action (e.g. someone cancels mid-view) — stale row; Refresh to resync.
- Large result set (> 25) — paginate via DataTable footer (lazy mode).

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `listSubscriptions`; subscription-lifecycle specs in `apps/api/src/modules/subscriptions/*`.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useFinanceSubscriptions`
- `apps/web/src/lib/api/finance-admin.ts` — `listSubscriptions`, `FinanceSubscriptionRow`, `FinanceSubscriptionListResponse`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCurrency`, `formatDateTime`
- `packages/shared/src/types/subscription.ts` — `SubscriptionStatus`, `SubscriptionTier`, `SubscriptionEntityType`
- Backend: `apps/api/src/modules/subscriptions/*`
- `md-files/social-bounty-mvp.md` — subscription specs

## Open questions / TODOs
- No owner row-click / drilldown — operators must hand-navigate to `/admin/users/{id}` or `/admin/brands/{id}`.
- No inline filter by entity / tier / status.
- Cancellation CTA (the `/admin/subscriptions:id/cancel` endpoint) has no surface in this listing — operators must know the subscription id already.
- Sitemap marks this page deep-link only; consider a direct entry from Earnings & Payouts or a linked chip on each subscription row when cancellation UX lands.
