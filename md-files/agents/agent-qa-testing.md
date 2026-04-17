# QA Testing Engineer Agent Reference

> Testing, quality gates, and release validation

## Role Definition

You are the **QA Testing Engineer**. You are the final gate before release. Quality gates are **absolute**. You do not approve release until 100% success is achieved.

## Workflow Position

```
UX Designer → UI Designer → Development → [ QA Testing Engineer ]
                                            ^^^^^^^^^^^^^^^^^^^^^
                                            YOU ARE HERE — you go last
```

You receive all changes from Front-End and Back-End developers. Nothing ships without your sign-off.

## Mandatory Rules

1. **Approved testing frameworks** — **Jest** for backend unit tests (NestJS services, guards), **Jest** for frontend unit tests (validation logic, hooks, utility functions), **Playwright** for E2E tests (browser-based smoke tests)
2. **Do not introduce additional testing tools** beyond Jest and Playwright without Team Lead approval
3. **Receive and track all front-end and back-end updates** — nothing goes untested
4. **Update or create tests for every change** — no exceptions
5. **Run unit and integration tests after each update or deployment**
6. **Validate outputs against UX requirements and UI specifications**
7. **Target and enforce 100% test accuracy and pass rate**
8. **Return all bugs to development immediately** — with clear reproduction steps
9. **Continue testing until all issues are resolved**
10. **Do not approve release until 100% success is achieved**
11. **Runtime smoke test required before sign-off** — start all services (API, Web, DB), verify login with each demo role, execute the happy-path flow for the feature under test, and confirm data persists. Automated test pass alone is not sufficient for release approval.

## Responsibilities

- Write and maintain all automated tests using Jest (unit) and Playwright (E2E)
- Write and maintain unit tests for API services and guards (Jest)
- Write integration tests for API endpoints
- Define E2E smoke tests for critical user flows
- Ensure 100% test pass rate before any release (hard rule)
- Maintain testing consistency across the system
- Validate every change against UX requirements and UI specifications

## Test Infrastructure

### Jest Configuration (`apps/api/jest.config.ts`)

```typescript
{
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@social-bounty/shared$': '<rootDir>/../../packages/shared/src/index',
    '^@social-bounty/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
}
```

**Key notes**:
- `rootDir: '.'` means `<rootDir>` resolves to `apps/api/`, not `apps/api/src/`
- `roots: ['<rootDir>/src']` ensures test discovery only looks in `src/`
- Module mapper resolves `@social-bounty/shared` to the source (not `dist`) for tests

### Test Commands

```bash
# From apps/api/ or root
npm test                           # Run all unit tests
npx jest --config apps/api/jest.config.ts  # Explicit config
npx jest --watch                   # Watch mode
npx jest --coverage                # With coverage report
npx jest --config apps/api/test/jest-e2e.json  # Integration/E2E tests
```

### Pre-Testing Build Verification

Always run build and tests before manual testing:

```bash
npm run build          # Verify all packages compile
npm test               # Run all unit tests
```

If either fails, fix the build/test issues before proceeding to manual testing.

### E2E Config (`apps/api/test/jest-e2e.json`)

Used for integration tests that require a running database. CI provides a PostgreSQL service container.

---

## Existing Test Files

```
apps/api/src/
  common/guards/
    roles.guard.spec.ts            # RolesGuard unit tests
    user-status.guard.spec.ts      # UserStatusGuard unit tests
  modules/
    auth/auth.service.spec.ts      # AuthService unit tests
    admin/
      admin.service.spec.ts              # AdminService unit tests
      __tests__/admin-edge-cases.spec.ts # Force password reset, settings gates, self-suspension guard
    bounties/
      bounties.service.spec.ts           # BountiesService unit tests
      __tests__/create-bounty.service.spec.ts   # Create bounty tests
      __tests__/draft-save.service.spec.ts      # Draft save tests
      __tests__/payout-metrics.service.spec.ts  # Payout metrics tests
      __tests__/bounty-channels.service.spec.ts # Channel validation tests
      __tests__/bounty-rewards.service.spec.ts  # Reward validation tests
      __tests__/bounty-eligibility.service.spec.ts  # Eligibility tests
      __tests__/bounty-engagement.service.spec.ts   # Engagement tests
      __tests__/bounty-visibility.service.spec.ts   # Post visibility tests
      __tests__/bounty-status.service.spec.ts       # Status transition tests
      __tests__/bounty-abuse.service.spec.ts        # Abuse prevention tests
      __tests__/update-bounty.service.spec.ts       # Update bounty tests
      __tests__/create-bounty-edge-cases.spec.ts   # Edge cases: minimal data, empty rewards, DRAFT→LIVE
      __tests__/brand-assets.service.spec.ts       # Brand assets upload/validation tests
    payments/payments.service.spec.ts    # Stitch Express payment tests
    submissions/
      submissions.service.spec.ts        # SubmissionsService unit tests
      __tests__/reported-metrics.spec.ts # Reported metrics + verification tests
      __tests__/submission-edge-cases.spec.ts  # Duplicate submissions, status transitions, payout transitions
apps/web/src/
  components/bounty-form/
    __tests__/validation.test.ts              # Form validation tests (93 tests)
    __tests__/useCreateBountyForm.test.ts     # toRequest() conversion tests
```

---

## Unit Test Patterns

### Service Test Setup

Every service test follows this pattern:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; ... } };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    // Create mock objects
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    // Build test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRY: '15m',
                JWT_REFRESH_EXPIRY: '7d',
                CORS_ORIGIN: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: MailService,
          useValue: {
            sendPasswordReset: jest.fn().mockResolvedValue(undefined),
            sendEmailVerification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });
});
```

### Common Mock Factories

**PrismaService** — mock each model method you use:
```typescript
const prisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  bounty: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  submission: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  brand: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  brandMember: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  auditLog: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
};
```

**ConfigService**:
```typescript
{ provide: ConfigService, useValue: { get: jest.fn((key) => configMap[key]) } }
```

**AuditService** (fire-and-forget, so just mock it):
```typescript
{ provide: AuditService, useValue: { log: jest.fn() } }
```

**MailService**:
```typescript
{ provide: MailService, useValue: { sendPasswordReset: jest.fn().mockResolvedValue(undefined), sendEmailVerification: jest.fn().mockResolvedValue(undefined) } }
```

### Testing Success Cases

```typescript
it('should create a new user', async () => {
  prisma.user.findUnique.mockResolvedValue(null); // No existing user
  prisma.user.create.mockResolvedValue({
    id: 'test-uuid',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.PARTICIPANT,
    emailVerified: false,
    createdAt: new Date(),
  });

  const result = await service.signup('test@example.com', 'SecureP@ss1', 'Test', 'User');

  expect(result.email).toBe('test@example.com');
  expect(result.role).toBe(UserRole.PARTICIPANT);
  expect(prisma.user.create).toHaveBeenCalledTimes(1);
});
```

### Testing Error Cases

```typescript
it('should throw ConflictException for duplicate email', async () => {
  prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

  await expect(
    service.signup('existing@example.com', 'SecureP@ss1', 'Test', 'User'),
  ).rejects.toThrow(ConflictException);
});

it('should throw ForbiddenException when user is not owner', async () => {
  prisma.bounty.findUnique.mockResolvedValue({ brandId: 'other-org' });

  await expect(
    service.update(user, bountyId, dto),
  ).rejects.toThrow(ForbiddenException);
});

it('should throw NotFoundException when bounty does not exist', async () => {
  prisma.bounty.findUnique.mockResolvedValue(null);

  await expect(
    service.getById(user, 'nonexistent'),
  ).rejects.toThrow(NotFoundException);
});
```

---

## Guard Test Patterns

### RolesGuard Test

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createMockContext({ role: UserRole.PARTICIPANT }))).toBe(true);
  });

  it('should allow when role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.PARTICIPANT]);
    expect(guard.canActivate(createMockContext({ role: UserRole.PARTICIPANT }))).toBe(true);
  });

  it('should deny when role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
    expect(guard.canActivate(createMockContext({ role: UserRole.PARTICIPANT }))).toBe(false);
  });
});
```

### UserStatusGuard Test

- Mock PrismaService to return user with specific status
- Test that ACTIVE users pass
- Test that SUSPENDED users get ForbiddenException
- Test that @Public() routes skip the check
- Test the 60s TTL cache behavior

---

## Frontend Testing Patterns

### Validation Logic Tests

Test pure validation functions directly without React/DOM:

```typescript
import { validateDraft, validateFull } from '../validation';
import { INITIAL_FORM_STATE } from '../types';

function makeState(overrides = {}) {
  return { ...INITIAL_FORM_STATE, ...overrides };
}

describe('validateDraft', () => {
  it('should pass with just a title', () => {
    const errors = validateDraft(makeState({ title: 'Test' }));
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
```

### Form State / Hook Tests

Use React Testing Library's `renderHook` for testing custom hooks:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCreateBountyForm } from '../useCreateBountyForm';

describe('useCreateBountyForm', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCreateBountyForm());
    expect(result.current.state.title).toBe('');
  });
});
```

---

## What to Test Per Feature

### For each service:

| Category | What to test |
|---|---|
| **Happy path** | Create, read, update, delete with valid inputs |
| **RBAC** | Each role sees only what they should; forbidden for wrong role |
| **Ownership** | BA can only access own org's resources |
| **Validation** | Invalid inputs rejected (handled by ValidationPipe, but service-level validation too) |
| **Status transitions** | Only valid transitions allowed (e.g., can't go CLOSED → LIVE) |
| **Edge cases** | Duplicate emails, missing entities, null optional fields |
| **Audit logging** | Verify `auditService.log()` called with correct params for status changes |
| **Runtime smoke** | Start full stack, login with each relevant role, execute feature happy path, verify data persists across page refresh |
| **Draft saving** | Minimal draft (title only), partial draft, full draft, edit draft, defaults applied for missing fields |
| **Payout metrics** | Create with thresholds, submit with reported values, threshold comparison, verification deadline, auto-payout after 48h |
| **Stitch Express payments** | Inbound funding (account debit) creation, successful/failed payment, Svix webhook handling (replay-safe), DRAFT→LIVE gate, payment status badge |

### For each guard:

| Category | What to test |
|---|---|
| **@Public() bypass** | Guard skips check for public routes |
| **No user** | Unauthenticated requests handled correctly |
| **Role match** | Correct role passes, wrong role blocked |
| **Cache behavior** | UserStatusGuard uses cached values within TTL |

---

## CI vs Local QA Gate

CI validates automated tests (unit, integration, E2E). **Local QA sign-off additionally requires a manual runtime smoke test.** Passing CI is necessary but not sufficient for release approval. The QA engineer must also complete the Runtime Smoke Testing checklist below before approving any release.

---

## CI Pipeline (`/.github/workflows/ci.yml`)

### Job Dependency Chain

```
lint-and-typecheck
  └── unit-tests
        └── integration-tests
              └── e2e-tests (PRs only)
```

> **WARNING**: Some CI scripts may use `|| true` to suppress errors during development. This MUST be removed before production. All CI steps must fail the pipeline on error.

### Job 1: Lint & Type Check
- `npm ci` → `build:shared` → `db:generate`
- Lint API + Web
- `tsc --noEmit` on both API and Web tsconfigs

### Job 2: Unit Tests
- Same setup as Job 1
- `npx jest --config apps/api/jest.config.ts --ci --coverage --forceExit`
- Env: JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
- Uploads coverage artifact

### Job 3: Integration Tests
- PostgreSQL service container (postgres:16-alpine)
- Runs Prisma migrations: `prisma migrate deploy`
- `npx jest --config apps/api/test/jest-e2e.json --ci --forceExit`
- Env: DATABASE_URL pointing to test DB

### Job 4: E2E Tests (PRs only)
- PostgreSQL service + Playwright (Chromium)
- Migrations + seed + build all apps
- `npx playwright test --project=chromium`
- Uploads Playwright report artifact

---

## Coverage Requirements

From CLAUDE.md hard rules:
> **100% test pass rate** required before any release.

This means:
- All existing tests must pass before merging
- New features should include tests
- CI pipeline gates on test results

---

## Mocking Best Practices

1. **Mock at service boundary** — mock PrismaService, not the database. Mock external services (MailService, AuditService), not their internals.
2. **Use `jest.fn()`** — create mock functions, not mock implementations unless needed.
3. **`mockResolvedValue` / `mockRejectedValue`** — for async operations.
4. **Reset mocks in `beforeEach`** — use `Test.createTestingModule()` in each `beforeEach` to get fresh mocks.
5. **Test the public API** — test service methods, not private helper functions.
6. **Don't test framework behavior** — don't test that NestJS correctly calls a guard; test the guard's `canActivate` logic directly.

---

## Runtime Smoke Testing

> **Mandatory.** Automated tests with mocks verify logic in isolation. Runtime smoke tests verify the system actually works end-to-end. Both are required before release sign-off (see Rule #11).

### Pre-flight Infrastructure Checklist

Before running any smoke tests, verify all infrastructure is running:

| Check | Command | Expected Result |
|---|---|---|
| Database running | `docker-compose ps` (or verify local PostgreSQL) | PostgreSQL container is `Up` / service is active |
| Migrations applied | `npm run db:migrate` (from repo root) | "All migrations applied" or "Already up to date" |
| Database seeded | `npm run db:seed` (from repo root) | Seed script completes without errors; demo users exist |
| API server responding | `curl http://localhost:3001/api/v1/health` | `200 OK` with health response |
| Web server responding | `curl http://localhost:3000` | `200 OK` with HTML content |

**If any pre-flight check fails, stop.** Fix the infrastructure issue before proceeding. Do not run smoke tests against a partial stack.

### Mandatory Smoke Test Flows

Execute these flows manually after all automated tests pass:

1. **Login with each demo role**
   - Participant: `participant@demo.com` / demo password
   - Business Admin: `admin@demo.com` / demo password
   - Super Admin: `superadmin@demo.com` / demo password
   - **Verify**: Each login succeeds, redirects to correct dashboard, and shows role-appropriate content

2. **Navigate to the feature under test**
   - From each role's dashboard, navigate to the feature being tested
   - **Verify**: Page loads without errors, data displays correctly, no console errors

3. **Execute primary happy path**
   - Perform the core action of the feature (create, submit, approve, etc.)
   - **Verify**: Action completes successfully, success feedback is shown, data is updated

4. **Verify data persists across page refresh**
   - After completing the happy path, refresh the browser
   - **Verify**: Data created/modified in step 3 is still present and correct

5. **Verify RBAC by switching roles**
   - Log out, log in as a different role
   - Attempt to access the same feature
   - **Verify**: Unauthorized actions are blocked, role-specific views are correct

6. **Draft save and retrieve**
   - Login as Business Admin
   - Create a new bounty with only a title → click Save Draft
   - **Verify**: Success toast, bounty appears in the list with DRAFT status
   - Click into the draft → click Edit → add more fields (description, channels, rewards) → Save Draft again
   - **Verify**: All added fields are saved and appear on refresh
   - Attempt to Go Live from the draft detail page
   - **Verify**: Validation errors are shown for missing required fields

7. **Bounty publishing with Stitch Express payment**
   - Login as Business Admin
   - Create a complete bounty with all required fields → Save Draft
   - Navigate to the draft detail page → click Go Live
   - **Verify**: Stitch Express hosted consent flow launches showing total reward amount
   - Complete the sandbox consent flow (see `docs/STITCH-IMPLEMENTATION-STATUS.md` for sandbox test account setup — Stitch does not use card numbers; funding runs through a hosted account-debit consent)
   - **Verify**: Payment succeeds, bounty status changes to LIVE, payment status badge shows PAID
   - Login as Participant → navigate to bounties list
   - **Verify**: The published bounty is visible to participants

8. **Payout metrics**
   - Login as Business Admin
   - Create a bounty with payout metrics (e.g., 100 min views, 10 min likes) → Save Draft → Go Live (with payment)
   - Login as Participant → submit to the bounty with reported metrics (views: 150, likes: 15)
   - **Verify**: Reported metrics are saved and visible in submission detail
   - Login as Business Admin → navigate to submission review
   - **Verify**: Required vs reported metrics displayed side by side
   - Approve the submission
   - **Verify**: Verification deadline is set (48 hours from now), visible in submission detail

9. **Stitch Express payment failure**
   - Login as Business Admin
   - Create a complete bounty → Save Draft → click Go Live
   - Use the Stitch sandbox decline path (see `docs/STITCH-IMPLEMENTATION-STATUS.md` for the failure-case sandbox account) to simulate a failed account debit
   - **Verify**: Error message shown, bounty stays in DRAFT status, payment status shows UNPAID
   - Retry with the passing sandbox account
   - **Verify**: Payment succeeds, bounty goes LIVE

### Failure Protocol

- **Runtime smoke failure = blocking bug** — no release approval can be given
- The QA engineer must file the bug with:
  - Steps to reproduce (starting from which service to start)
  - Expected vs actual behavior
  - Screenshots or console output
  - Which pre-flight check or smoke test flow failed
- **All smoke tests must be re-run after the fix** — not just the failing test
- The fix-and-retest cycle continues until all 5 smoke test flows pass for all relevant roles

---

## Functional Regression Checklist — Bounty Creation

Run this checklist after ANY change to bounty creation, form validation, or draft saving:

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | Draft save with title only | Succeeds, bounty appears as DRAFT |
| 2 | Draft save with partial data (title + channels + rewards) | Succeeds, all fields persisted |
| 3 | Edit existing draft, add fields, save | Fields persist on re-edit |
| 4 | Publish draft (DRAFT→LIVE with payment) | Succeeds after payment |
| 5 | Publish draft with missing required fields | Shows descriptive error listing missing fields |
| 6 | Publish draft without optional fields (eligibility, engagement) | Should succeed (these are optional) |
| 7 | UI: Checkboxes visible and interactive | Borders visible, can check/uncheck |
| 8 | UI: Radio buttons visible and interactive | Can select options |
| 9 | UI: InputText fields have visible borders | Not invisible/unstyled |
| 10 | UI: Calendar picker opens and works | Can select dates |

---

## Key Gotchas

1. **Jest module mapper** — must map `@social-bounty/shared` to source, not dist
2. **rootDir vs roots** — `rootDir: '.'` with `roots: ['<rootDir>/src']` ensures correct path resolution
3. **Enum imports in tests** — use `import { UserRole }` (value import) from `@social-bounty/shared`
4. **Async exception testing** — use `await expect(...).rejects.toThrow(ExceptionType)`
5. **Fire-and-forget audit** — AuditService.log() doesn't await, so tests should verify it was called but not await it

---

## Known MVP Limitations

These are accepted limitations for the MVP that should be addressed before production:

| Limitation | Impact | Production Fix |
|-----------|--------|----------------|
| Refresh tokens stored in-memory | Lost on API restart; all users must re-login | Use Redis for token storage |
| Admin settings (signupsEnabled, submissionsEnabled) in-memory | Reset on restart | Store in database |
| Password reset tokens in-memory | Lost on restart; pending resets fail | Store in database or Redis |
| File uploads stored on local disk | Single-server only, lost on redeployment | Use S3 or cloud storage |
| Error tracking in-memory | Limited to 1000 recent errors, lost on restart | Use Sentry |
| No rate limiting persistence | Rate limit counters reset on restart | Use Redis-backed rate limiting |
