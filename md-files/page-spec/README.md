# Page specs

Detailed spec per page in `apps/web/src/app/`. Generated 2026-04-19, one file per route — 91 specs, ~6600 lines.

Each spec follows the same template:

- **Route path · File · Role · Access · Nav entry · Layout** header block
- **Purpose** — what the user accomplishes in 1–2 sentences
- **Entry & exit** — inbound sources + outbound hrefs
- **Data** — hooks, API endpoints, URL + search params
- **UI structure** — top-to-bottom enumeration of major sections / components
- **States** — loading / empty / error / success
- **Primary actions** — labelled action table
- **Business rules** — RBAC, kill-switch, plan-tier, state-machine gates, CLAUDE.md §4 financial non-negotiables where applicable
- **Edge cases** — unauthorized, missing data, race conditions, rate limits
- **Tests** — colocated spec files
- **Related files** — non-obvious imports
- **Open questions / TODOs** — inferable gaps

**Companion docs:** [`../../docs/architecture/sitemap.md`](../../docs/architecture/sitemap.md) · [`../../apps/web/src/lib/navigation.ts`](../../apps/web/src/lib/navigation.ts) · [`../../CLAUDE.md`](../../CLAUDE.md)

**When to update:** whenever you add, rename, move, or delete a `page.tsx`, update its spec here and the sitemap together. Role gates live in the corresponding `layout.tsx` — reflect changes there too.

---

## 1 — Public / unauthenticated (9)

| URL | Spec |
|-----|------|
| `/` | [root.md](./root.md) |
| `/contact` | [contact.md](./contact.md) |
| `/join/business` | [join-business.md](./join-business.md) |
| `/join/hunter` | [join-hunter.md](./join-hunter.md) |
| `/pricing` | [pricing.md](./pricing.md) |
| `/privacy` | [privacy.md](./privacy.md) |
| `/terms` | [terms.md](./terms.md) |
| `/login` | [login.md](./login.md) |
| `/signup` | [signup.md](./signup.md) |

## 2 — Shared authenticated (1)

| URL | Spec |
|-----|------|
| `/create-brand` | [create-brand.md](./create-brand.md) |

## 3 — Participant — USER role (18)

| URL | Spec |
|-----|------|
| `/inbox` | [inbox.md](./inbox.md) |
| `/inbox/conversations/[id]` | [inbox-conversations-id.md](./inbox-conversations-id.md) |
| `/bounties` | [bounties.md](./bounties.md) |
| `/bounties/[id]` | [bounties-id.md](./bounties-id.md) |
| `/bounties/[id]/apply` | [bounties-id-apply.md](./bounties-id-apply.md) |
| `/bounties/[id]/submit` | [bounties-id-submit.md](./bounties-id-submit.md) |
| `/my-submissions` | [my-submissions.md](./my-submissions.md) |
| `/my-submissions/[id]` | [my-submissions-id.md](./my-submissions-id.md) |
| `/my-disputes` | [my-disputes.md](./my-disputes.md) |
| `/my-disputes/new` | [my-disputes-new.md](./my-disputes-new.md) |
| `/my-disputes/[id]` | [my-disputes-id.md](./my-disputes-id.md) |
| `/wallet` | [wallet.md](./wallet.md) |
| `/wallet/transactions` | [wallet-transactions.md](./wallet-transactions.md) |
| `/wallet/withdraw` | [wallet-withdraw.md](./wallet-withdraw.md) |
| `/settings/subscription` | [settings-subscription.md](./settings-subscription.md) |
| `/settings/payouts` | [settings-payouts.md](./settings-payouts.md) |
| `/profile` | [profile.md](./profile.md) |
| `/profile/edit` | [profile-edit.md](./profile-edit.md) |

## 4 — Business admin — BUSINESS_ADMIN role (23)

| URL | Spec |
|-----|------|
| `/business/dashboard` | [business-dashboard.md](./business-dashboard.md) |
| `/business/bounties` | [business-bounties.md](./business-bounties.md) |
| `/business/bounties/new` | [business-bounties-new.md](./business-bounties-new.md) |
| `/business/bounties/funded` | [business-bounties-funded.md](./business-bounties-funded.md) |
| `/business/bounties/[id]` | [business-bounties-id.md](./business-bounties-id.md) |
| `/business/bounties/[id]/edit` | [business-bounties-id-edit.md](./business-bounties-id-edit.md) |
| `/business/bounties/[id]/submissions` | [business-bounties-id-submissions.md](./business-bounties-id-submissions.md) |
| `/business/bounties/[id]/submissions/[submissionId]` | [business-bounties-id-submissions-submissionid.md](./business-bounties-id-submissions-submissionid.md) |
| `/business/bounties/[id]/applications` | [business-bounties-id-applications.md](./business-bounties-id-applications.md) |
| `/business/bounties/[id]/invitations` | [business-bounties-id-invitations.md](./business-bounties-id-invitations.md) |
| `/business/review-center` | [business-review-center.md](./business-review-center.md) |
| `/business/review-center/[id]` | [business-review-center-id.md](./business-review-center-id.md) |
| `/business/disputes` | [business-disputes.md](./business-disputes.md) |
| `/business/disputes/new` | [business-disputes-new.md](./business-disputes-new.md) |
| `/business/disputes/[id]` | [business-disputes-id.md](./business-disputes-id.md) |
| `/business/brands` | [business-brands.md](./business-brands.md) |
| `/business/brands/create` | [business-brands-create.md](./business-brands-create.md) |
| `/business/brands/edit` | [business-brands-edit.md](./business-brands-edit.md) |
| `/business/brands/[id]/edit` | [business-brands-id-edit.md](./business-brands-id-edit.md) |
| `/business/brands/kyb` | [business-brands-kyb.md](./business-brands-kyb.md) |
| `/business/brands/members` | [business-brands-members.md](./business-brands-members.md) |
| `/business/brands/subscription` | [business-brands-subscription.md](./business-brands-subscription.md) |
| `/business/profile` | [business-profile.md](./business-profile.md) |

## 5 — Super admin — SUPER_ADMIN role (36)

### Core admin (22)

| URL | Spec |
|-----|------|
| `/admin/dashboard` | [admin-dashboard.md](./admin-dashboard.md) |
| `/admin/users` | [admin-users.md](./admin-users.md) |
| `/admin/users/[id]` | [admin-users-id.md](./admin-users-id.md) |
| `/admin/brands` | [admin-brands.md](./admin-brands.md) |
| `/admin/brands/new` | [admin-brands-new.md](./admin-brands-new.md) |
| `/admin/brands/[id]` | [admin-brands-id.md](./admin-brands-id.md) |
| `/admin/bounties` | [admin-bounties.md](./admin-bounties.md) |
| `/admin/bounties/[id]` | [admin-bounties-id.md](./admin-bounties-id.md) |
| `/admin/submissions` | [admin-submissions.md](./admin-submissions.md) |
| `/admin/submissions/[id]` | [admin-submissions-id.md](./admin-submissions-id.md) |
| `/admin/disputes` | [admin-disputes.md](./admin-disputes.md) |
| `/admin/disputes/[id]` | [admin-disputes-id.md](./admin-disputes-id.md) |
| `/admin/wallets` | [admin-wallets.md](./admin-wallets.md) |
| `/admin/wallets/[userId]` | [admin-wallets-userid.md](./admin-wallets-userid.md) |
| `/admin/withdrawals` | [admin-withdrawals.md](./admin-withdrawals.md) |
| `/admin/audit-logs` | [admin-audit-logs.md](./admin-audit-logs.md) |
| `/admin/audit-logs/[id]` | [admin-audit-logs-id.md](./admin-audit-logs-id.md) |
| `/admin/payments-health` | [admin-payments-health.md](./admin-payments-health.md) |
| `/admin/troubleshooting` | [admin-troubleshooting.md](./admin-troubleshooting.md) |
| `/admin/settings` | [admin-settings.md](./admin-settings.md) |
| `/admin/component-library` | [admin-component-library.md](./admin-component-library.md) |
| `/admin/profile` | [admin-profile.md](./admin-profile.md) |

### Finance (14)

| URL | Spec |
|-----|------|
| `/admin/finance` | [admin-finance.md](./admin-finance.md) |
| `/admin/finance/inbound` | [admin-finance-inbound.md](./admin-finance-inbound.md) |
| `/admin/finance/reserves` | [admin-finance-reserves.md](./admin-finance-reserves.md) |
| `/admin/finance/earnings-payouts` | [admin-finance-earnings-payouts.md](./admin-finance-earnings-payouts.md) |
| `/admin/finance/payouts` | [admin-finance-payouts.md](./admin-finance-payouts.md) |
| `/admin/finance/refunds` | [admin-finance-refunds.md](./admin-finance-refunds.md) |
| `/admin/finance/subscriptions` | [admin-finance-subscriptions.md](./admin-finance-subscriptions.md) |
| `/admin/finance/visibility-failures` | [admin-finance-visibility-failures.md](./admin-finance-visibility-failures.md) |
| `/admin/finance/exceptions` | [admin-finance-exceptions.md](./admin-finance-exceptions.md) |
| `/admin/finance/audit-trail` | [admin-finance-audit-trail.md](./admin-finance-audit-trail.md) |
| `/admin/finance/overrides` | [admin-finance-overrides.md](./admin-finance-overrides.md) |
| `/admin/finance/insights` | [admin-finance-insights.md](./admin-finance-insights.md) |
| `/admin/finance/insights/[system]` | [admin-finance-insights-system.md](./admin-finance-insights-system.md) |
| `/admin/finance/groups/[transactionGroupId]` | [admin-finance-groups-transactiongroupid.md](./admin-finance-groups-transactiongroupid.md) |

## 6 — Role-ambiguous (4)

| URL | Spec | Notes |
|-----|------|-------|
| `/brands` | [brands.md](./brands.md) | Public-crawlable (no `AuthGuard` on layout) |
| `/brands/[id]` | [brands-id.md](./brands-id.md) | Public brand profile |
| `/hunters` | [hunters.md](./hunters.md) | `AuthGuard` without role filter — participants land then hit 403 on API |
| `/hunters/[id]` | [hunters-id.md](./hunters-id.md) | Auth-guarded hunter profile |

---

## Stats

- **91** specs · 9 public/auth · 1 shared · 18 participant · 23 business · 36 admin · 4 role-ambiguous
- **~6600** lines total, avg 73 lines per spec
- **0** broken nav references at generation time
- **0** true orphans — `/create-brand` and `/business/bounties/funded` are intentional out-of-nav flows

## Issues surfaced during spec generation

Side-findings the agents flagged while reading source. Not a formal audit — treat as leads, verify before acting.

### Content drift
- `/pricing` FAQ #6 says "via Stripe" — stale; live provider is Stitch Express
- `/terms` §Limitation of Liability caps at **USD $100** on an otherwise ZAR platform
- `/terms` §Eligibility requires **18+** but `/signup` has no age gate
- `/join/hunter` + `/pricing` advertise "same-day payouts" for Pro Hunters vs canonical T+3 clearance in `md-files/payment-gateway.md`

### Dead / stub code
- `/contact` form submit is simulated (`setTimeout` + `Math.random()`) — no backend endpoint wired
- `/hunters/[id]` "Invite to Bounty" button has no `onClick`
- `/business/bounties` + `/business/bounties/[id]` `PaymentDialog` (legacy embedded Stripe) rendered only when `clientSecret` is set — but nothing sets it after the Stitch hosted-checkout refactor (commit `bd2480b`)
- `/business/bounties/[id]/invitations` hardcodes "Revoke is not yet supported by the API" — the `DELETE /api/v1/bounties/:bountyId/invitations/:id` endpoint exists
- `/business/disputes/[id]` unused `DISPUTE_CATEGORY_COLORS` import duplicated by local `categoryColors`

### Inconsistent UI
- `/business/review-center/[id]` missing `<VerificationReportPanel>` despite the approval gate depending on scrape status (per-bounty review page has it)
- `/business/bounties/[id]/applications` casts `StatusBadge type="application" as "bounty"` — shared component lacks an application variant
- `/admin/finance/earnings-payouts` uses `LoadingState type="cards-grid"` for a table layout
- `/admin/finance/audit-trail` hardcodes `limit=200` and renders `actorId.slice(0, 8)…` without resolving to a user name
- `/admin/disputes` KPI cards deep-link `?status=...` but the list filter ignores the URL param on mount
- `/admin/wallets/[userId]` ledger rows not linked to `/admin/finance/groups/[transactionGroupId]`
- `/admin/audit-logs` list has no row link into `/admin/audit-logs/[id]`

### Pending wiring
- `/admin/finance/payouts` has no TradeSafe `provider` column (R32 schema shipped 2026-04-18, UI deferred)
- `/admin/finance/subscriptions` has no row drilldown despite `/admin/subscriptions/:id/cancel` endpoint existing
- `/bounties/[id]` declares a local `PayoutMethod` enum pending export from `@social-bounty/shared`
- `/bounties/[id]` renders `proofRequirements` via a hardcoded string whitelist — fragile for future values
- `/wallet` "Pending" balance hardcoded to `'0'` until the ledger projection splits `hunter_pending` / `hunter_clearing` / `hunter_net_payable`
- `/profile/edit` swallows delete-link errors silently; partial `Promise.all` upsert failures not surfaced; no dirty-state guard on navigate-away
- `/admin/brands/new` uses `useAdminCreateOrg` — legacy `Org` prefix left over after the Organisation → Brand rename

### Forward-compat / infra
- `/hunters/[id]` uses Next 14 sync `params: { id }` shape — will break on Next 15 async params
- `/hunters/[id]` falls back to `MOCK_PROFILE` on error — dev scaffolding to remove
- `/admin/finance/insights-system` row-class precedence between `bg-danger-50/40` (ineffective-fix) and `opacity-60` (resolved) is first-match-wins; verify the ordering is correct

None of the above block the existing build or tests. Each is a small, independent cleanup candidate.
