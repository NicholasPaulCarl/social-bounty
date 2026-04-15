# Team Lead Audit — Batch 9 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `529dc9a feat: batch 8`
**Prior audits:** `…-phases-0-3.md`, `…-batch-2.md` through `…-batch-8.md`
**Test state (reported):** 1083 tests, all green.

## 1. Verified at HEAD `529dc9a`

- **1083 tests green.** +13 over batch 8, consistent with batch 8 scope (compensating refund group, webhook completion path, group drill-down endpoint + RBAC spec, Playwright drill-down, ADR 0009).
- **After-approval reversal is balanced.** `refund-after-approval.spec.ts` asserts each compensating leg sum equals the original charge leg in integer minor units; `gateway_clearing` / `brand_reserve` / `admin_fee_revenue` / `global_fee_revenue` / `processing_expense` reversals net to zero across the group. Non-Negotiables #1, #4, #5 hold.
- **Group drill-down endpoint contract stable.** `GET /admin/finance/groups/:transactionGroupId` returns the shared DTOs `TransactionGroupDetail`, `TransactionGroupLegDetail`, `TransactionGroupAuditDetail`, `TransactionGroupExternalRefDetail` from `packages/shared`. SUPER_ADMIN-only; cross-tenant 403 enforced server-side. Read-only — no mutation surface.
- **Insights `/admin/finance/insights/[system]` drill-down wired.** KB Insights panel pivots through to per-system recurrence, confidence score, and top recurring-issue signatures. Read-only, SUPER_ADMIN-gated, PrimeReact + Tailwind.
- **ADR 0009 landed Proposed** (not Accepted). References ADR 0008. No migration. `PAYOUTS_ENABLED=false` unchanged.

## 2. Gates for batch 9

**agent-backend-9** — subscription cancel flow:
1. Cancel is **reversible while `cancelAtPeriodEnd=true`** and the current period has not elapsed. Undo path must clear the flag and post **no** ledger entries — there is no prepaid refund until the period actually ends.
2. `AuditLog` on cancel **must include the previous tier and previous subscription status** in the metadata blob, plus `cancelAtPeriodEnd` before/after. Hard Rule #3.
3. **No re-pricing of in-flight transactions.** Plan snapshot on each existing `LedgerTransactionGroup` is immutable (Non-Negotiable #9). Cancel never rewrites historical tier.
4. RBAC: BUSINESS_ADMIN for own org only. PARTICIPANT → 403. Cross-tenant BUSINESS_ADMIN → 403 server-side.
5. Integration test covers cancel → undo-before-period-end → cancel-again, asserts idempotency on repeated cancel (no duplicate AuditLog rows, no ledger writes).

**agent-architect-9** — `md-files/knowledge-base.md` seed:
1. Three entries matching the template at the top of the file **field-for-field** (id, title, severity, financial-impact, signature, root-cause, fix, references, recurrence-window).
2. Entries describe the real bugs from this session: Stitch payment-links response-shape mismatch, `merchantReference` special-char rejection, webhook event-type routing mismatch.
3. Each entry cites **real file paths and real line numbers**, plus the fix commit SHA — not invented refs. Pull from `git log`.
4. No template placeholders left in seeded rows.

**agent-frontend-9** — `/admin/finance/payouts` + exceptions severity filter:
1. Payouts page is **SUPER_ADMIN only**, lists all `StitchPayout` rows platform-wide. Server-side RBAC; no client-redirect.
2. Retry button respects the **PEACH→TRADESAFE markers** — Retry is a **no-op beyond writing an AuditLog** while `PAYOUTS_ENABLED=false`. Tooltip must state this explicitly ("TradeSafe outbound rail not yet live; action logged for traceability").
3. PrimeReact + Tailwind only. Empty state + loading handled. No layout shift.
4. Severity filter on `/admin/finance/exceptions` is cosmetic (query-string driven), does not touch the reconciliation engine, preserves existing sort order.

**agent-qa-9** — Playwright reconciliation spec:
1. Walks reconciliation run → exceptions page → severity filter → drill-in on one finding.
2. **Skips gracefully if the exceptions table is empty** (`test.skip()` with a clear reason, not a silent pass).
3. SUPER_ADMIN only. Mocked `StitchClient`. No product edits to make the spec pass (R24).

## 3. Risk register (delta from batch 8)

| # | Risk | Status | Note |
|---|---|---|---|
| R18 | TradeSafe provider vacuum | Open — policy | ADR 0009 Proposed. Closes only when integration ships. |
| R22 | ADR churn | Closed | ADR 0009 landed cleanly referencing 0008. |
| R23 | Ineffective-Fix false positives | Closed (batch 7) | — |
| — | Refund-after-approval compensating gap | Closed (batch 8) | Phase 2 flag removed. |

No new risks opened.

## 4. Phase 4 status

Phase 4 automation (RecurringIssue, signature matching, Ineffective-Fix flag, KB Insights panel, Confidence Score, `scripts/kb-context.ts`) is shipped. **Once architect-9 seeds the three KB entries, Phase 4 is truly exit-complete** — automation plus real content. Until then, the system is live but KB is empty.

## 5. Recommendation for batch 10

In priority order:
1. **Card-consent live upgrade (subscription)** — turns the Upgrade CTA live; smallest surface, fully inside Stitch, clearest finance win.
2. **TradeSafe sandbox probe** — only if commercial creds are in hand; paired with ADR 0009 moving to Accepted on first successful beneficiary create.
3. **Stop.** Call the session done after batch 9 lands green if neither (1) nor (2) is scoped.
