# Post-Batch-11 Orphan Sweep

**Date**: 2026-04-15
**Author**: Codebase Hygiene agent (read-only)
**Scope**: repo-wide post batches 1–11 (`5ee1d86`..`e19acf2`)
**HEAD**: working tree on `bounty` branch; no changes committed by this sweep.

This is an inventory of stale markers, uncommitted migrations, flag drift,
and TODO debt. Pure investigation — no files were edited. Findings are
ordered by urgency.

---

## Critical

### C1. Three uncommitted Prisma drafts have already drifted into `schema.prisma`

All three subfolders under `packages/prisma/drafts/` contain DDL that the
**schema.prisma file already assumes is applied**, yet no real migration
under `packages/prisma/migrations/` has been promoted. A fresh `prisma
migrate deploy` on a new DB would produce a schema that does not match
`schema.prisma`, and running code paths (KB auto-flag, subscription
ledger, TradeSafe webhook) would fail at runtime.

Evidence:
- `packages/prisma/schema.prisma:1454-1456` declares `ineffectiveFix`,
  `ineffectiveFlaggedAt`, `ineffectiveFlaggedBy` on `recurring_issues`.
  Grep of `packages/prisma/migrations/` for `ineffectiveFix` returns **zero**
  hits.
- `packages/prisma/schema.prisma:310-328` declares `subscription_revenue` on
  the `LedgerAccount` enum and `tierSnapshot` on `subscription_payments`
  (line 1192, 1220). Grep of `migrations/` for `subscription_revenue` or
  `tierSnapshot` returns **zero** hits.
- `packages/prisma/schema.prisma:341-345` declares `TRADESAFE` in the
  `WebhookProvider` enum. Grep of `migrations/` for `TRADESAFE` returns
  **zero** hits.

Per `packages/prisma/drafts/README.md`, promotion is intentional and gated
on Team Lead review. That review is now overdue:
- `ineffective_fix_flag/` — referenced by Phase 4 KB automation (live).
- `subscription_revenue_ledger/` — batch 4 marker in session notes.
- `tradesafe_webhook_provider/` — batch 10 scaffold; consumed by
  `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts:75`.

**Judgment**: all three drafts **must be promoted** before any deploy to a
clean DB; the schema already expects them. Discarding is not an option —
production code reads these columns/enum values.

### C2. `FINANCIAL_KILL_SWITCH` env var is declared, seeded, and dead

- Declared: `apps/api/src/common/config/env.validation.ts:72-73` as
  optional boolean string.
- Seeded: `.env.example:89` with `FINANCIAL_KILL_SWITCH=false`.
- Documented: `docs/STITCH-IMPLEMENTATION-STATUS.md:37,247` implies env
  drives behaviour.
- **Read by code**: nowhere in `apps/api/src/**`. The kill switch is
  actually driven by `systemSettings` row `financial.kill_switch.active`
  (see `apps/api/src/modules/finance-admin/finance-admin.service.ts:47`
  and `apps/api/src/modules/payments/stitch-payments.service.ts:83`).

Operator hazard: flipping the env var has no effect; a panicking operator
could believe they have disabled payments when they have not. Severity is
Critical because of the financial-integrity implication.

**Judgment**: **delete from `env.validation.ts` and `.env.example`**, or
wire it through to the DB row as a boot-time override. Also correct the
STITCH-IMPLEMENTATION-STATUS.md lines that imply env-based toggling.

---

## High

### H1. `STITCH_REDIRECT_URL` — declared required, never read

- `apps/api/src/common/config/env.validation.ts:54-56` marks it required
  when `PAYMENTS_PROVIDER !== none`.
- Grep of `apps/**` finds no callers.

If operators leave it unset, boot fails; if they set it, nothing consumes
the value. Likely stale from pre-Stitch-Express checkout wiring. Verify
the redirect URL is injected elsewhere (Stitch dashboard?) and, if so,
drop the requirement, or route it through `StitchClient` where it belongs.

### H2. Eight feature flags used but not declared in `env.validation.ts`

Used via `process.env` or `ConfigService` but never validated on boot:

| Flag | Read site |
|---|---|
| `PAYOUTS_ENABLED` | `payouts.scheduler.ts:16`, `clearance.scheduler.ts:17`, `expired-bounty.scheduler.ts:27` |
| `RECONCILIATION_ENABLED` | `reconciliation.scheduler.ts:17` |
| `EXPIRED_BOUNTY_RELEASE_ENABLED` | `expired-bounty.scheduler.ts:23` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `payments.service.ts:33,168` (ADR 0001 retirement scope) |
| `BENEFICIARY_ENC_KEY` | `beneficiary.service.ts:27` (falls back to `JWT_SECRET`) |
| `STITCH_SYSTEM_ACTOR_ID` | `subscription-lifecycle.scheduler.ts:123`, `.env.example:100` |
| `APIFY_API_TOKEN`, `APIFY_ACTOR_TIMEOUT_MS` | apify service |

Two of these (`PAYOUTS_ENABLED`, `BENEFICIARY_ENC_KEY`) directly gate
financial behaviour. Missing validation means a typo in staging goes
undetected until a bounty expires or a beneficiary is registered.

**Judgment**: add to `env.validation.ts` with appropriate `@IsOptional()
@IsBooleanString()` / `@IsString()` decorators. One-line adds.

### H3. `STRIPE_*` env vars still live in production code post-ADR-0001

`apps/api/src/modules/payments/payments.service.ts:33,168` still reads
both Stripe secrets. ADR 0001 (Stripe retirement) is dated but the code
path has not been deleted. `.env.example:72` still seeds a test webhook
secret. Given Stitch Express is live, this is an attack-surface and
confusion risk, not a functional bug.

**Judgment**: schedule a dedicated "ADR 0001 Stripe retirement" batch.
Do not touch in a routine cleanup — it is load-bearing until the
retirement is formally signed off.

---

## Low

### L1. TODO/FIXME/XXX markers — 5 total

Only 5 markers exist across all production + test source:

| File:line | Comment | Judgment |
|---|---|---|
| `apps/api/src/modules/finance-admin/finance-admin.controller.rbac.spec.ts:68` | doc comment describing the `TODO`-skip RBAC pattern | **stale — rewrite as "`pending-handler` skip"**; misleading because there is no TODO at any handler today |
| `apps/api/src/modules/finance-admin/finance-admin.controller.rbac.spec.ts:78` | `"[rbac-spec TODO] FinanceAdminController.${handlerName} not implemented yet"` | **keep** — emitted at runtime as a warning when a handler is absent; correctly flags future work |
| `apps/api/src/modules/finance-admin/finance-admin.controller.rbac.spec.ts:128` | `TODO(backend-8): handler name assumed to be groupDetail` | **defer** — tracked; trivial verify-and-close next sprint |
| `apps/web/src/lib/api/finance-admin.ts:48` | `TODO: replace with TransactionGroupDetail from '@social-bounty/shared'` | **fix now** — DTO already lives in `packages/shared/`; one-import change |
| `apps/web/src/app/(participant)/wallet/page.tsx:27` | `TODO: split pending vs clearing once projection exposes finer-grained` | **defer** — needs API change, tracked |

No `FIXME`, no `XXX`, no `HACK` markers anywhere. Total: 5 TODOs. 1 fix
now, 1 stale, 3 defer.

### L2. E2E / integration / RBAC spec files flagged as "no prod counterpart"

A mechanical partner-check flags 52 spec files with no matching `.ts` at
the expected path. Spot-check: all are deliberate cross-cutting tests
(`*.rbac.spec.ts`, `*.fault-injection.spec.ts`, `*-edge-cases.spec.ts`,
`*/__tests__/*.spec.ts`, `apps/web/e2e/*.spec.ts`). **Zero are true
orphans.** The Jest + Playwright naming conventions in this repo put
behaviour-spanning specs in `__tests__/` sibling folders or in
`apps/web/e2e/`. No action.

### L3. Agent `md-files/agent-*.md` — all referenced, none dead

Files: `agent-architect.md`, `agent-backend.md`, `agent-devops.md`,
`agent-frontend.md`, `agent-overview.md`, `agent-qa-testing.md`,
`agent-team-lead.md`, `agent-ui-designer.md`, `agent-ux-designer.md`.
All linked from `md-files/agent-overview.md` (the orchestration
entrypoint from `CLAUDE.md` rule 8). **Zero dead docs.**

---

## Informational

### I1. TRADESAFE MIGRATION (ADR 0008) markers: 8 + 1 (as expected)

Exact count matches batch 10A notes and ADR 0009 (lines 23, 143, 165):

**Production markers (8)**:
1. `apps/api/src/modules/payouts/beneficiary.service.ts:32`
2. `apps/api/src/modules/payouts/payouts.service.ts:59`
3. `apps/api/src/modules/payouts/payouts.service.ts:139`
4. `apps/api/src/modules/payouts/payouts.service.ts:268`
5. `apps/api/src/modules/payouts/payouts.service.ts:325`
6. `apps/api/src/modules/payouts/payouts.service.ts:374`
7. `apps/api/src/modules/stitch/stitch.client.ts:211`
8. `apps/api/src/modules/stitch/stitch.client.ts:264`

**Scaffold comment (1)**: `apps/api/src/modules/payouts/payout-provider.interface.ts:9`
— correctly notes all 8 callers remain pointed at Stitch until ADR 0010
lands.

All 8 production markers still describe **future** work (ADR 0010
provider-agnostic payout pipeline). None were closed by batch 10 — batch
10 scaffolded the adapter, interface, and webhook controller **around**
these call sites without rewriting them. Status: accurate, leave alone.

### I2. Prisma drafts layout is healthy

The `drafts/` ↔ `migrations/` split (introduced in batch 5 R19, see
`2026-04-15-team-lead-audit-batch-5.md`) continues to do its job: none of
the three drafts were accidentally deployed. The gap (C1 above) is a
promotion-workflow discipline issue, not a directory-convention failure.

---

## Next batch ticket list

Top 5 items by value-for-effort.

| # | Ticket | Effort | Why |
|---|---|---|---|
| 1 | **Promote all three `packages/prisma/drafts/` into timestamped migrations**. Prod code already depends on the schema they define. | S (1 session, one migration-file-per-draft + lock update + CI smoke) | C1 — closes a prod-DB drift risk that grows with every deploy. |
| 2 | **Delete `FINANCIAL_KILL_SWITCH` from `env.validation.ts` and `.env.example`**; fix `STITCH-IMPLEMENTATION-STATUS.md:37,247` to point at the DB-row switch. | XS (30 min) | C2 — prevents operators from thinking env-toggling disables payments. |
| 3 | **Add `PAYOUTS_ENABLED`, `RECONCILIATION_ENABLED`, `EXPIRED_BOUNTY_RELEASE_ENABLED`, `BENEFICIARY_ENC_KEY`, `STITCH_SYSTEM_ACTOR_ID` to `env.validation.ts`**. | XS (15 min) | H2 — typo protection on flags that gate financial flows. |
| 4 | **Swap `apps/web/src/lib/api/finance-admin.ts:48` to import `TransactionGroupDetail` from `@social-bounty/shared`**. | XS (5 min) | L1 — single import change; removes the only "fix now" TODO. |
| 5 | **Decide `STITCH_REDIRECT_URL`**: move the consumer into `StitchClient` or drop the env var. | S (half a session once decided) | H1 — declared-required-never-read is a bootstrap trap. |

---

## Report stats

- TODO/FIXME/XXX: **5** (1 fix-now, 1 stale, 3 defer). 0 FIXME, 0 XXX, 0 HACK.
- Prisma drafts: **3**, all with schema drift. 0 promoted, 0 discardable.
- Env flags read-but-undeclared: **~8**. Declared-but-unread: **2**
  (`FINANCIAL_KILL_SWITCH`, `STITCH_REDIRECT_URL`).
- TRADESAFE (ADR 0008) markers: **8 prod + 1 scaffold**. Matches session notes.
- Agent `.md` docs: **9**, all live.
- Spec files without a strict 1:1 prod partner: 52 mechanical hits, **0** true orphans.
