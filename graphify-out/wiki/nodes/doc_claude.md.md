# `claude.md` (project charter)

> The canonical source of Hard Rules, Financial Non-Negotiables, implementation status, and ADR index.

## What it does

`claude.md` is the repo-root project charter that opens every agent session. It enumerates the eight Hard Rules (MVP scope discipline, RBAC mandatory, AuditLog required, 100% test pass rate, PrimeReact + Tailwind, confirmation dialogs, document assumptions, parallel-agent workflow), the three user roles (Participant, Business Admin, Super Admin), the 10 Financial Non-Negotiables (double-entry, idempotency, transaction-group integrity, integer minor units, append-only ledger, AuditLog coupling, retry-safe handlers, platform custody, plan snapshot, independent global fee), the agent routing rules that point every task through `md-files/agents/agent-overview.md` → `agent-team-lead.md`, and — crucially — a running "Current Implementation Status" log that's now at ~56KB and is the single authoritative record of every significant land on main.

## Why it exists

This file is the control layer for Hard Rule #1 (MVP only, no feature creep) and Hard Rule #8 (route through Team Lead). Without it, each agent session would re-derive domain context from scratch; with it, a fresh session gets the full state of the platform (Phase 3 shipped, kill switch is a DB row not an env var, PAYOUTS_ENABLED=false is the outbound gate, ADR 0008 supersedes 0007, commit `f5353d2` fixed the proof-requirements integrity bug, etc.) in one read. The "Knowledge Base & Financial Integrity Framework" at the bottom encodes the workflow every Claude session must follow before proposing a financial fix — consult the KB first, check Non-Negotiables, route via Team Lead, log the outcome.

## How it connects

- **ADRs 0001–0010** — cited by number throughout; the charter is the index that points to `docs/adr/*`.
- **ADR 0008 (TradeSafe Payouts)** — the outbound-rail decision that supersedes ADR 0007; charter carries the policy status.
- **ADR 0006 (Compensating Entries Bypass the Kill Switch)** — cited in the kill-switch discussion; the only sanctioned path that ignores the kill switch.
- **ADR 0010 (Auto-Refund on PostVisibility)** — newest ADR, added 2026-04-18 alongside Phase 3A scheduler hardening.
- **Financial Non-Negotiables concept** — the 10-rule block defined here; every payment-touching node in the graph cites it.
- **Agent play-books** (agent-team-lead, agent-backend, agent-architect, etc.) — defined here; the routing rule for every agent session.
- **Social Bounty MVP concept** — the high-level product spec this charter governs; specific DTOs and state machines live in `md-files/social-bounty-mvp.md`.

The degree of 40 is the highest among non-code nodes; only `packages/shared/index.ts` (237), the `audit.log()` method (111), and a handful of controllers/update methods outrank it.

---
**degree:** 40 • **community:** "Project charter & ADRs" (ID 3) • **source:** `claude.md`
**last touched:** future-dated • **commits (90d):** 23 • **commits (total):** 23

> **Architectural note:** 23 commits in 90 days reflects how much of the platform's state the charter has absorbed. A side effect: the file is 56KB long and growing. The "Current Implementation Status" section could split into a dedicated `docs/status/CHANGELOG.md` once it crosses ~100KB, but preserving the single-read-onboarding property is the primary constraint.
