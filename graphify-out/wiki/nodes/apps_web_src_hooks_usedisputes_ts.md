# `useDisputes.ts`

> TanStack Query hooks for the disputes surface — mine, brand, detail, create, submit-draft, withdraw, escalate, admin actions.

## What it does

`useDisputes.ts` exports the hook bundle for the dispute surface split across participant, brand, and admin roles. Participant/brand hooks: `useMyDisputes(params)`, `useBrandDisputes(params)` (the `forBrand` keyed query; renamed from `useOrgDisputes` in commit `cb388a2`), `useDispute(id)` (detail), `useCreateDispute` (mutation — invalidates both `mine` and `forBrand` caches), `useSubmitDispute(id)` (draft → OPEN transition), `useWithdrawDispute(id)`. Message/evidence hooks: `useSendDisputeMessage(id)`, `useUploadDisputeEvidence(id)`. Admin hooks: `useAdminDisputes(params)`, `useResolveDispute(id)` (mutation calling `DisputesService.resolve`), `useAssignDispute(id)`, `useTransitionDispute(id)`, `useEscalateDispute(id)`. Uses `queryKeys.disputes.*` with `staleTime: 30_000` on lists and `staleTime: 15_000` on details (detail changes more frequently due to new messages).

## Why it exists

The dispute surface is fragmented across three role-gated views (hunter views their own, brand views their brand's, admin views all) but they all consume the same `Dispute` aggregate. This hook bundle is the single place where the split is managed — `useMyDisputes` vs `useBrandDisputes` vs `useAdminDisputes` have different API endpoints and different invalidation targets but share the mutation paths. The `useBrandDisputes` rename + `queryKeys.disputes.forBrand` key change (commit `cb388a2`) closed a latent bug: the web client was already calling `/disputes/brand` while the API exposed `/disputes/organisation`, returning 404s silently.

## How it connects

- **`disputeApi`** — fetch client in `lib/api/disputes.ts`.
- **`DisputesService`** + **`DisputesController`** — the server-side counterparts.
- **`queryKeys.disputes.*`** — cache-key factory with `mine(params)`, `forBrand(params)`, `detail(id)`, `admin(params)`.
- **`CreateDisputeRequest`, `UpdateDisputeRequest`, `SendDisputeMessageRequest`, `AdminResolveDisputeRequest`, `AdminAssignDisputeRequest`, `AdminTransitionDisputeRequest`, `EscalateDisputeRequest`, `WithdrawDisputeRequest`, `DisputeListParams`, `AdminDisputeListParams` (shared)** — full DTO set.
- **`/participant/my-disputes`, `/business/disputes`, `/admin/disputes` page.tsx** — the three role-gated consumers.
- **`useAdmin.ts`** — sibling hook bundle; `useDisputes.ts` carries the admin dispute-specific hooks directly rather than routing through `useAdmin`.

---
**degree:** 18 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useDisputes.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** keeping admin dispute hooks here (instead of in `useAdmin.ts`) is a choice worth noting — the argument for is that all dispute-related hooks share types and cache keys; the argument against is that it blurs the role-surface split. Currently the placement matches how disputes are actually consumed: the admin dispute pages import from `useDisputes`, not from `useAdmin`.
