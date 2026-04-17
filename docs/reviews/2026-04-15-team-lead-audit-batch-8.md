# Team Lead Audit — Batch 8 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `3ba4c57 feat: batch 7`
**Prior audits:** `…-phases-0-3.md`, `…-batch-2.md`, `…-batch-3.md`, `…-batch-4.md`, `…-batch-5.md`, `…-batch-6.md`, `…-batch-7.md`
**Test state (reported):** 1070 tests, all green.

## 1. Verified at HEAD `3ba4c57`

- **1070 tests green.** +9 over batch 7, consistent with batch 7 scope (Husky hook config, R23 severity-gate pair, retry-backoff fault injection, Playwright drill-down, insights/[system] wiring).
- **Husky pre-commit hook live.** `.husky/pre-commit` exists and invokes the existing `check:kill-switch-bypass` guard. Config-only per the batch 7 gate; no `apps/api/src/**` or `apps/web/**` edits slipped in.
- **Insights drill-down wired.** `/admin/finance/insights/[system]/page.tsx` ships read-only, SUPER_ADMIN-gated, PrimeReact + Tailwind, server-side RBAC.
- **Refund-after-approval + after-payout specs in place** from batch 7 QA. Refund-after-approval **product code** gap (compensating ledger + Stitch refund call) is still the QA-flagged item — batch 8 backend closes it.
- **R23 closed.** Severity-gate guard in `recordRecurrence` before `flagIneffectiveFix`; `severity:'info'` no longer triggers Ineffective-Fix flags or AuditLog rows.

## 2. Gates held for batch 8

**agent-backend-8** — `requestAfterApproval` must:
1. Post a balanced compensating ledger group (debits = credits, integer minor units, append-only — Non-Negotiables #1, #4, #5) that reverses the original charge legs; **not** merely write a `Refund` row.
2. Call `stitchClient.createRefund` with an `idempotencyKey` bound to the compensating `transactionGroupId`; retry/replay must produce **zero** additional ledger rows and **zero** additional Stitch calls (Non-Negotiable #2, #7).
3. Transition the compensating group to `COMPLETED` only via the `refund.completed` Svix webhook path — initiate leaves the group in `PENDING_EXTERNAL`. Webhook replay is idempotent via `WebhookEvent.UNIQUE(provider, externalEventId)`.
4. `AuditLog` on initiate, approve, and webhook-completion (Hard Rule #3).
5. New **GET `/admin/finance/groups/:transactionGroupId`** is read-only, SUPER_ADMIN-only, returns group header + all legs + linked `AuditLog` + Stitch external refs. No mutation surface.

**agent-architect-8** — `docs/adr/0009-tradesafe-integration-skeleton.md`:
1. **Status: Proposed.** Not Accepted. This is a skeleton, not a commercial commitment — TradeSafe creds are not yet in hand.
2. References ADR 0008 (TradeSafe supersedes Peach for hunter payouts) explicitly. Does **not** re-open ADR 0003 / 0007 churn (R22).
3. Adapter contract, env-var block (`TRADESAFE_*`), routing/queue topology, schema additions, and clearance-window reshape are **drafts**. No migration lands this batch.
4. Keeps `PAYOUTS_ENABLED=false` assumption intact.

**agent-frontend-8** — `/admin/finance/groups/[id]`:
1. **Cross-tenant guard:** transaction groups span brands, so the page is **SUPER_ADMIN only**. A BUSINESS_ADMIN who somehow loads a group that does not belong to their org must get a 403, server-side. No client-redirect RBAC.
2. Recent-groups rows on overview and reserves rows become clickable **links**, not buttons — keyboard + screen-reader accessible. PrimeReact + Tailwind only (Hard Rule #5).
3. Read-only. No mutation controls on the page.
4. Empty-state + loading handled; no layout shift.

**agent-qa-8** — RBAC contract spec for `GET /admin/finance/groups/:transactionGroupId` follows the **5-assertion pattern** used in prior batches:
1. Metadata (method, path, controller binding, guard stack).
2. **401** unauthenticated.
3. **403** PARTICIPANT.
4. **403** BUSINESS_ADMIN (cross-tenant — even for a group inside their org; SUPER_ADMIN-only endpoint).
5. **200** SUPER_ADMIN with payload shape.
Playwright drill-down smoke asserts overview → group detail → back navigation on seeded data, SUPER_ADMIN only. Mocked StitchClient; no product edits to make the spec pass (R24).

## 3. Risk register (delta from batch 7)

| # | Risk | Status | Note |
|---|---|---|---|
| R18 | TradeSafe provider vacuum | Open — policy | ADR 0009 **Proposed** this batch. Closes only when integration ships. |
| R22 | ADR churn | **Close** if 0009 lands as Proposed and references 0008 cleanly. | Monitoring. |
| **R23** | Ineffective-Fix false positives | **Closed** (batch 7). | Severity-gate shipped. |
| — | Refund-after-approval compensating gap | **Closing this batch** via backend-8. Remove the Phase 2 flag after merge. | Was QA-flagged in batch 7. |

No new risks opened.

## 4. What's left after batch 8

ADR 0009 is a **plan**, not integration — Phase 2 outbound rail remains gated on commercial TradeSafe creds. Subscription live-upgrade via Stitch card-consent still blocked (Upgrade CTA still disabled). Phase 1/3/4 unchanged. No new high-severity debt.

## 5. Recommendation for batch 9

In priority order:
1. **Card-consent integration for subscription upgrade** — turns the existing Upgrade CTA live. Smallest surface, clearest finance win, fully inside Stitch (no new vendor).
2. **Reconciliation dashboard UX polish** — severity filter on the exceptions page, cosmetic only, no ledger touch. Low-risk pickup.
3. **Begin TradeSafe integration proper** — only if commercial creds are in hand. Otherwise defer; ADR 0009 alone is sufficient for this session.

Call the session done after batch 8 lands green unless (1) is scoped and creds for (3) materialise.
