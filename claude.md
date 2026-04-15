# Social Bounty MVP

## Project Overview

Social Bounty is a bounty-based marketplace platform where businesses create tasks with rewards, users complete them and submit proof, businesses review submissions, and super admins manage the platform. This is a production-bound MVP.

**Specification**: See `md-files/social-bounty-mvp.md` for the full product spec.

## Tech Stack

- **Front-end**: Next.js (React), PrimeReact, Tailwind CSS, TypeScript
- **Back-end**: Node.js (NestJS), PostgreSQL, Prisma ORM, REST API
- **Infrastructure**: Local / Staging / Production, Sentry for error tracking
- **Auth**: JWT or server-side sessions, email + password

## Hard Rules

1. **MVP only** - no feature creep. If it's not in the spec, don't build it.
2. **RBAC mandatory** on every screen and API endpoint.
3. **Audit logs required** for all admin actions and status changes.
4. **100% test pass rate** required before any release.
5. **PrimeReact + Tailwind CSS** must be used for all UI.
6. All destructive actions require confirmation dialogs.
7. Document assumptions; don't invent requirements.
8. **Use agents for every task and run them in paralell** /md-files/agent-overview.md

## User Roles

- **Participant**: Browse bounties, submit proof, track submissions
- **Business Admin**: Create/manage bounties, review submissions, manage payouts
- **Super Admin**: Full platform access, user/org management, audit logs, troubleshooting

## Data Model Entities

User, Organisation, OrganisationMember, Bounty, Submission, AuditLog, FileUpload

## Project Structure (Planned)

```
social-bounty/
  apps/
    web/          # Next.js front-end
    api/          # NestJS back-end
  packages/
    shared/       # Shared types, constants, utilities
    prisma/       # Prisma schema and migrations
  docs/           # Architecture docs, API contracts
```

## Conventions

- TypeScript strict mode everywhere
- Use Prisma for all database access
- REST API with consistent error response format
- Input validation at API boundary (class-validator / zod)
- All API routes protected by RBAC middleware
- Git conventional commits (feat:, fix:, docs:, test:, chore:)
- Tests colocated with source files (`*.spec.ts` / `*.test.ts`)

## Agent Team Roles

When working as an agent team, use these role guidelines:

- **Architect**: Database schema, API contracts, system design decisions
- **Frontend**: Next.js pages, PrimeReact components, routing, state management
- **Backend**: NestJS modules, controllers, services, Prisma queries, auth/RBAC
- **QA/Testing**: Test strategy, unit tests, integration tests, E2E smoke tests
- **DevOps**: Project scaffolding, CI/CD, environment config, deployment

## Key Delivery Outputs

A) MVP backlog (epics, stories, tasks)
B) UX sitemap and flows
C) UI screen inventory + component list
D) Database schema (Prisma)
E) API contract with examples
F) Front-end routing and state strategy
G) Security checklist
H) Test plan + automation strategy
I) Deployment plan + runbook

---

# Knowledge Base & Financial Integrity Framework

## 1. Purpose

This section extends the rules above with an operational framework for:
- Financial integrity protection
- Recurring-issue detection
- Claude decision support before any fix

This is not a changelog. It is a system-memory and control layer.

## 2. Core Principle

If an issue recurs, treat it as a structural flaw, not a bug. Every fix must aim to eliminate recurrence, not just the symptom.

## 3. Agent Routing (extends Hard Rule #8)

All development work routes through `md-files/agent-overview.md` → `md-files/agent-team-lead.md`.

Claude may:
- Analyse the task
- Propose a root cause and candidate fix
- Draft code or schema changes for review

Claude must not:
- Merge, deploy, or finalise implementation without Agent Team Lead assignment
- Bypass the agent workflow for "quick fixes" — especially financial ones

## 4. Financial Non-Negotiables

Payment provider: **Stitch Express** (see `md-files/payment-gateway.md` for the canonical payment spec). All fee rates, clearance rules, state machines, and webhook handling live there.

Every financial mutation must satisfy all of the following:

1. **Double-entry**: debits equal credits within the transaction.
2. **Idempotency**: enforced at the DB level via `UNIQUE(referenceId, actionType)`.
3. **Transaction group integrity**: all steps commit or roll back together (single DB transaction or saga with compensation).
4. **Integer minor units**: amounts stored as integers (cents), never floats.
5. **Append-only ledger**: no updates or deletes; corrections are compensating entries.
6. **AuditLog entry**: required for every mutation (ties to Hard Rule #3).
7. **Retry-safe**: handlers must tolerate timeouts, retries, and webhook replays.
8. **Platform custody**: all funds flow through platform-controlled custody. No direct brand-to-hunter payments.
9. **Plan snapshot**: tier (Free / Pro) is snapshotted onto each transaction at creation time. In-flight transactions are never re-priced on plan change.
10. **Global fee independence**: the 3.5% global platform fee is calculated independently of tier admin fee / commission, stored in its own ledger account (`global_fee_revenue`), and shown as a separate line in all UI and reports.

Violating any of these without written justification in the PR is a blocker.

## 5. Required Tests for Financial Code

Every function that writes to the ledger must have:
- Unit test: happy path
- Unit test: duplicate/retry call produces no second entry
- Integration test: partial failure rolls back the full transaction group
- Integration test: webhook replay is idempotent

No ledger-touching PR merges without these.

## 6. Known Failure Patterns (check first)

Before proposing a fix, Claude checks `md-files/knowledge-base.md` for prior occurrences of:
- Idempotency failures
- Race conditions on shared resources (wallets, claims)
- Retry duplication
- Webhook replay
- Missing input validation
- Config drift between environments

## 7. Claude's Workflow for Any Fix

1. Read `md-files/knowledge-base.md` for similar prior incidents.
2. If payment-related, read `md-files/payment-gateway.md` (canonical) and `md-files/financial-architecture.md` (mechanics) and verify the change against Section 4.
3. Identify root cause — not just the symptom. State it explicitly.
4. If the issue has occurred before, propose a structural fix, not a patch.
5. Route implementation via Agent Team Lead.
6. After resolution, log a KB entry (template: `md-files/knowledge-base.md#entry-template`).

## 8. Definitions

**Recurrence**: two or more occurrences of the same root cause within 90 days. A recurring issue requires a structural fix, not a patch.

**Severity**:
- **Critical**: financial loss possible, data corruption, or auth bypass.
- **High**: user-facing failure of a core flow (claim, submit, payout).
- **Medium**: degraded experience with a workaround.
- **Low**: cosmetic or rare edge case.

**Financial Impact**:
- **Critical**: incorrect money movement possible.
- **High**: reconciliation drift without user loss.
- **Medium**: reporting or display error only.
- **Low / None**: no ledger or balance effect.

## 9. Automatic KB Entry Triggers

A KB entry is mandatory whenever any of these occur:
- Duplicate transaction detected
- Ledger imbalance detected
- Reconciliation mismatch
- Same root cause seen twice (recurrence threshold hit)
- Any Critical or High financial-impact incident

## 10. Escalation

On detection of a Critical severity or Critical financial-impact issue, Claude must:
1. Stop proposing code changes.
2. Recommend invoking the Financial Kill Switch (pause payouts) if ledger integrity is in doubt.
3. Flag the issue to Agent Team Lead with severity, suspected root cause, and affected transaction groups.

## 11. Referenced Files

- `md-files/payment-gateway.md` — **canonical** Stitch Express spec: flows, fees, clearance, states, webhooks, refunds, reconciliation rules
- `md-files/financial-architecture.md` — ledger mechanics, idempotency patterns, reconciliation engine
- `md-files/knowledge-base.md` — KB schema, entry template, example entries
- `md-files/admin-dashboard.md` — Finance Reconciliation Dashboard, kill switch, KB insights
- `md-files/implementation-phases.md` — Phase 1–4 delivery plan (payments → reconciliation → dashboard → KB automation)
- Stitch Express API: https://express.stitch.money/api-docs
- Svix webhooks: https://docs.svix.com/receiving/introduction
