# `scripts/kb-context.ts`

> Phase 4 Claude-context CLI — prints the top-N relevant Knowledge Base entries for a file path, system, or signature.

## What it does

`scripts/kb-context.ts` is a TypeScript CLI that a Claude session runs before proposing any payment-related fix (per `claude.md` §11). It takes `--path <file>` / `--system <name>` / `--signature <hex>` and prints the top-N matching KB entries as markdown (or JSON with `--output json`) formatted for paste-into-prompt. Sources: (1) `md-files/knowledge-base.md` narrative entries — headers of the form `## [KB-YYYY-MM-DD-###] Title` with structured Type/Severity/System/Module fields; (2) the `recurring_issues` DB table — live runtime stubs written by `ReconciliationService` and webhook-failure paths via `KbService.recordRecurrence()`. Results are merged, deduplicated, and ranked; if the DB is unreachable, the CLI gracefully degrades to md-file-only output with a stderr warning.

## Why it exists

Phase 4 of `md-files/implementation-phases.md` delivered automation on top of the knowledge base so Claude's fix workflow (charter §7) has a concrete tool to run. Without this CLI, the "check knowledge-base.md for prior occurrences" step would be manual scrolling through a growing file. The dual-source merge (md-file + recurring_issues DB table) means both long-form narrative entries (authored by engineers after a postmortem) and runtime-signal entries (auto-flagged by the reconciler or webhook router) are surfaced with a single query. The `--output json` mode supports programmatic consumption by agents.

## How it connects

- **`md-files/knowledge-base.md`** — one of two data sources; parsed per the header convention.
- **`recurring_issues` DB table** — the runtime-signal source; written by `KbService.recordRecurrence()`.
- **`KbService`** — the backend service that maintains `recurring_issues`; `signature`, `category`, `system`, `errorCode` are the fields used for matching.
- **`bench-reconciliation.ts`** — sibling CLI under `scripts/`; same CLI-app pattern.
- **`claude.md` §11** — references this script as the mandatory pre-fix context-gathering tool for any financial fix.
- **`ReconciliationService.run()`** — a major writer into `recurring_issues` (via `KbService`); this CLI reads those rows.
- **`WebhookRouterService.dispatch`** — writes `recurring_issues` on webhook-handler failures.

---
**degree:** 17 • **community:** "KB context CLI" (ID 26) • **source:** `scripts/kb-context.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this script's usefulness depends on both data sources being populated. The narrative KB file grows slowly (one entry per postmortem), the `recurring_issues` table grows on every reconciliation detection — the merge is a feature because engineers can see the runtime signal that prompted a prior investigation alongside the postmortem that explains the fix.
