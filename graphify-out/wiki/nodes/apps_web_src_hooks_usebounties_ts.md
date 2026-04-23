# `useBounties.ts`

> TanStack Query hooks for the bounty browse, detail, create, update, status, delete surface.

## What it does

`useBounties.ts` exports the hook bundle for the bounty surface: `useBounties(filters)` (list with `BountyListParams` — status, channel, access type, brand, free-text search — backing the participant-facing browse and the business-admin manage view), `useBounty(id)` (detail), `useCreateBounty` (mutation — the DRAFT creation path invalidating the bounty-list cache), `useUpdateBounty(id)` (mutation — invalidates both detail and list caches), `useUpdateBountyStatus(id)` (mutation — the state-machine transition DRAFT → LIVE, LIVE → CLOSED), `useDeleteBounty` (mutation — soft-delete via `deletedAt`). Every mutation invalidates `queryKeys.bounties.lists()` on success so the manage view stays in sync; detail mutations also invalidate `queryKeys.bounties.detail(id)`.

## Why it exists

The bounty surface is the product's core — participants browse, business-admins manage, admins override. Centralising these hooks keeps the cache-invalidation story consistent: after a status update, both list and detail caches invalidate; after an update, the detail cache invalidates alongside the list. The typed `BountyListParams` enforces at compile time that filter querystrings match the API's accepted parameters (status filter is `BountyStatus[]`, not arbitrary string). The Browse-Bounties-UI redesign (commit `7663dfc`) and forward-compat field wiring (commit `4aec8e7`) both flowed through this hook bundle.

## How it connects

- **`bountyApi`** — fetch client in `lib/api/bounties.ts`.
- **`BountiesService`** + **`BountiesController`** — the server-side counterparts.
- **`queryKeys.bounties.*`** — cache-key factory with `list(filters)`, `lists()`, `detail(id)`, `all`.
- **`BountyListParams`, `CreateBountyRequest`, `UpdateBountyRequest`, `BountyStatus` (shared)** — the DTO set.
- **`/bounties`, `/bounties/[id]`, `/business/bounties`, `/business/bounties/[id]`, `/business/bounties/new`, `/admin/bounties` page.tsx** — primary consumers.
- **`useBrand.ts`** — a bounty belongs to a brand; many consumers chain a bounty query into a brand query.
- **`useAdmin.ts`** — admin-override bounty hooks live there (`useOverrideBountyStatus`) rather than here.

---
**degree:** 16 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useBounties.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** `useBounties(filters)` keys on the full filter object (`queryKeys.bounties.list(filters)`), which means every filter-set mutation generates a new cache entry. For typical browse interactions this is fine; for bulk-filter-toggling UIs, consider debouncing the filter-state that drives the key to avoid cache churn.
