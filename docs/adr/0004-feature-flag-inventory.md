# ADR 0004 — Feature Flag Inventory for Stitch Rollout

**Status:** Accepted
**Date:** 2026-04-15

## Context

Phased rollout (see `md-files/implementation-phases.md` and `.claude/plans/modular-skipping-teapot.md`) needs runtime toggles so each phase can ship independently, and so incidents can be contained without redeploying.

## Decision

Five flags. Phase 0–2: env-backed only. Phase 3: each flag is mirrored into a `SystemSetting` row that Super Admins can toggle from the Finance dashboard; every flip writes an `AuditLog` entry.

| Flag | Values | Gate | Default (dev) |
|---|---|---|---|
| `PAYMENTS_PROVIDER` | `none \| stitch_sandbox \| stitch_live` | Creation of new Stitch checkout sessions. `none` blocks all new payments. | `stitch_sandbox` |
| `PAYOUTS_ENABLED` | `true \| false` | Payout execution job will no-op when false. Also auto-false when Financial Kill Switch is active. | `false` until Phase 2 |
| `RECONCILIATION_ENABLED` | `true \| false` | The 15-min reconciliation scheduler. | `true` from Phase 1 |
| `DASHBOARD_FINANCE_UI` | `true \| false` | Mounts the nine `/admin/finance/*` routes. | `false` until Phase 3 |
| `KB_AUTO_STUB` | `true \| false` | Recurrence signature matcher auto-opens KB stubs. | `false` until Phase 4 |

## Validation

`apps/api/src/common/config/env.validation.ts` fails boot if `PAYMENTS_PROVIDER != 'none'` and any of `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`, `STITCH_API_BASE`, `STITCH_REDIRECT_URL` are missing.

## Consequences

- Rollback during an incident is a single env flip (or Super Admin toggle from Phase 3 onward).
- No business-logic branching on flags beyond gate points — handlers either run or don't; they don't have two modes.
- Production deploy order: schema migration → code → flag flip. Never flip the flag before the code that reads it is live.
