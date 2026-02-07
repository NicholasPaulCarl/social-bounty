# Test Automation Strategy - Social Bounty MVP

> **Version**: 1.0
> **Date**: 2026-02-07

---

## 1. Test Framework Choices

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| **Backend Unit Tests** | Jest + ts-jest | Already configured in NestJS project. `@nestjs/testing` provides `Test.createTestingModule()` for dependency injection mocking. |
| **API Integration Tests** | Jest + Supertest | Supertest sends real HTTP requests to NestJS. PostgreSQL Docker service in CI provides a real database. |
| **E2E UI Smoke Tests** | Playwright | Cross-browser support, auto-waiting, good Next.js integration. Runs headless in CI with Chromium. |
| **Mocking** | Jest built-in mocks | `jest.fn()`, `jest.spyOn()`. PrismaService mocked at the method level for unit tests. |

---

## 2. Test File Organization

Tests are colocated with source files per project conventions:

```
apps/api/src/
  common/guards/
    roles.guard.ts
    roles.guard.spec.ts              # RolesGuard unit tests (8 tests)
    user-status.guard.ts
    user-status.guard.spec.ts        # UserStatusGuard unit tests (6 tests)
  modules/
    auth/
      auth.service.spec.ts           # AuthService unit tests (5 tests)
    bounties/
      bounties.service.spec.ts       # BountiesService unit tests (27 tests)
    submissions/
      submissions.service.spec.ts    # SubmissionsService unit tests (30 tests)
    admin/
      admin.service.spec.ts          # AdminService unit tests (25 tests)
apps/api/test/
  jest-e2e.json                      # Integration test config (future)
apps/web/
  e2e/                               # Playwright E2E tests (future)
```

---

## 3. Test Data Management

### Unit Tests
- **No database**: All Prisma calls are mocked with `jest.fn()`.
- **Fixture objects**: Each test file defines `const` fixtures (e.g., `baseBounty`, `mockParticipant`) at the top of the describe block.
- **Isolation**: `beforeEach` creates a fresh `TestingModule` with clean mocks.

### Integration Tests (CI)
- **Real PostgreSQL**: Docker service in GitHub Actions.
- **Migrations**: `prisma migrate deploy` before tests.
- **Seed data**: Standard seed script creates test fixtures per the test plan (admin, BA, participants, bounties, submissions).
- **Test isolation**: Each test suite resets to seed state before running.

### E2E Tests (CI)
- **Full stack**: API + Web running against test database.
- **Seed data**: Same seed script as integration tests.
- **Browser**: Headless Chromium via Playwright.

---

## 4. What Is Tested

### 4.1 Unit Test Coverage

| Service | Test Count | Coverage |
|---------|-----------|----------|
| AuthService | 5 | signup, login (valid/invalid/suspended), duplicate email |
| BountiesService | 27 | CRUD, all 5 valid status transitions, 3 invalid transitions, RBAC filtering, live edit restrictions, delete rules |
| SubmissionsService | 30 | create (7 scenarios), review (11 transitions), payout (7 transitions), update (4 scenarios), findById (5 RBAC checks) |
| AdminService | 25 | user suspend/reinstate, self-suspend prevention, SA-suspend prevention, org suspend+auto-pause, org reinstate, bounty/submission override, dashboard, audit logs, system health |
| RolesGuard | 8 | role matching, no roles required, no user, all role combinations |
| UserStatusGuard | 6 | public route bypass, active/suspended users, caching, no user fallback |
| **Total** | **101** | |

### 4.2 State Machine Coverage

**Bounty Status Transitions**:
- DRAFT -> LIVE (valid)
- LIVE -> PAUSED (valid)
- PAUSED -> LIVE (valid)
- LIVE -> CLOSED (valid)
- PAUSED -> CLOSED (valid)
- CLOSED -> LIVE (invalid, terminal)
- DRAFT -> PAUSED (invalid)
- DRAFT -> CLOSED (invalid)

**Submission Review Transitions**:
- SUBMITTED -> IN_REVIEW, APPROVED, REJECTED, NEEDS_MORE_INFO (valid)
- IN_REVIEW -> APPROVED, REJECTED (valid)
- NEEDS_MORE_INFO -> IN_REVIEW (valid)
- APPROVED -> IN_REVIEW (invalid, terminal for review flow)
- REJECTED -> APPROVED (invalid, terminal for review flow)

**Payout Status Transitions**:
- NOT_PAID -> PENDING, PAID (valid)
- PENDING -> PAID, NOT_PAID (valid, reversal)
- PAID -> NOT_PAID (invalid)

---

## 5. CI Pipeline Design

### Pipeline Stages

```
Push / PR
    |
    v
[1. Lint & Type Check] -------> Fail = block merge
    |
    v
[2. Unit Tests (Jest)] -------> Fail = block merge
    |                            Coverage report uploaded
    v
[3. Integration Tests] -------> Fail = block merge
    | (PostgreSQL Docker)        (API against real DB)
    v
[4. E2E Smoke Tests] ---------> Fail = block merge (PR only)
    | (Playwright + Chromium)
    v
[All Pass] ----> PR can be merged
```

### Configuration

- **Trigger**: Every push to `main`, every PR targeting `main`.
- **Concurrency**: One run per branch; new pushes cancel in-progress runs.
- **Node version**: 20 (LTS).
- **Database**: PostgreSQL 16 Alpine via Docker service.
- **Secrets**: JWT secrets and database credentials are set as environment variables in CI (not committed to repo).

### Pipeline File

`.github/workflows/ci.yml` implements:
1. `lint-and-typecheck` job: Installs deps, builds shared package, generates Prisma client, runs lint and type check.
2. `unit-tests` job: Runs Jest with coverage. Uploads coverage artifact.
3. `integration-tests` job: Starts PostgreSQL service, runs migrations, executes integration tests.
4. `e2e-tests` job: PR-only. Starts full stack, runs Playwright smoke tests.

---

## 6. Coverage Targets

| Layer | Target | Measured By |
|-------|--------|-------------|
| Unit tests | 80%+ line coverage on service files | Jest `--coverage` |
| API integration | Every endpoint has at least 1 happy path test | Test count per endpoint |
| E2E smoke | 10 critical user journeys | Playwright test count |
| Overall | 100% test pass rate | CI pipeline |

---

## 7. Running Tests Locally

```bash
# Unit tests (all)
npm test --workspace=apps/api

# Unit tests (specific file)
npx jest --config apps/api/jest.config.ts apps/api/src/modules/bounties/bounties.service.spec.ts

# Unit tests with coverage
npm run test:cov --workspace=apps/api

# Watch mode
npm run test:watch --workspace=apps/api
```

---

## 8. Current Status

| Item | Status |
|------|--------|
| Jest configuration | Done |
| AuthService unit tests | Done (5 tests) |
| BountiesService unit tests | Done (27 tests) |
| SubmissionsService unit tests | Done (30 tests) |
| AdminService unit tests | Done (25 tests) |
| RolesGuard unit tests | Done (8 tests) |
| UserStatusGuard unit tests | Done (6 tests) |
| CI pipeline (.github/workflows/ci.yml) | Done |
| API integration tests | Planned |
| E2E UI smoke tests (Playwright) | Planned |
| **Total passing tests** | **115** |
