# QA/Testing Agent Reference

> Test strategy, unit tests, integration tests, E2E smoke tests

## Responsibilities

- Write and maintain unit tests for API services and guards
- Write integration tests for API endpoints
- Define E2E smoke tests for critical user flows
- Ensure 100% test pass rate before any release (hard rule)
- Maintain test infrastructure (Jest config, mocking utilities)

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
    admin/admin.service.spec.ts    # AdminService unit tests
    bounties/bounties.service.spec.ts    # BountiesService unit tests
    submissions/submissions.service.spec.ts  # SubmissionsService unit tests
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
  organisation: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  organisationMember: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
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
  prisma.bounty.findUnique.mockResolvedValue({ organisationId: 'other-org' });

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

### For each guard:

| Category | What to test |
|---|---|
| **@Public() bypass** | Guard skips check for public routes |
| **No user** | Unauthenticated requests handled correctly |
| **Role match** | Correct role passes, wrong role blocked |
| **Cache behavior** | UserStatusGuard uses cached values within TTL |

---

## CI Pipeline (`/.github/workflows/ci.yml`)

### Job Dependency Chain

```
lint-and-typecheck
  └── unit-tests
        └── integration-tests
              └── e2e-tests (PRs only)
```

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

## Key Gotchas

1. **Jest module mapper** — must map `@social-bounty/shared` to source, not dist
2. **rootDir vs roots** — `rootDir: '.'` with `roots: ['<rootDir>/src']` ensures correct path resolution
3. **Enum imports in tests** — use `import { UserRole }` (value import) from `@social-bounty/shared`
4. **Async exception testing** — use `await expect(...).rejects.toThrow(ExceptionType)`
5. **Fire-and-forget audit** — AuditService.log() doesn't await, so tests should verify it was called but not await it
