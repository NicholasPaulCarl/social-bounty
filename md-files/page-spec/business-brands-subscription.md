# Brand Subscription — `/business/brands/subscription`

**Route path:** `/business/brands/subscription`
**File:** `apps/web/src/app/business/brands/subscription/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Subscription`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Manage the brand-tier subscription: view current plan (Free / Pro), upgrade via live Stitch card-consent, cancel (scheduled at period end), reactivate (before period end), and view payment history. Scoped to `user.brandId` via the JWT. <!-- historical -->

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** Stitch hosted card-consent URL (external redirect) on Upgrade. <!-- historical -->
- **Re-entered via:** `?upgrade=return` search param after Stitch return → invalidates subscription query. <!-- historical -->

## Data
- **React Query hooks:** `useSubscription()`, `useSubscribe()`, `useInitiateUpgrade()`, `useCancelSubscription()`, `useReactivateSubscription()`, `useSubscriptionPayments({page, limit})` (lazy when `showPayments`).
- **API endpoints called:** `GET /api/v1/subscription`, `POST /api/v1/subscription/upgrade`, `POST /api/v1/subscription/cancel`, `POST /api/v1/subscription/reactivate`, `GET /api/v1/subscription/payments`.
- **URL params:** none
- **Search params:** `upgrade=return` (external redirect marker from Stitch). <!-- historical -->

## UI structure
- `PageHeader` — Brand Subscription, breadcrumbs.
- Current tier Tag (PRO BRAND / FREE BRAND).
- Return banner (`upgrade=return`): success ("Upgrade confirmed") or info ("Card capture complete. Pro shortly; refreshing").
- Past-due warning banner (when `SubscriptionStatus.PAST_DUE`) — surfaces `gracePeriodEndsAt`.
- Pro-plan card (when Pro): status chip, next billing / cancellation date, 3 feature rows (Pink icons), View payment history + Cancel / Reactivate buttons.
- Tier comparison grid (when Free): Free Brand card + Pro Brand card with R{proPrice}/month (sourced from `SUBSCRIPTION_CONSTANTS.BRAND_PRO_PRICE_ZAR`). Upgrade CTA disabled unless `LIVE_UPGRADE_ENABLED === true` (currently hard-coded true).
- Payment history DataTable (shown on demand): Date, Amount, Status (coloured tag), Period. Paginator.
- Two `ConfirmAction` dialogs — Upgrade + Cancel.

## States
- **No active brand:** warning `Message` — "No brand is selected."
- **Loading:** `<LoadingState type="page" />`
- **Empty:** `return null` if no `sub`.
- **Active Pro:** status chip green (Active) / yellow (Cancelling, shows `currentPeriodEnd`) / red (Past Due).
- **Free:** tier comparison + Upgrade CTA.
- **Success — Upgrade:** `initiateUpgrade` returns `authorizationUrl` → `window.location.href = ...` → Stitch hosted consent. <!-- historical -->
- **Success — Cancel:** toast; status flips to CANCELLED; benefits persist until `currentPeriodEnd`.
- **Success — Reactivate:** toast.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Upgrade to pro brand | `ConfirmAction` → `initiateUpgrade` → redirect | Stitch card capture; webhook flips tier to PRO asynchronously. | <!-- historical -->
| View / Hide payment history | toggle `showPayments` | Lazy loads first page of payments. |
| Cancel subscription | `ConfirmAction` → POST `/cancel` | Scheduled cancel at period end. |
| Reactivate pro brand | POST `/reactivate` | Clears cancel-at-period-end flag. |

## Business rules
- CLAUDE.md §4 #9 (plan snapshot): in-flight bounties continue on their snapshotted tier; only future bounties pick up the new tier.
- CLAUDE.md §4 #10 (global 3.5% fee): platform fee is calculated independently of tier.
- `SUBSCRIPTION_CONSTANTS.BRAND_PRO_PRICE_ZAR` is the canonical price — imported to keep confirm-copy and billing aligned (Hard Rule #6 copy requirement).
- State machine: INACTIVE → ACTIVE → (CANCELLED with end-of-period) → INACTIVE; or ACTIVE → PAST_DUE → INACTIVE.
- Past-due grace: Pro benefits continue until `gracePeriodEndsAt`; after that → Free.
- Upgrade Pro is LIVE — writes a card-consent auth group via Stitch; webhook settles `subscription_charged` ledger group. <!-- historical -->
- AuditLog on upgrade + cancel + reactivate (Hard Rule #3).

## Edge cases
- Return-before-webhook: banner says "Card capture complete. … refreshing automatically" and the status stays Free until webhook fires.
- Return-webhook-before-page-load: banner says "Upgrade confirmed — Pro Brand perks are now active."
- Kill-switch active: upgrade payment flow rejected at webhook processing.
- Cancellation attempted after subscription already cancelled: API returns error.

## Tests
Subscription hook behaviour in `hooks/useSubscription.*.test.ts`.

## Related files
- `hooks/useSubscription.ts`
- `hooks/useAuth.ts`, `hooks/useToast.ts`, `hooks/usePagination.ts`
- `components/common/PageHeader.tsx`, `ProBadge.tsx`, `ConfirmAction.tsx`, `LoadingState.tsx`
- Shared: `SubscriptionStatus`, `SubscriptionTier`, `SUBSCRIPTION_CONSTANTS`, `SubscriptionPaymentDto`.

## Open questions / TODOs
- `LIVE_UPGRADE_ENABLED` is a hardcoded local constant; the fallback path uses the legacy `subscribe.mutate()` flow. Keep the const as a safety toggle.
- Cancel dialog doesn't mention the 3.5% platform fee scope — not relevant here (subscription, not bounty) but worth a copy review.
