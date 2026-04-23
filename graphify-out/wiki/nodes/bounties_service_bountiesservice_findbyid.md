# `BountiesService.findById()`

> Single read method returning the `BountyDetailResponse` for the bounty-detail surface — participant and brand views.

## What it does

`BountiesService.findById(id, user?)` is the read path for a single bounty. It fetches the bounty row plus its related rewards, channels, brand-asset list, and engagement requirements via a Prisma `findUnique` with `include`, then maps to `BountyDetailResponse`. The response includes `accessType: BountyAccessType` (non-nullable, wired 2026-04-17 commit `da71b0a` after the fix confirmed the field is required end-to-end for the CLOSED padlock badge + the `/bounties/:id/apply` route gate). RBAC: PARTICIPANT callers get a sanitised shape (no financial-admin-only fields); BUSINESS_ADMIN callers get their brand's bounties with full detail; SUPER_ADMIN gets full detail for any bounty. Deleted bounties (`deletedAt !== null`) throw `NotFoundException` — soft-delete is transparent to callers.

## Why it exists

Every bounty-detail UI surface — `/bounties/[id]` (participant), `/business/bounties/[id]` (brand), `/admin/bounties/[id]` (admin), plus `/bounties/[id]/apply`, `/bounties/[id]/submit`, `/business/bounties/[id]/edit` — ultimately reads through this method. Making it the single source means the `BountyDetailResponse` contract can't drift across surfaces; a field added here appears in every detail view. The 2026-04-17 `accessType` wire-up was the canonical example of a latent bug closed by adding a field here: the Prisma column existed, the enum was exported, the UI was reading via casts with `?? PUBLIC` fallback — but this method wasn't serializing `accessType` so the CLOSED branch was unreachable.

## How it connects

- **`BountiesService` (class)** — the enclosing service; this is its primary read method.
- **`BountyDetailResponse` (shared DTO)** — the response shape this method produces.
- **`BountyAccessType` (shared enum)** — the non-nullable field wired 2026-04-17.
- **`PrismaService`** — via `this.prisma.bounty.findUnique`.
- **`BountyAccessService.applyToBounty`** — independent query (bounty-access.service.ts:528 uses its own `select`) — a deliberate duplication to avoid depending on this response shape.
- **`useBounty(id)` hook (web)** — the TanStack Query hook consuming this endpoint.
- **`BountiesController.findById`** — the HTTP shell.
- **`/bounties/[id]` (participant view)** — the primary UI consumer; renders the PUBLIC/CLOSED padlock from the `accessType` field.

---
**degree:** 16 • **community:** "Bounty access & mutation" (ID 15) • **source:** `apps/api/src/modules/bounties/bounties.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** sibling services (`BountyAccessService`) doing their own Prisma `select` rather than calling through here is a design choice that reduces coupling at the cost of potential shape drift. Any new field added to `BountyDetailResponse` should include a grep for `bounty.findUnique` / `bounty.findMany` across the API to confirm sibling queries don't need the same field.
