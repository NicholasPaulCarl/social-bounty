# Plan: Complete TradeSafe unified-rail integration (Phase 1c–2)

**Request:** Complete the Workstream B plan started in [d3b4136…fee3571] — the TradeSafe pivot from Stitch inbound + outbound to a single TradeSafe rail, plus the "/dev-tradesafe" skill the user's slash-command referenced.

**Lead:** dev-team-lead (senior dev / architect / PO / PM)

---

## 1. Inventory

**Existing subagent types (tool-level):** `Explore`, `general-purpose`, `Plan`. No `.claude/agents/*.md` executable subagents found. Project convention (per `CLAUDE.md` Hard Rule #8) is to use the tool-level agents and brief them with the project play-books in `md-files/agents/`.

**Existing skills found at `/Users/nicholasschreiber/social-bounty/.agents/`:**
- `DevStitchPayments` — Stitch Express + Svix integration reference (endpoints, webhooks, troubleshooting). This is what the in-progress Stitch work was built on.
- `supabase-postgres-best-practices` — Postgres performance & schema patterns.

**Play-books at `md-files/agents/` (project convention):**
- `agent-team-lead.md`, `agent-architect.md`, `agent-backend.md`, `agent-frontend.md`, `agent-qa-testing.md`, `agent-ux-designer.md`, `agent-ui-designer.md`, `agent-devops.md`, `agent-overview.md`

**Context files honored:**
- `CLAUDE.md` — Hard Rules (esp. #4 tests-must-pass, #3 audit-logs, #8 parallel-agents), Financial Non-Negotiables §4 (idempotency, double-entry, integer minor units, plan snapshot, etc.)
- `AGENTS.md`, `md-files/payment-gateway.md`, `md-files/financial-architecture.md`, `md-files/knowledge-base.md`

**Gaps identified:**
- `DevTradeSafe` skill does not exist. The user invoked `/dev-tradesafe` in the command args — this is the gap. TradeSafe is becoming a first-class rail, so a reusable reference skill (mirrors `DevStitchPayments`) is warranted. **Install path: `/Users/nicholasschreiber/social-bounty/.agents/skills/DevTradeSafe/SKILL.md`** (plus `references/api-endpoints.md`, `references/webhooks.md`, `references/troubleshooting.md`, `CLAUDE.md` mirror of the DevStitchPayments structure). Created in Wave 1.A3 per gap protocol.

---

## 2. Scope

### Goals (this session)

- **G1.** Ship Phase 1c — ADR 0011 "TradeSafe unified inbound + outbound rail" documenting the architectural pivot (supersedes ADR 0003 platform-custody, extends ADR 0008 outbound-only).
- **G2.** Ship Phase 1d — TradeSafe callback webhook handler wired into the existing `WebhookRouterService`. Uses the URL-path-secret + authoritative GraphQL re-fetch pattern agreed earlier.
- **G3.** Land Phase 2 foundation — Prisma schema migration (User.tradeSafeTokenId + TradeSafeTransaction + TradeSafeAllocation tables) + token-lifecycle service skeleton. Ready for Phase 3 inbound cutover.
- **G4.** Install `DevTradeSafe` skill at `.agents/skills/DevTradeSafe/` so future TradeSafe work has the same reference material `DevStitchPayments` provides for Stitch.

### Non-goals (explicitly deferred)

- **Phase 3 inbound cutover** — swapping `StitchPaymentsService` → `TradeSafePaymentsService` on the bounty fund endpoint. Requires confirmed fee structure mapping to TradeSafe's AGENT party model + the live bounty-creation integration test matrix.
- **Phase 4 outbound cutover** — hooking submission approval into `allocationAcceptDelivery`. Requires Phase 3 landed first (the allocation ID comes from the transaction created at funding time).
- **Phase 5 reconciliation + go-live** — requires R24 closure (live TradeSafe creds for production) and R31 resolution (webhook signature scheme — currently mitigated by the URL-secret + re-fetch pattern but a real HMAC would be additive).
- **Stitch code deletion** — keep everything live until Phase 3/4 cutover, then delete in a dedicated deprecation wave.

### Acceptance criteria

- [ ] `docs/adr/0011-tradesafe-unified-rail.md` exists, status `Accepted`, supersedes ADR 0003 explicitly, records all four commercial decisions (fees, signature scheme, amount units, org token timing).
- [ ] `POST /api/v1/webhooks/tradesafe/:secret` route exists, verifies path secret in constant time, rejects mismatches with 401, and on valid receipt issues a `getTransaction(id)` re-fetch + dispatches to domain handler. Idempotency via `UNIQUE(provider, externalEventId)` on `webhook_events` (existing constraint).
- [ ] Prisma migration file under `packages/prisma/migrations/` that adds `User.tradeSafeTokenId` nullable column + `TradeSafeTransaction` + `TradeSafeAllocation` tables. Idempotent (`IF NOT EXISTS` patterns from batch 13A).
- [ ] `TradeSafeTokenService.ensureToken(user)` exists — calls `tokenCreate` if `user.tradeSafeTokenId` is null, otherwise no-op. Fire-and-forget from signup hook; blocking from Phase 3 bounty-funding path (deferred).
- [ ] `.agents/skills/DevTradeSafe/SKILL.md` exists with frontmatter + quick-reference + references to api-endpoints/webhooks/troubleshooting.
- [ ] All API tests green (1370/1373 baseline + whatever this adds).
- [ ] Live smoke test (`TRADESAFE_LIVE_SMOKE=1`) still passes after schema migration applied to staging Supabase.

### Open questions

None material to this scope. Commercial follow-ups (fee mapping to AGENT party, production credentials, org token acquisition) are explicit non-goals and blockers for Phases 3-5, not for this session.

---

## 3. Execution plan

### Wave 1 — Fan-out foundation (4 items, fully parallel)

| #   | Item                                 | Agent                          | Inputs                                                                                                                  | Output artifact                                                                                                                                                                                                                        | Acceptance check                                                                                                                                            | Effort |
| --- | ------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.1 | ADR 0011 TradeSafe unified rail      | general-purpose (architect)    | Existing ADRs 0001–0010, CLAUDE.md Financial Non-Negotiables §4, captured commercial decisions from conversation        | `docs/adr/0011-tradesafe-unified-rail.md` — status Accepted, supersedes ADR 0003 (platform custody → per-bounty escrow), extends ADR 0008 (outbound only → unified). Documents fees, signature scheme, amount units, phased cutover.  | File exists, passes `markdownlint`-level sanity, cross-references ADR 0003 + 0008 bidirectionally, no unresolved TBDs.                                      | S      |
| 1.2 | TradeSafe callback webhook handler   | general-purpose (backend)      | `apps/api/src/modules/webhooks/webhook-router.service.ts` (the `dispatch` arms), `TradeSafeGraphQLClient.getTransaction` | `apps/api/src/modules/webhooks/tradesafe-callback.controller.ts` (NEW — distinct from the existing `TradeSafeWebhookController` which handles Svix-formatted outbound webhooks). Mounted at `POST /api/v1/webhooks/tradesafe/:secret`. | URL-secret constant-time compared against `TRADESAFE_CALLBACK_SECRET`, 401 on mismatch. On valid receipt: re-fetches `getTransaction(id)`, dispatches to router. 5-test matrix per CLAUDE.md §5 (Financial). | M      |
| 1.3 | DevTradeSafe skill                   | skill-creator (via manual Write) | Existing `.agents/skills/DevStitchPayments/` as shape reference, scraped TradeSafe docs (already fetched in conversation) | `.agents/skills/DevTradeSafe/SKILL.md` + `references/api-endpoints.md` + `references/webhooks.md` + `references/troubleshooting.md` + `CLAUDE.md` nav guide.                                                                          | Frontmatter has `name: DevTradeSafe` + `description`. References populated with the GraphQL operations we already verified against sandbox.                 | S      |
| 1.4 | Prisma schema + migration            | general-purpose (backend)      | `packages/prisma/schema.prisma`, batch 13A idempotent-migration pattern                                                  | `packages/prisma/migrations/<ts>_tradesafe_schema/migration.sql` — adds `users.tradeSafeTokenId` TEXT NULL + `tradesafe_transactions` + `tradesafe_allocations` tables with FK to `bounties`. Idempotent (`IF NOT EXISTS`).          | `npx prisma migrate dev` applies cleanly on a fresh DB AND is a no-op on staging Supabase (already-applied guard). `npm run db:generate` regenerates client. | M      |

All four items write to disjoint files. No cross-dependencies. Dispatch in one tool-use block.

### Wave 2 — Token lifecycle service (2 items, depends on 1.4)

| #   | Item                            | Agent                     | Inputs                                                                         | Output artifact                                                                                                                                      | Acceptance check                                                                                                            | Effort |
| --- | ------------------------------- | ------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | `TradeSafeTokenService`         | general-purpose (backend) | 1.4 schema (User.tradeSafeTokenId), `TradeSafeGraphQLClient.tokenCreate`       | `apps/api/src/modules/tradesafe/tradesafe-token.service.ts` + spec. `.ensureToken(user)` idempotent — short-circuits when user already has a token. | Unit-tested: fresh user (null token) calls `tokenCreate` and persists the returned ID; user with existing token is no-op.   | S      |
| 2.2 | Signup hook wiring              | general-purpose (backend) | 2.1 service, `apps/api/src/modules/auth/auth.service.ts` registration path    | Non-blocking `setImmediate` call to `tradeSafeTokenService.ensureToken(user)` after email-verified signup. Fire-and-forget with try/catch logging.  | Unit-tested: registration flow still completes when TradeSafe is down; token row appears on success path.                   | S      |

### Wave 3 — DEFERRED (Phases 3, 4, 5)

Not part of this session's dispatch. Requires commercial blockers closed:

- **R24** — live TradeSafe credentials for staging + production.
- **Fee-to-AGENT-party mapping** — confirmed with TradeSafe product how multiple fee streams (20%/15%/5%) map to TradeSafe's single-AGENT fee field. Might need feeAllocation: BUYER + a multi-allocation split.
- **Org token** — sandbox organization registration completed in Merchant Portal so `apiProfile.organizations` returns a non-null list.

When all three close, a new plan.md lands for Waves 3–5 (inbound cutover → outbound cutover → reconciliation + go-live → Stitch deprecation).

**Effort scale:** S = ~half a day, M = ~1–2 days, L = 3+ days. Wave 1 is S+M+S+M ≈ 2–3 days of parallel work; Wave 2 is S+S ≈ 1 day serial after Wave 1.

---

## 4. Dependency rationale

- **Wave 2.1 depends on Wave 1.4** because `TradeSafeTokenService` writes to `users.tradeSafeTokenId`, which doesn't exist until the migration lands.
- **Wave 2.2 depends on Wave 2.1** because the signup hook calls `tradeSafeTokenService.ensureToken` — the service must exist.
- **Wave 1 items are internally independent:** ADR (pure doc), webhook handler (new controller file), skill (new `.agents/skills/DevTradeSafe/` tree), migration (new Prisma file + schema addition). Different files, no shared edits.
- **Wave 3 (future session)** gates on external closures — no code coupling we can lift. The goal of Waves 1+2 is to make Wave 3 a narrow surgical change rather than a big-bang rewrite.

---

## 5. Risks & followups

### Risks to watch

- **Schema drift during migration** — the staging Supabase has seen drift before (batch 13A correction, 2026-04-17). Migration must be idempotent; CI must verify fresh-DB apply. **Mitigation:** follow the `IF NOT EXISTS` / `DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN null` pattern from batch 13A.
- **Webhook re-fetch feedback loops** — if the callback handler re-fetches and triggers another callback, we have an infinite loop. **Mitigation:** callback fires on state change; we don't mutate state inside the handler, we only read it. Plus the `UNIQUE(provider, externalEventId)` constraint short-circuits replays.
- **Skill content accuracy** — scraped docs may drift vs the real API. **Mitigation:** skill references the docs.tradesafe.co.za URLs explicitly and notes the sandbox GraphQL endpoint as the source-of-truth for live verification.
- **GraphQL vs REST confusion** — existing `TradeSafeClient` (REST stub) and new `TradeSafeGraphQLClient` (live) co-exist. **Mitigation:** ADR 0011 documents which is which; Phase 3/4 (future) deletes the REST stub.

### Followups out of scope for this plan

- **Sandbox organization registration** — user completes in Merchant Portal; will enable full transaction-lifecycle smoke tests (Phase 2.x).
- **Commercial answers not yet firm:**
  - TradeSafe's own processing fee (separate from the 20%/15%/5% platform fees) — pass-through or already-included.
  - Exact AGENT-fee split: single agent with 40% total, or multi-allocation?
  - Webhook signature scheme confirmation — does TradeSafe sign bodies, or is URL-path-secret sufficient forever?
- **Admin dashboard surfacing** for TradeSafe transactions — mirror the existing Stitch admin panels after Phase 3.

---

## 6. Approval gate

**Does this plan look right, or should anything change?**

Specifically:
1. Is the **scope cut** (Phase 1c + 1d + Phase 2 foundation; defer Phases 3–5 until commercial blockers close) acceptable for "to complete plan"? Or do you want me to attempt Phases 3–5 in this session too, aware that they have unresolved commercial dependencies?
2. Should the `DevTradeSafe` skill be installed at `.agents/skills/DevTradeSafe/` (matching the `DevStitchPayments` convention), or somewhere else?
3. Anything missing from the acceptance criteria in §2?

Hold dispatch until answered.

---

## Session artifacts already shipped (context, not part of this plan)

- [8ca5c57](https://github.com/NicholasPaulCarl/social-bounty/commit/8ca5c57) — Subscription "coming soon" gate (Workstream A)
- [0687cb5](https://github.com/NicholasPaulCarl/social-bounty/commit/0687cb5) — Phase 1a: GraphQL client foundation + OAuth
- [fee3571](https://github.com/NicholasPaulCarl/social-bounty/commit/fee3571) — Phase 1b: Mutation helpers + live sandbox smoke
