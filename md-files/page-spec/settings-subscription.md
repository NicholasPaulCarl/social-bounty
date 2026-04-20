# Subscription — `/settings/subscription`

**Route path:** `/settings/subscription`
**File:** `apps/web/src/app/(participant)/settings/subscription/page.tsx`
**Role:** Any authenticated role (page auto-detects HUNTER vs BRAND feature set via `user.role`).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar Settings → Subscription (participant — also reachable from brand settings surface if they use this same route; different feature text).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`, `claude.md` §4.9 Plan Snapshot, `md-files/payment-gateway.md`.

## Purpose
Manage the user's subscription tier (FREE vs PRO). Surfaces a tier comparison for FREE users, plus current-plan state + cancel/reactivate for PRO. Live upgrade goes through Stitch hosted card-consent (`initiateUpgrade` → `authorizationUrl` redirect).

## Entry & exit
- **Reached from:** Settings nav, notifications (e.g. `SUBSCRIPTION_EXPIRING`), profile completion nudges.
- **Links out to:** Stitch hosted card-consent URL (external redirect via `window.location.href`). Returns to `/settings/subscription?upgrade=return` after consent.

## Data
- **React Query hooks:** `useSubscription()`, `useSubscribe()`, `useInitiateUpgrade()`, `useCancelSubscription()`, `useReactivateSubscription()`, `useSubscriptionPayments({ page, limit })`, `useAuth()`, `useToast()`, `usePagination(10)`, `useQueryClient()`, `useSearchParams()`.
- **API endpoints called:** `GET /subscription`, `POST /subscription/upgrade` (→ Stitch URL), `POST /subscription` (legacy fallback), `POST /subscription/cancel`, `POST /subscription/reactivate`, `GET /subscription/payments?page=…`.
- **URL params:** None.
- **Search params:** `upgrade=return` (post-Stitch return signal).

## UI structure
- `PageHeader` + breadcrumb (`Settings > Subscription`).
- Current tier pill (`Tag` — PRO/success or FREE/info, rounded).
- `upgrade=return` → success or info `Message` depending on whether webhook already flipped the tier.
- `PAST_DUE` → warn `Message` (with grace-period end date if present).
- **PRO active card**: shows Pro feature bullets + Cancel or Reactivate CTA + View/Hide history.
- **FREE comparison grid**: Free card (current) + Pro card (shadow glow, ribbon-like) with Upgrade CTA disabled unless `LIVE_UPGRADE_ENABLED`.
- Payment history DataTable (toggled): Date, Amount (mono), Status colored pill, Period.
- Two `ConfirmAction` dialogs: Upgrade (calls `handleSubscribe` → `initiateUpgrade.mutate` → redirect) and Cancel (calls `handleCancel`).

## States
- **Loading:** `LoadingState type="page"`.
- **Empty:** Hidden — `if (!sub) return null` after load.
- **Error:** Toasts via `useToast`.
- **Success:** Confirm dialogs close on mutation; `upgrade=return` invalidates the cache.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Upgrade | Opens ConfirmAction → `initiateUpgrade.mutate(PRO)` → `window.location.href = data.authorizationUrl` | Stitch hosted card consent |
| Cancel | Opens ConfirmAction → `cancel.mutate()` | Flags `cancelAtPeriodEnd` |
| Reactivate | `reactivate.mutate()` | Clears cancellation |
| View/Hide history | Toggles `showPayments` | Shows DataTable |

## Business rules
- **Plan snapshot (Non-Negotiable #9):** tier snapshotted onto each transaction at creation; in-flight transactions never re-priced on plan change. (Enforced server-side; surfaced here as "Pro perks active until {period end}" on cancel.)
- Pricing sourced from `SUBSCRIPTION_CONSTANTS` (`HUNTER_PRO_PRICE_ZAR` / `BRAND_PRO_PRICE_ZAR`) — UI mirror of billing.
- `LIVE_UPGRADE_ENABLED = true` — webhook-driven async tier flip; return-before-webhook handled by `useEffect` invalidating `['subscription']`.
- Hunter features: 20→10% commission, 3-day→same-day payout, public-only→closed-access, verified badge, priority support.
- Brand features: 15→5% admin fee, public-only→closed bounties, priority support.
- Hard Rule #6 (destructive action confirmation): both Upgrade and Cancel use `ConfirmAction`.

## Edge cases
- `upgrade=return` + webhook already fired → success banner + PRO features active immediately.
- `upgrade=return` + webhook not fired yet → info banner, background invalidation will flip UI.
- PAST_DUE with no grace period end → generic "update your payment method" copy.
- Legacy mock subscribe path (`subscribe.mutate`) still present as fallback when `LIVE_UPGRADE_ENABLED` is off — dev-only.

## Tests
No colocated tests (integration via e2e).

## Related files
- `@/hooks/useSubscription`
- `@/components/common/ProBadge`, `ConfirmAction`, `LoadingState`
- Shared: `SubscriptionStatus`, `SubscriptionTier`, `UserRole`, `SUBSCRIPTION_CONSTANTS`, `SubscriptionPaymentDto`

## Open questions / TODOs
- Role-aware feature text is handled here but the route is under `(participant)/settings/...` — brand admins viewing this route see brand features (relies on shared layout acceptance).
- `LIVE_UPGRADE_ENABLED` is a module-level constant; toggling for dev requires a code edit.
