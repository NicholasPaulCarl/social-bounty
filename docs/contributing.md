# Contributing to Social Bounty

This document covers the local guard-rails and checks every contributor
must run before pushing changes. It is not a style guide — see
`CLAUDE.md` for project conventions, `md-files/agents/agent-overview.md` for
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

## KB context for Claude

**Script:** `scripts/kb-context.ts`
**npm alias:** `npm run kb:context -- <flags>`
**Spec source:** `md-files/implementation-phases.md` Phase 4, `claude.md` §11

Before proposing any payment-related fix, paste the top-N most relevant
Knowledge Base entries into your Claude prompt (per `claude.md` §7 step 2).
This script surfaces them for a given file path, system name, or
root-cause signature. It merges two sources:

1. Narrative entries in `md-files/knowledge-base.md` (matched by the KB
   entry's `System`, `Module`, `Tags`, and `Files / Services Affected`
   list, with path nesting — `apps/api/src/modules/payouts/` matches a
   query for `apps/api/src/modules/payouts/payouts.service.ts`).
2. Live `recurring_issues` rows in the database (matched by
   `metadata.system`, `metadata.paths`, and exact signature).

### Usage

From the repo root:

```bash
# By file path (nested matching)
npx tsx scripts/kb-context.ts --path apps/api/src/modules/payouts/payouts.service.ts

# By system (payments | wallet | bounty | admin | auth | integration)
npx tsx scripts/kb-context.ts --system payments

# By recurrence signature (exact hex match against recurring_issues.signature)
npx tsx scripts/kb-context.ts --signature 1a2b3c4d5e6f7890

# Optional flags
npx tsx scripts/kb-context.ts --system payments --limit 5 --output json
```

Or via the npm alias (note the `--` before script flags):

```bash
npm run kb:context -- --path apps/api/src/modules/payouts/payouts.service.ts
```

### Output

Markdown by default — ready to paste directly into a Claude prompt.
Pass `--output json` for machine consumption. Each entry is rendered as:

- KB id (or `RI-<uuid>` for a live `recurring_issues` row)
- Title
- Category, system, severity
- Occurrence count and resolved / open status
- A one-paragraph "what to know before fixing" derived from the entry's
  `Root Cause` / `mitigation` field (falling back to the summary or
  title when those are missing).

Results are sorted by relevance (direct file-path or system hit first,
then signature matches), with open issues ranked above resolved ones
and ties broken by recurrence count then `lastSeenAt`.

### Fallbacks

- If `tsx` is not installed, `npx ts-node scripts/kb-context.ts ...`
  also works, or compile with `tsc` and run the emitted `.js` with
  plain `node`.
- If the DB is unreachable (no `DATABASE_URL`, container down, etc.)
  the script prints only `md-files/knowledge-base.md` matches and
  emits a warning — it never fails hard. That makes it safe to run
  from any dev machine, including CI-only checkouts.

### Tests

Unit tests for the relevance scorer live in `scripts/kb-context.spec.ts`
and run via:

```bash
npm run test:scripts
```

They cover path-nesting matches, system/signature exact matches, sort
order (open before resolved), and the `--limit` cap.

## Related Reading

- `CLAUDE.md` — Financial Non-Negotiables, Hard Rules
- `docs/adr/0006-compensating-entries-bypass-kill-switch.md` — the
  authoritative ADR the guard enforces
- `md-files/payment-gateway.md` — canonical Stitch Express spec
- `md-files/financial-architecture.md` — ledger mechanics
- `md-files/agents/agent-qa-testing.md` — QA gate + smoke-test checklist
