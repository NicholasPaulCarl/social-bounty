# Agent Team Overview

> How five specialised AI agents collaborate to build the Social Bounty MVP.

## Why Agents?

The Social Bounty MVP spans a full-stack monorepo — database schema, REST API, frontend SPA, test suite, and CI/CD pipeline. Rather than one agent context-switching across all of these, the work is divided into five roles that mirror a real engineering team. Each agent gets a focused reference doc so it can start working immediately without re-exploring the codebase.

---

## The Five Roles

| Role | One-liner | Reference Doc |
|---|---|---|
| **Architect** | Designs the data model, API contracts, and system-wide decisions | [`agent-architect.md`](./agent-architect.md) |
| **Backend** | Implements NestJS modules, services, auth/RBAC, and Prisma queries | [`agent-backend.md`](./agent-backend.md) |
| **Frontend** | Builds Next.js pages, PrimeReact components, routing, and state management | [`agent-frontend.md`](./agent-frontend.md) |
| **QA/Testing** | Writes unit/integration/E2E tests and enforces the 100% pass-rate rule | [`agent-qa-testing.md`](./agent-qa-testing.md) |
| **DevOps** | Manages the monorepo, Docker, CI/CD, environment config, and deployment | [`agent-devops.md`](./agent-devops.md) |

---

## What Each Agent Owns

### Architect

**Scope**: System design — the contracts everyone else builds against.

- `packages/prisma/schema.prisma` — all database models, enums, relations, indexes
- `packages/shared/` — TypeScript enums, DTOs, constants, common types
- API contract — endpoint inventory, request/response shapes, error format
- Architectural decisions — auth strategy, guard ordering, caching, audit pattern

### Backend

**Scope**: The NestJS API server.

- `apps/api/src/modules/` — auth, users, bounties, submissions, organisations, admin, business, audit, mail, health, files
- `apps/api/src/common/` — guards (JWT, UserStatus, Roles), decorators (@Public, @Roles, @CurrentUser, @Audited), pipes (Sanitize), filters (HttpException)
- `apps/api/src/main.ts` — bootstrap config (helmet, CORS, global pipes/filters)

### Frontend

**Scope**: The Next.js web application.

- `apps/web/src/app/` — all routes (auth, participant, business, admin)
- `apps/web/src/components/` — common UI (StatusBadge, PageHeader, LoadingState, etc.), layout (Sidebar, Header, MainLayout), feature components (BountyCard, BountyFilters, ReviewActionBar)
- `apps/web/src/lib/` — API client, auth context, token management, React Query hooks, utilities
- `apps/web/src/middleware.ts` — server-side route protection

### QA/Testing

**Scope**: Test infrastructure and test coverage.

- `apps/api/jest.config.ts` — Jest configuration and module mapping
- `apps/api/src/**/*.spec.ts` — unit tests for services and guards
- `apps/api/test/` — integration/E2E test config
- CI test jobs — ensuring all tests pass before merge

### DevOps

**Scope**: Infrastructure, tooling, and deployment.

- Root `package.json` — workspace scripts
- `docker-compose.yml` — PostgreSQL + MailHog
- `.github/workflows/ci.yml` — GitHub Actions pipeline
- `.env.example` files — environment variable templates
- TypeScript configs — root + per-workspace
- Build pipeline — dependency order, Prisma generation

---

## How They Work Together

### Dependency Flow

```
           Architect
          /         \
     Backend       Frontend
          \         /
          QA/Testing
              |
            DevOps (CI gates)
```

1. **Architect goes first** — defines the schema, enums, DTOs, and API contract. Everything downstream depends on these shared definitions.

2. **Backend and Frontend work in parallel** — both consume the Architect's output. Backend implements the API endpoints; Frontend builds the UI that calls them. The shared package (`@social-bounty/shared`) is the contract between them.

3. **QA follows implementation** — writes tests against what Backend and Frontend deliver. Unit tests for services/guards, integration tests for API endpoints, E2E tests for critical user flows.

4. **DevOps underpins everything** — provides the CI pipeline that runs lint, type-check, and all test suites. Gates PRs on passing tests. Manages the local dev environment so all agents can run the app.

### Handoff Points

| From | To | What's handed off |
|---|---|---|
| Architect | Backend | Prisma schema, shared DTOs, API contract, guard strategy |
| Architect | Frontend | Shared enums/DTOs, route structure, error format |
| Backend | Frontend | Working REST API endpoints (typed via shared DTOs) |
| Backend | QA | Testable services with clear mocking boundaries |
| Frontend | QA | UI flows for E2E smoke tests |
| DevOps | All | Scripts, Docker services, CI pipeline, env config |
| QA | All | Test results that gate PR merges (100% pass rate) |

---

## Shared Rules (All Agents)

These rules from `CLAUDE.md` apply to every agent:

1. **MVP only** — if it's not in the spec (`md-files/social-bounty-mvp.md`), don't build it
2. **RBAC mandatory** — every screen and API endpoint must enforce role-based access
3. **Audit logs required** — all admin actions and status changes must be logged
4. **100% test pass rate** — no release until all tests pass
5. **PrimeReact + Tailwind CSS** — mandatory for all UI
6. **Destructive actions need confirmation** — confirmation dialogs required
7. **Document assumptions** — don't invent requirements

---

## Shared Package as the Contract

The `packages/shared/` package is the single source of truth that keeps Backend and Frontend aligned:

- **Enums** — UserRole, BountyStatus, SubmissionStatus, etc. Both apps import the same enum values.
- **DTOs** — ~143 request/response types. Backend validates against them; Frontend types API calls with them.
- **Constants** — PAGINATION_DEFAULTS, FIELD_LIMITS, AUDIT_ACTIONS, etc. Used by both apps for consistent behavior.

**Critical rule**: Enums must be imported as values (`import { UserRole }`) not types (`import type { UserRole }`), because they're used at runtime for validation and comparison.

---

## Quick Start for Any Agent

1. Read `CLAUDE.md` for project rules and conventions
2. Read your role-specific doc (`md-files/agent-<role>.md`)
3. Read the product spec if needed (`md-files/social-bounty-mvp.md`)
4. Check the shared package (`packages/shared/src/`) for available types and constants
5. Start working in your owned files

No agent should need to re-explore the codebase from scratch — the reference docs contain all the patterns, file paths, and conventions needed to be productive immediately.
