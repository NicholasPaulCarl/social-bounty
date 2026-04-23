# `AuthGuard business/layout` (concept)

> The Next.js layout-level RBAC pattern that gates entire route subtrees in one place.

## What it does

`concept_rbac_layout_guard` represents the architectural pattern whereby every `/business/*`, `/admin/*`, and `/participant/*` route is gated by a single `<AuthGuard allowedRoles={[...]}>` wrapper at the `layout.tsx` level, not per-page. Concretely: `apps/web/src/app/business/layout.tsx` wraps its children with `<AuthGuard allowedRoles={[UserRole.BUSINESS_ADMIN]}>`, which reads the current user via `useAuth()`, short-circuits rendering to a spinner while loading, redirects to `/login` if unauthenticated, and redirects to `/` with a toast if the user's role isn't in `allowedRoles`. The same pattern at `apps/web/src/app/admin/layout.tsx` gates the full admin tree to SUPER_ADMIN, and `apps/web/src/app/(participant)/layout.tsx` gates to PARTICIPANT.

## Why it exists

Per-page `useEffect(() => router.push('/login'))` redirects are a classic RBAC-bypass footgun — a momentary render of the protected page leaks data. Hoisting the check to the layout means the check runs before any page renders, and a single audit of three layout files confirms gating for 70+ routes. Hard Rule #2 (RBAC mandatory on every screen) is uniformly satisfied through this pattern. The `AuthGuard` composition with Next.js's nested-layout model is what makes the one-layout-per-role architecture tractable — adding a new `/business/X` page inherits gating automatically.

## How it connects

- **`SUPER_ADMIN`, `BUSINESS_ADMIN`, `PARTICIPANT` roles** — the enum values passed to `allowedRoles`.
- **`useAuth()` hook** — the data source for the guard's decision; reads `{ user, isLoading, isAuthenticated }` from `AuthContext`.
- **`apps/web/src/app/business/layout.tsx`** — the canonical example, gating the BUSINESS_ADMIN surface.
- **`apps/web/src/app/admin/layout.tsx`** — the SUPER_ADMIN version.
- **`apps/web/src/app/(participant)/layout.tsx`** — the PARTICIPANT version (parenthesised route group so `/inbox`, `/my-submissions`, etc. don't carry `/participant/` prefixes in the URL).
- **Page specs** — every page-spec document cross-references the layout-level role gate.
- **Business Bounty Detail page (`/business/bounties/[id]`)** — a representative business-admin page transitively gated by the layout.

The degree of 22 reflects how many route files and page specs cite this pattern as the justification for their RBAC behaviour.

---
**degree:** 22 • **community:** "Page spec documentation" (ID 5) • **source:** `apps/web/src/app/business/layout.tsx` (pattern reference)

> **Architectural note:** this pattern's scope is exactly "routes that render protected data". The login/signup/marketing routes and the shared `/create-brand` route intentionally don't use it. Any new top-level route subtree (say, `/partner/*`) should add its own layout guard; missing one would be the kind of bug that's easy to ship and hard to spot.
