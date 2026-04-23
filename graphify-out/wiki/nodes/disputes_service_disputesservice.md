# `DisputesService`

> Governs the end-to-end dispute lifecycle — creation, evidence, transitions, resolutions, escalation.

## What it does

`DisputesService` owns the dispute state machine: DRAFT → OPEN → UNDER_REVIEW → AWAITING_RESPONSE → (ESCALATED →) RESOLVED → CLOSED, plus WITHDRAWN as a terminal from early states. `.create()` instantiates a dispute with a category (`NON_PAYMENT`, `POST_QUALITY`, `POST_NON_COMPLIANCE`) and reason from the `CATEGORY_REASONS` mapping (e.g. NON_PAYMENT accepts `PAYMENT_NOT_RECEIVED`, `PAYMENT_INCORRECT_AMOUNT`, `PAYMENT_DELAYED_BEYOND_TERMS`, `PAYOUT_MARKED_BUT_NOT_RECEIVED`). `.sendMessage()` appends a message of type `PARTICIPANT_MESSAGE` / `BUSINESS_RESPONSE` / `ADMIN_NOTE`. `.uploadEvidence()` attaches typed `EvidenceType` files via multer storage. `.resolve()` (admin-only) applies a `DisputeResolution` — `IN_FAVOUR_OF_PARTICIPANT`, `IN_FAVOUR_OF_BRAND`, `SPLIT`, `NO_ACTION` — and may chain ledger writes via `LedgerService.postTransactionGroup` when the resolution moves money. `.escalate()` transitions OPEN/UNDER_REVIEW/AWAITING_RESPONSE → ESCALATED and opens the SUPER_ADMIN review surface.

## Why it exists

Disputes are the platform's safety valve when the auto-approval flow fails or a hunter/brand relationship breaks down after payout. Without a typed state machine and a bounded set of resolutions, disputes would become ad-hoc email threads and the AuditLog would be unreliable. The `DISPUTE_TRANSITIONS` map at module scope is the enforcement point — any transition not in the map throws `BadRequestException`. The `CATEGORY_REASONS` map ensures `reason` is always one of a known set for its category (FE forms populate from this; BE rejects drift). Hard Rule #3 applies — every state transition writes an AuditLog entry via `AuditService.log()` inside the transaction.

## How it connects

- **`DisputesController`** — the HTTP shell that forwards REST calls; `/disputes/brand` route was fixed 2026-04-17 (commit `cb388a2`) to match the frontend's call path.
- **`.resolve()` method** — the SUPER_ADMIN-only terminal state; the highest-degree method (15) on this service.
- **`AuditService.log()`** — every state change is audited inline (Hard Rule #3).
- **`MailService`** — transition notifications (escalation, resolution, response-required) send emails.
- **`LedgerService.postTransactionGroup`** — indirectly via `.resolve()` when a `IN_FAVOUR_OF_PARTICIPANT` resolution triggers a refund-side or payout-side compensating entry.
- **`DISPUTE_LIMITS`, `DISPUTE_EVIDENCE_LIMITS` (shared)** — cap file counts, message lengths, and evidence sizes.
- **`useDisputes.ts` (web)** — the TanStack Query hook bundle consuming this service's REST endpoints.

The degree of 22 reflects the service's reach into audit, mail, ledger, and the full dispute-surface frontend.

---
**degree:** 22 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/disputes/disputes.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `DISPUTE_TRANSITIONS` map is the load-bearing bit. If the product adds a new state (e.g. "MEDIATION"), that's a one-line map change — but consumers across `useDisputes.ts`, the status-badge component, and the page spec docs must all be updated in lockstep. A state-machine test generator could protect against drift.
