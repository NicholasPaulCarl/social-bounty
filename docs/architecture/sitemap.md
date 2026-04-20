# Sitemap — Social Bounty

Canonical map of every page in `apps/web/src/app/` and every HTTP endpoint exposed by `apps/api/src/modules/*/*.controller.ts`. Keep this doc fresh — update it any time you add, rename, move, or delete a `page.tsx`, a `layout.tsx` role gate, or a controller route. The authoritative sidebar nav lives in [`apps/web/src/lib/navigation.ts`](../../apps/web/src/lib/navigation.ts); a route can exist in the app without appearing in nav (deep-link only — e.g. `/bounties/[id]/apply`, `/bounties/[id]/submit`) and the Nav column below flags those.

**Route-group quirk.** `(auth)`, `(marketing)`, `(participant)`, `(shared)` are Next.js route groups — the parentheses do **not** appear in the URL. So `apps/web/src/app/(participant)/bounties/page.tsx` resolves to `/bounties`, not `/(participant)/bounties`. By contrast `admin/`, `business/`, `brands/`, `hunters/` are real path segments and do appear in the URL. URLs below are shown as the user sees them.

**Nav column legend.** `✓` = reachable from `navigation.ts`. `→` = deep-link only, reached from another page (expected). `○` = orphan / unreachable, flag for review.

**API prefix.** Every controller path is served under the global `/api/v1` prefix set in [`apps/api/src/main.ts:72`](../../apps/api/src/main.ts). Svix-verified webhooks (`POST /api/v1/webhooks/stitch`, `POST /api/v1/webhooks/tradesafe`) use `@Public()` by design — signature verification replaces JWT auth.

---

## Web routes

### 1 — Public (unauthenticated)

Routes outside `AuthGuard`. Marketing layout is `(marketing)/layout.tsx`; auth screens use `(auth)/layout.tsx`. The marketing root `/` carries the sticky marketing nav + footer.

| URL | Purpose | Nav | File |
|-----|---------|-----|------|
| `/` | Marketing landing | ✓ (marketing nav) | `(marketing)/page.tsx` |
| `/contact` | Contact form | ✓ | `(marketing)/contact/page.tsx` |
| `/join/business` | "For brands" marketing | ✓ | `(marketing)/join/business/page.tsx` |
| `/join/hunter` | "For hunters" marketing | ✓ | `(marketing)/join/hunter/page.tsx` |
| `/pricing` | Pricing tiers | ✓ | `(marketing)/pricing/page.tsx` |
| `/privacy` | Privacy policy | ✓ | `(marketing)/privacy/page.tsx` |
| `/terms` | Terms of service | ✓ | `(marketing)/terms/page.tsx` |
| `/login` | OTP login | ✓ | `(auth)/login/page.tsx` |
| `/signup` | OTP signup + brand option | ✓ | `(auth)/signup/page.tsx` |

### 2 — Shared authenticated (any logged-in role)

`(shared)/layout.tsx` wraps children in `AuthGuard` with no `allowedRoles`, so any authenticated user can reach these.

| URL | Purpose | Nav | File |
|-----|---------|-----|------|
| `/create-brand` | Participant-initiated brand creation flow | → (from signup / profile) | `(shared)/create-brand/page.tsx` |

### 3 — Participant (USER role)

`(participant)/layout.tsx` — `AuthGuard` without role filter (any logged-in user, but nav only exposes these to participants). Aligns with `participantSections` in `navigation.ts`.

| URL | Purpose | Nav | File |
|-----|---------|-----|------|
| `/inbox` | Notifications + DM list | ✓ | `(participant)/inbox/page.tsx` |
| `/inbox/conversations/[id]` | Single conversation thread | → | `(participant)/inbox/conversations/[id]/page.tsx` |
| `/bounties` | Browse live bounties | ✓ | `(participant)/bounties/page.tsx` |
| `/bounties/[id]` | Bounty detail (with auto-verify preview) | → | `(participant)/bounties/[id]/page.tsx` |
| `/bounties/[id]/apply` | Application form for CLOSED bounties | → | `(participant)/bounties/[id]/apply/page.tsx` |
| `/bounties/[id]/submit` | Per-format URL submission form | → | `(participant)/bounties/[id]/submit/page.tsx` |
| `/my-submissions` | Hunter's own submissions list | ✓ | `(participant)/my-submissions/page.tsx` |
| `/my-submissions/[id]` | Submission detail + review state | → | `(participant)/my-submissions/[id]/page.tsx` |
| `/my-disputes` | Hunter's disputes list | ✓ | `(participant)/my-disputes/page.tsx` |
| `/my-disputes/new` | Open a new dispute | → | `(participant)/my-disputes/new/page.tsx` |
| `/my-disputes/[id]` | Dispute detail + messaging | → | `(participant)/my-disputes/[id]/page.tsx` |
| `/wallet` | Wallet dashboard (available / pending / paid) | ✓ | `(participant)/wallet/page.tsx` |
| `/wallet/transactions` | Wallet transaction history | → | `(participant)/wallet/transactions/page.tsx` |
| `/wallet/withdraw` | Request a withdrawal | → | `(participant)/wallet/withdraw/page.tsx` |
| `/settings/subscription` | Hunter subscription (HUNTER tier) | ✓ | `(participant)/settings/subscription/page.tsx` |
| `/settings/payouts` | Beneficiary / payout rail setup | → | `(participant)/settings/payouts/page.tsx` |
| `/profile` | Public-ish profile view | ✓ | `(participant)/profile/page.tsx` |
| `/profile/edit` | Edit profile (name, handles, interests) | → | `(participant)/profile/edit/page.tsx` |

### 4 — Business admin (BUSINESS_ADMIN role)

`business/layout.tsx` — `AuthGuard allowedRoles={[BUSINESS_ADMIN]}`. Aligns with `businessSections` in `navigation.ts`.

| URL | Purpose | Nav | File |
|-----|---------|-----|------|
| `/business/dashboard` | Brand dashboard (active bounties, pending reviews) | ✓ | `business/dashboard/page.tsx` |
| `/business/bounties` | Manage brand's bounties | ✓ | `business/bounties/page.tsx` |
| `/business/bounties/new` | Create-bounty form | → | `business/bounties/new/page.tsx` |
| `/business/bounties/funded` | Stitch hosted-checkout return page (funding status poll) | → | `business/bounties/funded/page.tsx` |
| `/business/bounties/[id]` | Bounty detail / edit-or-go-live | → | `business/bounties/[id]/page.tsx` |
| `/business/bounties/[id]/edit` | Edit draft bounty | → | `business/bounties/[id]/edit/page.tsx` |
| `/business/bounties/[id]/submissions` | Submissions for a single bounty | → | `business/bounties/[id]/submissions/page.tsx` |
| `/business/bounties/[id]/submissions/[submissionId]` | Review a single submission | → | `business/bounties/[id]/submissions/[submissionId]/page.tsx` |
| `/business/bounties/[id]/applications` | Applications for CLOSED bounties | → | `business/bounties/[id]/applications/page.tsx` |
| `/business/bounties/[id]/invitations` | Manage invitations for CLOSED bounties | → | `business/bounties/[id]/invitations/page.tsx` |
| `/business/review-center` | Cross-bounty review queue (urgent pip) | ✓ | `business/review-center/page.tsx` |
| `/business/review-center/[id]` | Review single submission from the queue | → | `business/review-center/[id]/page.tsx` |
| `/business/disputes` | Brand-side dispute list | ✓ | `business/disputes/page.tsx` |
| `/business/disputes/new` | Open a new dispute | → | `business/disputes/new/page.tsx` |
| `/business/disputes/[id]` | Dispute detail + messaging | → | `business/disputes/[id]/page.tsx` |
| `/business/brands` | Brand list (multi-brand BA) | ✓ | `business/brands/page.tsx` |
| `/business/brands/create` | Create additional brand | → | `business/brands/create/page.tsx` |
| `/business/brands/edit` | Edit single/primary brand (`user.brandId`) | → | `business/brands/edit/page.tsx` |
| `/business/brands/[id]/edit` | Edit a specific brand (multi-brand) | → | `business/brands/[id]/edit/page.tsx` |
| `/business/brands/kyb` | KYB verification form | ✓ | `business/brands/kyb/page.tsx` |
| `/business/brands/members` | Manage brand members | → | `business/brands/members/page.tsx` |
| `/business/brands/subscription` | Brand-tier subscription management | ✓ | `business/brands/subscription/page.tsx` |
| `/business/profile` | Business user's own profile | ✓ | `business/profile/page.tsx` |

### 5 — Super admin (SUPER_ADMIN role)

`admin/layout.tsx` — `AuthGuard allowedRoles={[SUPER_ADMIN]}`. Aligns with `adminSections` in `navigation.ts`.

| URL | Purpose | Nav | File |
|-----|---------|-----|------|
| `/admin/dashboard` | Platform overview | ✓ | `admin/dashboard/page.tsx` |
| `/admin/users` | User management list | ✓ | `admin/users/page.tsx` |
| `/admin/users/[id]` | User detail + status actions | → | `admin/users/[id]/page.tsx` |
| `/admin/brands` | Brand management list | ✓ | `admin/brands/page.tsx` |
| `/admin/brands/new` | Admin-created brand | → | `admin/brands/new/page.tsx` |
| `/admin/brands/[id]` | Brand detail + status actions | → | `admin/brands/[id]/page.tsx` |
| `/admin/bounties` | All bounties (cross-brand) | ✓ | `admin/bounties/page.tsx` |
| `/admin/bounties/[id]` | Bounty detail + override | → | `admin/bounties/[id]/page.tsx` |
| `/admin/submissions` | All submissions | ✓ | `admin/submissions/page.tsx` |
| `/admin/submissions/[id]` | Submission detail + override + visibility panel | → | `admin/submissions/[id]/page.tsx` |
| `/admin/disputes` | All disputes | ✓ | `admin/disputes/page.tsx` |
| `/admin/disputes/[id]` | Dispute resolution | → | `admin/disputes/[id]/page.tsx` |
| `/admin/wallets` | All user wallets | ✓ | `admin/wallets/page.tsx` |
| `/admin/wallets/[userId]` | Per-user wallet + adjust | → | `admin/wallets/[userId]/page.tsx` |
| `/admin/withdrawals` | Withdrawal queue | ✓ | `admin/withdrawals/page.tsx` |
| `/admin/finance` | Finance overview + kill switch | ✓ | `admin/finance/page.tsx` |
| `/admin/finance/inbound` | Inbound brand fundings | ✓ | `admin/finance/inbound/page.tsx` |
| `/admin/finance/reserves` | Reserve ledger balances | ✓ | `admin/finance/reserves/page.tsx` |
| `/admin/finance/earnings-payouts` | Hunter earnings + payouts | ✓ | `admin/finance/earnings-payouts/page.tsx` |
| `/admin/finance/payouts` | Outbound payout list + retry | → | `admin/finance/payouts/page.tsx` |
| `/admin/finance/refunds` | Refund queue | ✓ | `admin/finance/refunds/page.tsx` |
| `/admin/finance/subscriptions` | Subscription list + cancel | → | `admin/finance/subscriptions/page.tsx` |
| `/admin/finance/visibility-failures` | Submissions with visibility re-check failures (ADR 0010) | ✓ | `admin/finance/visibility-failures/page.tsx` |
| `/admin/finance/exceptions` | Reconciliation exceptions / recurring issues | ✓ | `admin/finance/exceptions/page.tsx` |
| `/admin/finance/audit-trail` | Finance audit log | ✓ | `admin/finance/audit-trail/page.tsx` |
| `/admin/finance/overrides` | Post manual ledger override | ✓ | `admin/finance/overrides/page.tsx` |
| `/admin/finance/insights` | KB confidence + visibility analytics | → | `admin/finance/insights/page.tsx` |
| `/admin/finance/insights/[system]` | Per-system KB drill-down | → | `admin/finance/insights/[system]/page.tsx` |
| `/admin/finance/groups/[transactionGroupId]` | Ledger transaction-group drill-down | → | `admin/finance/groups/[transactionGroupId]/page.tsx` |
| `/admin/audit-logs` | Platform audit log | ✓ | `admin/audit-logs/page.tsx` |
| `/admin/audit-logs/[id]` | Single audit entry | → | `admin/audit-logs/[id]/page.tsx` |
| `/admin/payments-health` | Stitch token probe, last webhook | ✓ | `admin/payments-health/page.tsx` |
| `/admin/troubleshooting` | System health + recent errors | ✓ | `admin/troubleshooting/page.tsx` |
| `/admin/settings` | Global toggles (signups, submissions) | ✓ | `admin/settings/page.tsx` |
| `/admin/component-library` | Design-system reference (atoms / molecules / organisms) | ✓ | `admin/component-library/page.tsx` |
| `/admin/profile` | Super admin's own profile | ✓ | `admin/profile/page.tsx` |

### 6 — Role-ambiguous (multiple roles reach via nav)

Real path segments (not route groups). `brands/layout.tsx` is unusual — no `AuthGuard`; unauthenticated users get a simple layout while authenticated users get the full app shell. `hunters/layout.tsx` requires auth. Reachable from both participant and business/admin navs.

| URL | Purpose | Reached by | File |
|-----|---------|-----------|------|
| `/brands` | Public brand directory (list) | Participant nav (`Browse Brands`); public-crawlable | `brands/page.tsx` |
| `/brands/[id]` | Public brand profile | Deep link from `/brands` | `brands/[id]/page.tsx` |
| `/hunters` | Hunter directory | Business nav + Admin nav (both `Hunters`) | `hunters/page.tsx` |
| `/hunters/[id]` | Public hunter profile | Deep link from `/hunters` | `hunters/[id]/page.tsx` |

### Broken nav references

None found. Every href in `navigation.ts` resolves to an existing `page.tsx`. Verified paths: `/inbox`, `/bounties`, `/brands`, `/my-submissions`, `/my-disputes`, `/wallet`, `/settings/subscription`, `/profile`, `/business/*`, `/admin/*`, `/hunters`.

### Orphan / out-of-nav observations

- `/create-brand` — reached via signup flow and profile CTAs, not in any nav section. Expected (it's a one-time flow).
- `/business/bounties/funded` — Stitch hosted-checkout return URL. Not in nav by design (external redirect target only).
- `/admin/finance/payouts`, `/admin/finance/subscriptions` — present but not in the Finance sub-nav; reached from Earnings & Payouts / Subscription drill-downs.
- All `/profile` variants (`/profile`, `/business/profile`, `/admin/profile`) coexist intentionally — each role's own profile page uses role-appropriate chrome.

---

## API routes

All paths below are served under `/api/v1`. Handler-level `@Roles(...)` wins over `@Public()`; controller-level `@Roles(...)` applies to every handler unless overridden. Endpoints without any `@Roles`/`@Public` decorator inherit `JwtAuthGuard` default (any authenticated user) via the global guard set in `apps/api/src/app.module.ts`.

### admin (`admin.controller.ts`) — SUPER_ADMIN only

Controller-level `@Roles(SUPER_ADMIN)`.

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/admin/users` | SUPER_ADMIN | List users |
| GET | `/api/v1/admin/users/:id` | SUPER_ADMIN | User detail |
| PATCH | `/api/v1/admin/users/:id/status` | SUPER_ADMIN | Update user status |
| GET | `/api/v1/admin/brands` | SUPER_ADMIN | List brands |
| GET | `/api/v1/admin/brands/:id` | SUPER_ADMIN | Brand detail |
| POST | `/api/v1/admin/brands` | SUPER_ADMIN | Create brand |
| PATCH | `/api/v1/admin/brands/:id/status` | SUPER_ADMIN | Update brand status |
| GET | `/api/v1/admin/submissions` | SUPER_ADMIN | List submissions |
| PATCH | `/api/v1/admin/bounties/:id/override` | SUPER_ADMIN | Override bounty status |
| PATCH | `/api/v1/admin/submissions/:id/override` | SUPER_ADMIN | Override submission status |
| GET | `/api/v1/admin/audit-logs` | SUPER_ADMIN | List audit logs |
| GET | `/api/v1/admin/audit-logs/:id` | SUPER_ADMIN | Audit log detail |
| GET | `/api/v1/admin/dashboard` | SUPER_ADMIN | Admin dashboard stats |
| GET | `/api/v1/admin/settings` | SUPER_ADMIN | Read global settings |
| PATCH | `/api/v1/admin/settings` | SUPER_ADMIN | Update global settings |
| GET | `/api/v1/admin/recent-errors` | SUPER_ADMIN | Recent error log |
| GET | `/api/v1/admin/system-health` | SUPER_ADMIN | DB/Redis health |

### auth (`auth.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/auth/request-otp` | `@Public`, throttled 5/min | Send OTP to email |
| POST | `/api/v1/auth/verify-otp` | `@Public`, throttled 10/min | Verify OTP + login |
| POST | `/api/v1/auth/signup` | `@Public`, throttled 5/min | Signup with OTP + optional brand |
| POST | `/api/v1/auth/switch-brand` | BUSINESS_ADMIN, SUPER_ADMIN | Swap brand context in JWT |
| POST | `/api/v1/auth/request-email-change` | All authenticated, throttled 3/min | Request email-change OTP |
| POST | `/api/v1/auth/verify-email-change` | All authenticated, throttled 5/min | Verify email change |
| POST | `/api/v1/auth/logout` | All authenticated | Clear refresh cookie |
| POST | `/api/v1/auth/refresh` | `@Public`, throttled 10/min | Rotate refresh token |

### auth/tradesafe (`tradesafe-callback.controller.ts`)

Namespace-only `auth/` — not part of the auth module. See ADR 0009 §5.

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/auth/tradesafe/callback` | `@Public`, state-param validated | TradeSafe OAuth return (R33) |

### bounties (`bounties.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/bounties` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | List bounties (filtered by role) |
| GET | `/api/v1/bounties/:id` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Bounty detail |
| POST | `/api/v1/bounties` | BUSINESS_ADMIN, SUPER_ADMIN | Create bounty |
| PATCH | `/api/v1/bounties/:id` | BUSINESS_ADMIN, SUPER_ADMIN | Update bounty |
| PATCH | `/api/v1/bounties/:id/status` | BUSINESS_ADMIN, SUPER_ADMIN | Transition status (DRAFT / LIVE / CLOSED) |
| POST | `/api/v1/bounties/:id/acknowledge-visibility` | BUSINESS_ADMIN, SUPER_ADMIN | Deprecated no-op (kept for back-compat) |
| POST | `/api/v1/bounties/:id/duplicate` | BUSINESS_ADMIN, SUPER_ADMIN | Clone bounty as DRAFT |
| DELETE | `/api/v1/bounties/:id` | BUSINESS_ADMIN, SUPER_ADMIN | Delete bounty |
| POST | `/api/v1/bounties/:id/brand-assets` | BUSINESS_ADMIN, SUPER_ADMIN | Upload brand-asset files |
| DELETE | `/api/v1/bounties/:id/brand-assets/:assetId` | BUSINESS_ADMIN, SUPER_ADMIN | Delete brand-asset |

### bounty-access (`bounty-access.controller.ts`) — applications + invitations

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/bounties/:bountyId/apply` | PARTICIPANT | Apply to CLOSED bounty |
| DELETE | `/api/v1/bounties/:bountyId/my-application` | PARTICIPANT | Withdraw own application |
| GET | `/api/v1/bounties/:bountyId/applications` | BUSINESS_ADMIN, SUPER_ADMIN | List applications |
| POST | `/api/v1/bounties/:bountyId/applications/:id/approve` | BUSINESS_ADMIN, SUPER_ADMIN | Approve application |
| POST | `/api/v1/bounties/:bountyId/applications/:id/reject` | BUSINESS_ADMIN, SUPER_ADMIN | Reject application |
| POST | `/api/v1/bounties/:bountyId/invitations` | BUSINESS_ADMIN, SUPER_ADMIN | Create invitations |
| GET | `/api/v1/bounties/:bountyId/invitations` | BUSINESS_ADMIN, SUPER_ADMIN | List invitations |
| DELETE | `/api/v1/bounties/:bountyId/invitations/:id` | BUSINESS_ADMIN, SUPER_ADMIN | Revoke invitation |
| GET | `/api/v1/invitations/my` | PARTICIPANT | List own invitations |
| POST | `/api/v1/invitations/:id/accept` | PARTICIPANT | Accept invitation |
| POST | `/api/v1/invitations/:id/decline` | PARTICIPANT | Decline invitation |

### brands (`brands.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/brands` | PARTICIPANT, BUSINESS_ADMIN | Create brand (+ logo upload) |
| GET | `/api/v1/brands/mine` | BUSINESS_ADMIN, SUPER_ADMIN | List own brands |
| GET | `/api/v1/brands/public` | `@Public`, throttled 30/min | Public brand directory |
| GET | `/api/v1/brands/public/:idOrHandle` | `@Public`, throttled 60/min | Public brand profile |
| GET | `/api/v1/brands/check-handle/:handle` | `@Public`, throttled 20/min | Handle availability |
| GET | `/api/v1/brands/:id` | BUSINESS_ADMIN, SUPER_ADMIN | Brand detail |
| PATCH | `/api/v1/brands/:id` | BUSINESS_ADMIN, SUPER_ADMIN | Update brand (+ logo) |
| GET | `/api/v1/brands/:id/members` | BUSINESS_ADMIN, SUPER_ADMIN | List members |
| POST | `/api/v1/brands/:id/members` | BUSINESS_ADMIN, SUPER_ADMIN | Invite member |
| DELETE | `/api/v1/brands/:id/members/:userId` | BUSINESS_ADMIN, SUPER_ADMIN | Remove member |
| POST | `/api/v1/brands/:id/cover-photo` | BUSINESS_ADMIN, SUPER_ADMIN | Upload cover photo |

### brands/:brandId/kyb (`kyb.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/brands/:brandId/kyb` | BUSINESS_ADMIN, SUPER_ADMIN | Submit KYB |
| POST | `/api/v1/brands/:brandId/kyb/approve` | SUPER_ADMIN | Approve KYB |
| POST | `/api/v1/brands/:brandId/kyb/reject` | SUPER_ADMIN | Reject KYB |

### business (`business.controller.ts`) — BUSINESS_ADMIN only

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/business/dashboard` | BUSINESS_ADMIN | Brand dashboard stats |

### disputes (`disputes.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/disputes` | PARTICIPANT, BUSINESS_ADMIN, throttled 5/min | Create dispute |
| GET | `/api/v1/disputes/me` | PARTICIPANT | Own disputes list |
| GET | `/api/v1/disputes/brand` | BUSINESS_ADMIN | Brand's disputes list |
| GET | `/api/v1/disputes/:id` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Dispute detail |
| PATCH | `/api/v1/disputes/:id` | PARTICIPANT, BUSINESS_ADMIN | Update draft dispute |
| POST | `/api/v1/disputes/:id/submit` | PARTICIPANT, BUSINESS_ADMIN | Submit draft |
| POST | `/api/v1/disputes/:id/messages` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Post message |
| POST | `/api/v1/disputes/:id/escalate` | PARTICIPANT, BUSINESS_ADMIN | Escalate to admin |
| POST | `/api/v1/disputes/:id/withdraw` | PARTICIPANT, BUSINESS_ADMIN | Withdraw dispute |
| POST | `/api/v1/disputes/:id/evidence` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Upload evidence files |
| GET | `/api/v1/admin/disputes` | SUPER_ADMIN | All disputes |
| GET | `/api/v1/admin/disputes/stats` | SUPER_ADMIN | Dispute stats |
| PATCH | `/api/v1/admin/disputes/:id/transition` | SUPER_ADMIN | State machine transition |
| PATCH | `/api/v1/admin/disputes/:id/assign` | SUPER_ADMIN | Assign reviewer |
| PATCH | `/api/v1/admin/disputes/:id/resolve` | SUPER_ADMIN | Resolve with outcome |

### files (`files.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/files/brand-assets/:id/download` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Download brand asset (attachment) |
| GET | `/api/v1/files/:id` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Stream submission file (inline) |

### finance-admin (`finance-admin.controller.ts`, `exports.controller.ts`, `subscriptions.controller.ts`)

Controller-level `@Roles(SUPER_ADMIN)` on all three.

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/admin/finance/overview` | SUPER_ADMIN | Finance overview + kill-switch state |
| GET | `/api/v1/admin/finance/inbound` | SUPER_ADMIN | Inbound fundings list |
| GET | `/api/v1/admin/finance/reserves` | SUPER_ADMIN | Reserve balances |
| GET | `/api/v1/admin/finance/earnings-payouts` | SUPER_ADMIN | Hunter earnings + payout rollup |
| GET | `/api/v1/admin/finance/payouts` | SUPER_ADMIN, audited | Outbound payout list |
| GET | `/api/v1/admin/finance/refunds` | SUPER_ADMIN | Refunds list |
| GET | `/api/v1/admin/finance/exceptions` | SUPER_ADMIN | Reconciliation exceptions |
| GET | `/api/v1/admin/finance/audit-trail` | SUPER_ADMIN | Finance audit log |
| GET | `/api/v1/admin/finance/groups/:transactionGroupId` | SUPER_ADMIN, audited | Transaction group drill-down |
| GET | `/api/v1/admin/finance/visibility-failures` | SUPER_ADMIN, audited | Submissions w/ visibility failures (ADR 0010) |
| GET | `/api/v1/admin/finance/visibility-failures/:submissionId/history` | SUPER_ADMIN, audited | Per-submission visibility history |
| GET | `/api/v1/admin/finance/visibility-analytics` | SUPER_ADMIN | Per-channel failure-rate analytics |
| POST | `/api/v1/admin/finance/kill-switch` | SUPER_ADMIN, audited | Toggle financial kill switch |
| POST | `/api/v1/admin/finance/dev/seed-payable` | SUPER_ADMIN, audited, gated to non-live | DEV-only hunter payable seed |
| POST | `/api/v1/admin/finance/overrides` | SUPER_ADMIN, audited | Post manual ledger override |
| GET | `/api/v1/admin/finance/exports/inbound.csv` | SUPER_ADMIN, audited | Export inbound CSV |
| GET | `/api/v1/admin/finance/exports/reserves.csv` | SUPER_ADMIN, audited | Export reserves CSV |
| GET | `/api/v1/admin/finance/exports/refunds.csv` | SUPER_ADMIN, audited | Export refunds CSV |
| GET | `/api/v1/admin/finance/exports/ledger.csv` | SUPER_ADMIN, audited | Export ledger CSV |
| GET | `/api/v1/admin/finance/subscriptions` | SUPER_ADMIN | Subscription list |
| POST | `/api/v1/admin/subscriptions/:id/cancel` | SUPER_ADMIN | Admin-cancel subscription |

### finance — payments-health (`payments-health.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/admin/payments-health` | SUPER_ADMIN | Stitch token probe, last webhook, creds hashes |

### health (`health.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/health` | `@Public` | DB + Redis health |
| GET | `/api/v1/health/verify-url` | `@Public`, throttled 30/min | HEAD/GET probe external URL |

### inbox (`inbox.controller.ts`) — all authenticated

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/inbox/unread-count` | All authenticated | Combined unread count |
| GET | `/api/v1/notifications` | All authenticated | List notifications |
| POST | `/api/v1/notifications/:id/read` | All authenticated | Mark one read |
| POST | `/api/v1/notifications/read-all` | All authenticated | Mark all read |
| GET | `/api/v1/conversations` | All authenticated | List conversations |
| POST | `/api/v1/conversations` | All authenticated | Create conversation |
| GET | `/api/v1/conversations/:id` | All authenticated | Conversation + messages |
| POST | `/api/v1/conversations/:id/messages` | All authenticated | Send message |
| PUT | `/api/v1/conversations/:id/messages/:msgId` | All authenticated | Edit message |
| DELETE | `/api/v1/conversations/:id/messages/:msgId` | All authenticated | Delete message |
| POST | `/api/v1/conversations/:id/read` | All authenticated | Mark conversation read |

### kb (`kb.controller.ts`) — SUPER_ADMIN only

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/admin/kb/confidence` | SUPER_ADMIN | Per-system confidence scores |
| GET | `/api/v1/admin/kb/insights/:system` | SUPER_ADMIN | Recurring-issue drill-down |

### payments (`payments.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/bounties/:bountyId/fund` | BUSINESS_ADMIN, SUPER_ADMIN, audited | Kick off Stitch hosted checkout |
| GET | `/api/v1/payments/funding-status` | BUSINESS_ADMIN, SUPER_ADMIN | Poll funding status post-redirect |
| POST | `/api/v1/bounties/:bountyId/payment-intent` | BUSINESS_ADMIN, SUPER_ADMIN | Legacy Stripe payment intent |
| POST | `/api/v1/webhooks/stripe` | `@Public`, Stripe-signature-verified | Legacy Stripe webhook |

### payouts (`payouts.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/payouts/me` | PARTICIPANT | Own payout history |
| POST | `/api/v1/payouts/me/beneficiary` | PARTICIPANT, audited | Upsert beneficiary |
| POST | `/api/v1/payouts/:payoutId/retry` | SUPER_ADMIN, audited | Retry failed payout |

### reconciliation (`reconciliation.controller.ts`) — SUPER_ADMIN only

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/admin/finance/reconciliation/run` | SUPER_ADMIN, audited | Trigger manual reconciliation |
| GET | `/api/v1/admin/finance/reconciliation/exceptions` | SUPER_ADMIN | List recurring issues (filter by resolved) |

### refunds (`refunds.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/refunds/bounties/:bountyId/before-approval` | BUSINESS_ADMIN, SUPER_ADMIN, audited | Request refund before approval |
| POST | `/api/v1/refunds/:refundId/approve-before` | SUPER_ADMIN, audited | Approve before-approval refund |
| POST | `/api/v1/refunds/submissions/:submissionId/after-approval` | SUPER_ADMIN, audited | Request refund after approval |
| POST | `/api/v1/refunds/submissions/:submissionId/after-payout` | SUPER_ADMIN, audited | Request refund after payout (dual-approver) |

### social-handles (`social-handles.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/profile/social-handles` | PARTICIPANT | List own handles |
| POST | `/api/v1/profile/social-handles` | PARTICIPANT | Add handle |
| DELETE | `/api/v1/profile/social-handles/:id` | PARTICIPANT | Remove handle |
| GET | `/api/v1/users/:userId/social-handles` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | View a user's handles |

### submissions (`submissions.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/bounties/:bountyId/submissions` | PARTICIPANT, gated by settings | Create submission |
| GET | `/api/v1/submissions/me` | PARTICIPANT | Own submissions |
| GET | `/api/v1/submissions/me/earnings` | PARTICIPANT | Own earnings rollup |
| GET | `/api/v1/bounties/:bountyId/submissions` | BUSINESS_ADMIN, SUPER_ADMIN | Submissions for a bounty |
| GET | `/api/v1/submissions/queue` | BUSINESS_ADMIN, SUPER_ADMIN | Cross-bounty review queue |
| GET | `/api/v1/submissions/:id` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Submission detail |
| PATCH | `/api/v1/submissions/:id` | PARTICIPANT | Update own submission (resubmit) |
| PATCH | `/api/v1/submissions/:id/review` | BUSINESS_ADMIN, SUPER_ADMIN | Approve/reject/needs-info |
| PATCH | `/api/v1/submissions/:id/payout` | BUSINESS_ADMIN, SUPER_ADMIN | Update payout status + proof |
| POST | `/api/v1/submissions/:id/files` | PARTICIPANT | Upload submission files |

### subscriptions (`subscriptions.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/subscription` | All authenticated | Read current subscription |
| POST | `/api/v1/subscription/subscribe` | PARTICIPANT, BUSINESS_ADMIN | Start subscribe flow |
| POST | `/api/v1/subscription/upgrade` | PARTICIPANT, BUSINESS_ADMIN, audited | Kick off PRO card-consent upgrade |
| POST | `/api/v1/subscription/cancel` | PARTICIPANT, BUSINESS_ADMIN | Cancel (scheduled or immediate) |
| POST | `/api/v1/subscription/reactivate` | PARTICIPANT, BUSINESS_ADMIN | Reactivate before period end |
| GET | `/api/v1/subscription/payments` | PARTICIPANT, BUSINESS_ADMIN | Payment history |

### users (`users.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/users/me` | All authenticated | Own profile |
| PATCH | `/api/v1/users/me` | All authenticated | Update own profile |
| POST | `/api/v1/users/me/profile-picture` | All authenticated | Upload profile pic |
| DELETE | `/api/v1/users/me/profile-picture` | All authenticated | Delete profile pic |
| GET | `/api/v1/users/me/social-links` | All authenticated | List social links |
| POST | `/api/v1/users/me/social-links` | All authenticated | Upsert social link |
| DELETE | `/api/v1/users/me/social-links/:id` | All authenticated | Delete social link |
| GET | `/api/v1/users/search` | All authenticated | User search (for DMs) |
| GET | `/api/v1/hunters` | BUSINESS_ADMIN, SUPER_ADMIN | Hunter directory |
| GET | `/api/v1/hunters/:id` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Public hunter profile |

### wallet (`wallet.controller.ts`)

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| GET | `/api/v1/wallet` | PARTICIPANT | Wallet dashboard |
| GET | `/api/v1/wallet/ledger-snapshot` | PARTICIPANT | Live ledger-projection snapshot |
| GET | `/api/v1/wallet/transactions` | PARTICIPANT | Transaction history |
| POST | `/api/v1/wallet/withdraw` | PARTICIPANT | Request withdrawal |
| GET | `/api/v1/wallet/withdrawals` | PARTICIPANT | Own withdrawals list |
| PATCH | `/api/v1/wallet/withdrawals/:id/cancel` | PARTICIPANT | Cancel own withdrawal |
| GET | `/api/v1/admin/wallets` | SUPER_ADMIN | List all wallets |
| GET | `/api/v1/admin/wallets/:userId` | SUPER_ADMIN | Wallet detail |
| POST | `/api/v1/admin/wallets/:userId/adjust` | SUPER_ADMIN | Manual wallet adjustment |
| GET | `/api/v1/admin/withdrawals` | SUPER_ADMIN | All withdrawals |
| PATCH | `/api/v1/admin/withdrawals/:id/process` | SUPER_ADMIN | Mark processing |
| PATCH | `/api/v1/admin/withdrawals/:id/complete` | SUPER_ADMIN | Complete + proof URL |
| PATCH | `/api/v1/admin/withdrawals/:id/fail` | SUPER_ADMIN | Fail + reason |

### webhooks (`stitch-webhook.controller.ts`, `tradesafe-webhook.controller.ts`)

Public endpoints, but authenticated by Svix HMAC-SHA256 signature per CLAUDE.md financial rules (not unprotected).

| Method | Path | Guard(s) | Purpose |
|--------|------|---------|---------|
| POST | `/api/v1/webhooks/stitch` | `@Public`, Svix-verified | Stitch event ingest |
| POST | `/api/v1/webhooks/stitch/replay/:eventId` | SUPER_ADMIN, audited, non-live only | Dev replay stored event |
| POST | `/api/v1/webhooks/tradesafe` | `@Public`, Svix-verified | TradeSafe event ingest (ADR 0009) |

---

## Stats

- **Web pages**: **91** total `page.tsx` files (2026-04-19).
  - Public / marketing + auth: **9**
  - Shared authenticated: **1**
  - Participant surface: **18**
  - Business admin surface: **23**
  - Super admin surface: **36**
  - Role-ambiguous (`/brands/*`, `/hunters/*`): **4**
- **Deep-link-only pages** (reachable only from another page, not in any nav): **~50** — mostly detail pages (`[id]`), edit/create sub-pages, and the Stitch return page.
- **Orphan pages** (page exists, not in nav, not deep-linked from elsewhere): **0** confirmed. `/create-brand` and `/business/bounties/funded` are intentional out-of-nav entries.
- **Broken nav references**: **0**. Every href in `navigation.ts` resolves to an existing `page.tsx`.
- **API endpoints**: **175** HTTP handlers across **28** controller files. Prefix: `/api/v1`.
  - `@Public()` routes: 12 (auth bootstrap, health, webhooks, public brand read).
  - `@Roles(SUPER_ADMIN)` routes: ~80 (admin + finance-admin + kb + reconciliation).
  - Role-mixed authenticated: remainder.
