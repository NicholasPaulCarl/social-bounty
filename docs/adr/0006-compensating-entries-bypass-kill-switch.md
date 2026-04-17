# ADR 0006 — Compensating Entries Bypass the Financial Kill Switch

**Status:** Accepted
**Date:** 2026-04-15
**Supersedes:** —
**Related:** `claude.md` Financial Non-Negotiables, ADR 0005 (header-table idempotency), `md-files/payment-gateway.md`, `md-files/financial-architecture.md`, `md-files/admin-dashboard.md`

## Context

The Financial Kill Switch (`SystemSetting.financial.kill_switch`) is the platform's ledger-write circuit breaker. When active, `LedgerService.postTransactionGroup` throws `KillSwitchActiveError` before writing any entry
(`apps/api/src/modules/ledger/ledger.service.ts:113-116`):

```ts
if (!input.allowDuringKillSwitch) {
  const active = await this.isKillSwitchActive(existingTx);
  if (active) throw new KillSwitchActiveError();
}
```

The Kill Switch exists to stop further damage when the ledger's integrity is in doubt (reconciliation drift, webhook replay storms, duplicate postings, suspected double-spend, etc.). Its on-state must be absolute for normal flows — a half-enforced kill switch is worse than none.

But there is a paradox: if every write is blocked, there is **no way to post the compensating entries required to correct the imbalance that triggered the switch in the first place**. Claude's workflow (`claude.md` §7) and the financial-architecture spec both require compensating entries to be the only mechanism for correcting the append-only ledger (Non-Negotiable #5). Without a controlled bypass, a Super Admin must either:

1. Deactivate the Kill Switch, post a correction, re-activate it — creating a window in which ordinary writes resume and new damage can occur; or
2. Reach into the database by hand — breaking every other Non-Negotiable (audit log, balanced double-entry, idempotency, ledger integrity).

Neither is acceptable.

## Decision

`PostTransactionGroupInput.allowDuringKillSwitch: true` is the explicit, narrow opt-out used by Super Admin overrides to post compensating entries while the Kill Switch is active.

The flag is set in exactly two callers and nowhere else:

| Caller | File:Line | `actionType` | Purpose |
|---|---|---|---|
| `FinanceAdminService.postOverride` | `apps/api/src/modules/finance-admin/finance-admin.service.ts:300` | `compensating_entry` | Super Admin posts a balanced correction group to restore ledger integrity. |
| `FinanceAdminService.devSeedPayable` | `apps/api/src/modules/finance-admin/finance-admin.service.ts:253` | `compensating_entry` | Dev-only payout-pipeline seed; refuses to run when `PAYMENTS_PROVIDER=stitch_live` (`finance-admin.service.ts:231`). |

Both callers are on `@Controller('admin/finance')` with class-level `@Roles(SUPER_ADMIN)` (`finance-admin.controller.ts:77-78`). Both use `actionType=compensating_entry` exclusively — per ADR 0005, this `actionType` takes a one-shot operator-minted UUID as `referenceId`, so it can never collide with a forward economic event.

## Constraints (enforced, not aspirational)

1. **Role gate.** Only `SUPER_ADMIN` can invoke either caller. `postOverride` re-checks the role inside the service (`finance-admin.service.ts:290-292`) as a defence in depth behind the controller decorator.
2. **Typed confirmation word.** The override UI requires the operator to type the literal string `OVERRIDE` before the submit button enables (`apps/web/src/app/admin/finance/overrides/page.tsx:65` and :181-190). Hard Rule #6 compliance.
3. **Balanced double-entry.** `LedgerService.postTransactionGroup` validates `sum(debits) === sum(credits)` **before** the Kill Switch check (`ledger.service.ts:99-111`), so an unbalanced override is rejected with `LedgerImbalanceError` whether or not the switch is on.
4. **Required reason field.** `OverrideDto.reason` has `@MinLength(10) @MaxLength(2000)` (`finance-admin.controller.ts:62-65`), propagated to `AuditLog.reason`.
5. **Full audit trail.** `postTransactionGroup` writes `AuditLog` inside the same `$transaction` as the ledger entries (`ledger.service.ts:154-171`). Action=`FINANCIAL_OVERRIDE` (override path) or `DEV_SEED_PAYABLE` (seed path). No compensating entry can land without its audit row.
6. **Idempotency preserved.** Both callers mint fresh `referenceId`s (`override:<iso>:<actor-prefix>` and `devseed:<userId>:<ts>`), so `UNIQUE(referenceId, actionType)` on `LedgerTransactionGroup` still prevents duplicate posts on retry.
7. **Scoped to one action type.** The pattern `actionType='compensating_entry'` is the only `actionType` that ever sets `allowDuringKillSwitch: true`. No settlement, payout, clearance, refund, or subscription handler sets the flag — they all block on the Kill Switch as designed.

## Risk & mitigation

**Risk.** A malicious or mistaken Super Admin can post arbitrary balanced ledger entries while the rest of the platform is frozen — effectively re-writing positions during an incident window. Because the Kill Switch is on, there is no concurrent workload to catch an inconsistency at runtime.

**Mitigations.**

- **Audit log is atomic with the write.** Every override is forensically recoverable.
- **Post-hoc reconciliation review.** The Reconciliation Dashboard (`md-files/admin-dashboard.md`) flags all `compensating_entry` groups for review regardless of Kill Switch state; overrides cannot quietly pass unnoticed.
- **Balanced-by-construction.** An override cannot *unbalance* the ledger — the imbalance check runs first. The worst case is misallocation between accounts, which the reconciliation engine surfaces.
- **Typed-word + reason field** create friction against accidental posts.
- **Role scarcity.** SUPER_ADMIN count is small and monitored.

**Residual risk accepted.** We prefer recoverable operator risk (auditable, balanced, forensically reviewable) over the alternative of a brittle toggle-off/toggle-on dance during live incidents.

## Scope

This ADR authorises the bypass **only** for `actionType='compensating_entry'`. Any future proposal to set `allowDuringKillSwitch: true` for a different `actionType` requires a new ADR and Agent Team Lead approval. Code review must flag any third caller of `allowDuringKillSwitch: true` as a policy violation.

## Consequences

- `devSeedPayable` uses the same bypass because a dev smoke-test of the payout pipeline must work even if staging's Kill Switch is flipped; the `PAYMENTS_PROVIDER=stitch_live` guard (`finance-admin.service.ts:231`) keeps this mechanism out of production.
- CI / linting should enforce that `allowDuringKillSwitch: true` only ever appears inside the `finance-admin.service.ts` file (future enforcement task — not in scope for this ADR).
- The Reconciliation Dashboard's `compensating_entry` filter is the primary post-incident audit view; it must never be removed.
