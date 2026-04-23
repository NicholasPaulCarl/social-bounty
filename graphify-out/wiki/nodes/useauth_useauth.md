# `useAuth()`

> The central auth hook — exposes user state, token, login/logout/signup mutations, and is the substrate for `<AuthGuard>`.

## What it does

`useAuth()` is the React hook that reads `AuthContext` and returns `{ user, isLoading, isAuthenticated, token, login, logout, signup, requestOtp, verifyOtp, switchBrand, refreshUser }`. The underlying `<AuthProvider>` (at `apps/web/src/contexts/AuthContext.tsx`) boots by reading the JWT from localStorage, decoding it to get `{ userId, email, role, brandId, brandIds[] }`, then fetching the full user record via `authApi.me()` to hydrate `user`. Every mutation (login/logout/signup/verifyOtp/switchBrand) updates both the context state and the localStorage token; `refreshUser()` is the escape hatch for pages that have mutated the user record server-side and need to re-pull. `switchBrand(targetBrandId)` is the multi-brand JWT rotation — calls `authApi.switchBrand`, receives a new token with `brandId` set to the target, updates context.

## Why it exists

Every role-aware hook (`useBounties`, `useBrand`, `useWallet`, `useDisputes`, `useAdmin`) transitively depends on this — the API fetch client reads `token` from AuthContext for the `Authorization: Bearer` header. `<AuthGuard>` (concept_rbac_layout_guard) reads `user.role` and `isAuthenticated` to make its redirect decision. The multi-brand rotation via `switchBrand` is the non-obvious bit — the JWT claim set includes both the active `brandId` and the full `brandIds[]` array (enabled by the compat shim in commit `8c50d38`), so a BUSINESS_ADMIN can switch context without losing access to their other brands.

## How it connects

- **`AuthContext`** — the React context this hook reads from.
- **`authApi`** — the fetch client for `login`, `logout`, `signup`, `me`, `switchBrand`, `requestOtp`, `verifyOtp`.
- **`AuthGuard`** — the layout-level role gate consuming `isAuthenticated` and `user.role`.
- **`useAdmin.ts`, `useBrand.ts`, `useWallet.ts`, `useDisputes.ts`, `useBounties.ts`** — every downstream hook inherits the token from this provider via the shared fetch client.
- **`UserRole` enum (shared)** — the role decoded from the JWT.
- **`switchBrand` concept** — the multi-brand rotation this hook implements.
- **`jwt.strategy.ts` (API)** — the server-side counterpart that verifies the JWT and populates `request.user`.

---
**degree:** 16 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useAuth.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the boot flow (localStorage → decode JWT → fetch `/auth/me`) has an inherent two-request waterfall. A single-request "whoami" endpoint returning token+user together would trim perceived load time by ~200ms on cold starts. Not urgent — the current flow is correct, just not minimal.
