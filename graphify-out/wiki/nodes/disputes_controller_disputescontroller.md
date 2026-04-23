# `DisputesController`

> REST controller covering the full dispute surface — participant drafts, brand responses, admin resolution.

## What it does

`DisputesController` exposes the dispute REST surface. Participant/brand endpoints: `POST /disputes` (create a draft dispute — throttled to 5/min), `GET /disputes/me` (hunter's own disputes), `GET /disputes/brand` (brand-scoped disputes — renamed from `/disputes/organisation` in commit `cb388a2`), `GET /disputes/:id` (detail), `PATCH /disputes/:id/submit` (DRAFT → OPEN), `PATCH /disputes/:id/withdraw`, `POST /disputes/:id/messages` (send a message), `POST /disputes/:id/evidence` (upload via multer diskStorage). Admin endpoints: `GET /admin/disputes`, `PATCH /admin/disputes/:id/assign`, `PATCH /admin/disputes/:id/transition`, `PATCH /admin/disputes/:id/resolve`, `PATCH /admin/disputes/:id/escalate`. Evidence uploads are rate-limited and capped per `DISPUTE_EVIDENCE_LIMITS`. Per-endpoint RBAC via `@Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)` or `@Roles(UserRole.SUPER_ADMIN)` where appropriate.

## Why it exists

Disputes are a shared-responsibility surface across all three roles, so this controller is unusual in carrying two `@Roles` patterns — one for participant+business_admin endpoints (mine + brand views + messages) and one for super_admin endpoints (admin queue + resolve + escalate). Keeping them in one controller matches the real-world workflow (the same dispute moves across role contexts) and keeps the shared DTO set (`CreateDisputeDto`, `UpdateDisputeDto`, `SendMessageDto`, `ResolveDisputeDto`, `AssignDisputeDto`, `TransitionDisputeDto`, `EscalateDisputeDto`, `WithdrawDisputeDto`) colocated. Throttling (`@Throttle({ default: { limit: 5, ttl: 60000 } })`) on dispute creation is the anti-spam gate.

## How it connects

- **`DisputesService`** — the delegate; every controller method forwards here.
- **`AuthenticatedUser`** via `@CurrentUser()` decorator — the request's user extracted from the JWT claim.
- **`multer` + `diskStorage`** — the evidence-upload machinery; files land under `uploads/disputes/`.
- **`PARTICIPANT`, `BUSINESS_ADMIN`, `SUPER_ADMIN` roles** — three distinct role sets across the endpoints.
- **`CreateDisputeDto`, `UpdateDisputeDto`, `SendMessageDto`, `ResolveDisputeDto`, `AssignDisputeDto`, `TransitionDisputeDto`, `EscalateDisputeDto`, `WithdrawDisputeDto`** — the validator DTOs under `dto/disputes.validators`.
- **`useDisputes.ts` (web)** — the TanStack Query hook bundle consuming these endpoints.
- **`disputeApi`** — fetch client wrapping these endpoints in the web layer.
- **`DISPUTE_EVIDENCE_LIMITS` (shared)** — caps on file count, file size, total upload size.

---
**degree:** 17 • **community:** "REST API controllers" (ID 4) • **source:** `apps/api/src/modules/disputes/disputes.controller.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** carrying admin and participant-facing endpoints in one controller is deliberate here — the trade-off is file length vs. domain cohesion. If admin-only dispute endpoints grow past ~8, splitting into `DisputesController` + `AdminDisputesController` would match the pattern used elsewhere (`FinanceAdminController` split from a hypothetical combined `FinanceController`).
