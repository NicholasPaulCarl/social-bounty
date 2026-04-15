# Contributing to Social Bounty

This document covers the local guard-rails and checks every contributor
must run before pushing changes. It is not a style guide — see
`CLAUDE.md` for project conventions, `md-files/agent-overview.md` for
agent routing, and the ADRs in `docs/adr/` for design decisions.

## Pre-commit / Pre-push Checks

Run these from the repo root before opening a PR:

```bash
npm run lint                    # ESLint across all workspaces
npm test                        # Jest unit tests across all workspaces
npm run check:kill-switch-bypass  # Financial Kill Switch bypass guard
```

A green local run does not replace CI — CI is the source of truth —
but it catches the 80% of issues that would otherwise bounce back.

## Financial Kill Switch Bypass Guard

**Script:** `scripts/check-kill-switch-bypass.sh`
**npm alias:** `npm run check:kill-switch-bypass`
**Policy source:** `docs/adr/0006-compensating-entries-bypass-kill-switch.md`

The Financial Kill Switch (`SystemSetting.financial.kill_switch`) is the
platform's ledger-write circuit breaker. When on, `LedgerService`
rejects every write — **except** calls that pass
`allowDuringKillSwitch: true` in the `PostTransactionGroupInput`.

ADR 0006 authorises this flag in exactly **one** production file:

```
apps/api/src/modules/finance-admin/finance-admin.service.ts
```

That file holds the two Super Admin compensating-entry callers
(`postOverride` and `devSeedPayable`). Any third production caller
would silently widen the bypass and is a policy violation.

The guard greps the repo for `allowDuringKillSwitch: true`:

- Exits `0` when the flag appears only in the allowed file.
- Exits `1` and prints every offending line when it appears elsewhere.
- Test files (`*.spec.ts`, `*.test.ts`) are excluded by design — they
  exercise the bypass to assert ADR 0006 behaviour, they do not add
  new callers.
- The ADR itself, the `docs/reviews/**` audit notes, this file, and
  the script itself are excluded because they discuss the flag in
  prose rather than assign it.

### When to run it

- Before every commit that touches `apps/api/src/modules/ledger/**`,
  `apps/api/src/modules/finance-admin/**`, or any new payment /
  settlement / payout / clearance / refund / subscription handler.
- Before every PR that claims to be financial-code-clean.
- Automatically in CI (see `.github/workflows/ci.yml` — job TBA when the
  CI pipeline is next touched; until then the `npm run` alias is the
  contract).

### If the guard fails

**Do not edit the guard to silence it.** Instead:

1. Check whether your change genuinely needs a new bypass caller. In
   99% of cases the answer is no — the Kill Switch exists precisely
   so that settlement / payout / clearance / refund / subscription
   handlers block during incidents.
2. If a new caller truly is required, open a new ADR (following the
   ADR 0006 template) with Agent Team Lead approval, then — and only
   then — update the guard's allow-list.
3. For compensating entries in new code paths, route the write through
   `FinanceAdminService.postOverride` instead of setting the flag
   directly. That keeps the bypass funnel at one choke point.

### Optional: husky pre-commit hook

Husky is **not** currently installed in this repo. If a future change
adds husky, wire the guard in via:

```bash
npx husky add .husky/pre-commit "npm run check:kill-switch-bypass"
```

Until then, running the npm script manually (or in your editor's
save-hook) is the contract.

## Related Reading

- `CLAUDE.md` — Financial Non-Negotiables, Hard Rules
- `docs/adr/0006-compensating-entries-bypass-kill-switch.md` — the
  authoritative ADR the guard enforces
- `md-files/payment-gateway.md` — canonical Stitch Express spec
- `md-files/financial-architecture.md` — ledger mechanics
- `md-files/agent-qa-testing.md` — QA gate + smoke-test checklist
