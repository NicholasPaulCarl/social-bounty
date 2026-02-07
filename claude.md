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
