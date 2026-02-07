# Backend Agent Reference

> NestJS modules, controllers, services, Prisma queries, auth/RBAC

## Responsibilities

- Implement NestJS controllers, services, and modules in `apps/api/src/`
- Write Prisma queries and manage database interactions
- Enforce RBAC on every endpoint
- Write audit logs for all status changes and admin actions
- Validate input with class-validator DTOs
- Write unit tests colocated with source files

## Tech Stack

- **Framework**: NestJS 10 (`@nestjs/common`, `@nestjs/core`)
- **Database**: PostgreSQL 16 via Prisma 6 (`@prisma/client`)
- **Auth**: Passport JWT (`@nestjs/passport`, `passport-jwt`), bcrypt (cost 12)
- **Validation**: class-validator + class-transformer
- **Rate limiting**: `@nestjs/throttler`
- **Security**: helmet, CORS
- **Email**: nodemailer (MailHog in dev on port 1025)
- **Shared types**: `@social-bounty/shared` (enums, DTOs, constants)

## Project Structure

```
apps/api/src/
  main.ts                    # Bootstrap: helmet, CORS, global pipes/filters
  app.module.ts              # Root module, global guard registration
  common/
    decorators/
      public.decorator.ts    # @Public() — skip JWT check
      roles.decorator.ts     # @Roles(...roles) — RBAC
      current-user.decorator.ts  # @CurrentUser() — extract JWT user
      audited.decorator.ts   # @Audited(action, entityType) — metadata
    filters/
      http-exception.filter.ts  # Global error response format
    guards/
      jwt-auth.guard.ts      # JWT validation, @Public() check
      user-status.guard.ts   # Suspension check (60s TTL cache)
      roles.guard.ts         # Role-based access
    pipes/
      sanitize.pipe.ts       # Strip HTML from request bodies
  modules/
    auth/                    # Signup, login, logout, refresh, password reset, email verify
    users/                   # Profile, change password
    bounties/                # Bounty CRUD, status changes
    submissions/             # Create, update, review, payout, file upload
    organisations/           # Create, update, members
    admin/                   # User/org management, overrides, audit logs, settings, health
    business/                # Business dashboard
    audit/                   # AuditService (fire-and-forget logging)
    mail/                    # MailService (nodemailer)
    health/                  # GET /health
    prisma/                  # PrismaService (NestJS wrapper)
    files/                   # File serving
```

### Module Pattern

Each feature module follows:
```
module-name/
  dto/
    module-name.validators.ts   # class-validator DTOs
  module-name.controller.ts     # HTTP endpoints
  module-name.service.ts        # Business logic
  module-name.service.spec.ts   # Unit tests
  module-name.module.ts         # NestJS module
```

---

## Global Guard Chain

Registered in `app.module.ts` as `APP_GUARD` providers (order matters):

1. **JwtAuthGuard** — validates Bearer token. Skips routes with `@Public()` decorator.
2. **UserStatusGuard** — checks if user is SUSPENDED. Uses in-memory cache with 60s TTL.
3. **RolesGuard** — checks `@Roles()` decorator. No roles = any authenticated user.
4. **ThrottlerGuard** — rate limiting (configurable via `THROTTLE_TTL`/`THROTTLE_LIMIT` env).

### JwtAuthGuard Signature (critical gotcha)

When overriding `handleRequest`, the signature **must** match the base class exactly:

```typescript
handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser
```

---

## Decorators

### @Public()
```typescript
// Skips JwtAuthGuard — route is accessible without authentication
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

### @Roles(...roles)
```typescript
// Restricts to specific roles — checked by RolesGuard
@Roles(UserRole.SUPER_ADMIN)
@Get('admin/users')
async listUsers() { ... }

// Multiple roles
@Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
@Post('bounties')
async createBounty() { ... }
```

### @CurrentUser()
```typescript
// Injects JWT payload from request.user
@Get('me')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  return this.usersService.getProfile(user.sub);
}

// Extract specific field
@Get('me')
async getProfile(@CurrentUser('sub') userId: string) { ... }
```

### @Audited(action, entityType)
```typescript
// Marks endpoint for audit logging (metadata only — service must call AuditService)
@Audited(AUDIT_ACTIONS.BOUNTY_CREATE, ENTITY_TYPES.BOUNTY)
@Post('bounties')
async create() { ... }
```

---

## Pipes

### SanitizePipe (global)
- Applied before ValidationPipe in `main.ts`
- Only processes `body` type arguments
- Recursively strips HTML tags from all string values
- Removes `<script>` tags and their content
- Decodes HTML entities and re-strips

### ValidationPipe (global)
```typescript
new ValidationPipe({
  whitelist: true,              // Strip unknown properties
  forbidNonWhitelisted: true,   // Throw if unknown properties sent
  transform: true,              // Auto-transform types
  transformOptions: { enableImplicitConversion: true },
})
```

---

## HttpExceptionFilter

Standard error response format:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "validation", "message": "email must be an email" }
  ]
}
```

- Handles `HttpException` subclasses (BadRequest, NotFound, Forbidden, etc.)
- Unhandled exceptions → 500 with generic message (details logged to console)
- `details` array only present for validation errors

---

## Auth Flow

### JWT Strategy (`modules/auth/jwt.strategy.ts`)
- Extracts token from `Authorization: Bearer <token>` header
- Validates `type === 'access'` in payload
- Returns `AuthenticatedUser`: `{ sub, email, role, organisationId }`

### Token Management
- **Access token**: 15m expiry, signed with `JWT_SECRET`
- **Refresh token**: 7d expiry, signed with `JWT_REFRESH_SECRET`
- **Storage**: In-memory Map keyed by userId → Set of refresh token JTIs
- **Rotation**: New refresh token issued on each `/auth/refresh` call
- **Theft detection**: If a used refresh token is resubmitted, all tokens for that user are invalidated

### Password Hashing
```typescript
import * as bcrypt from 'bcrypt';
const BCRYPT_ROUNDS = 12;
const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const valid = await bcrypt.compare(password, user.passwordHash);
```

---

## Audit Logging

### Pattern (fire-and-forget)
```typescript
// In any service method:
this.auditService.log({
  actorId: user.sub,
  actorRole: user.role as UserRole,
  action: AUDIT_ACTIONS.BOUNTY_STATUS_CHANGE,
  entityType: ENTITY_TYPES.BOUNTY,
  entityId: bounty.id,
  beforeState: { status: bounty.status } as Record<string, unknown>,
  afterState: { status: newStatus } as Record<string, unknown>,
  reason: dto.reason,
  ipAddress: request.ip,
});
// No await — fire and forget
```

### AuditService Implementation
```typescript
async log(entry: AuditLogEntry): Promise<void> {
  this.prisma.auditLog.create({
    data: {
      ...entry,
      beforeState: (entry.beforeState as Prisma.InputJsonValue) ?? undefined,
      afterState: (entry.afterState as Prisma.InputJsonValue) ?? undefined,
    },
  }).catch((err) => console.error('Failed to write audit log:', err));
}
```

**Critical**: Cast `Record<string, unknown>` to `Prisma.InputJsonValue` for JSON fields — otherwise TypeScript errors.

---

## Service Patterns

### Role-Based Filtering
```typescript
async list(user: AuthenticatedUser, params: ListParams) {
  const where: Prisma.BountyWhereInput = { deletedAt: null };

  if (user.role === UserRole.PARTICIPANT) {
    where.status = BountyStatus.LIVE;
  } else if (user.role === UserRole.BUSINESS_ADMIN) {
    where.organisationId = user.organisationId;
  }
  // SUPER_ADMIN sees all
  ...
}
```

### Ownership Checks
```typescript
if (user.role === UserRole.BUSINESS_ADMIN && bounty.organisationId !== user.organisationId) {
  throw new ForbiddenException('Not authorized');
}
```

### Pagination
```typescript
const [items, total] = await Promise.all([
  this.prisma.bounty.findMany({
    where, skip: (page - 1) * limit, take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: { organisation: { select: { id: true, name: true } }, _count: { select: { submissions: true } } },
  }),
  this.prisma.bounty.count({ where }),
]);

return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
```

### Soft Delete
```typescript
// Only DRAFT bounties can be deleted
if (bounty.status !== BountyStatus.DRAFT) {
  throw new BadRequestException('Only draft bounties can be deleted');
}
await this.prisma.bounty.update({ where: { id }, data: { deletedAt: new Date() } });
```

---

## DTO Validation Examples

```typescript
// modules/auth/dto/auth.validators.ts
export class SignupDto {
  @IsEmail() @IsNotEmpty()
  email!: string;

  @IsString() @MinLength(PASSWORD_RULES.MIN_LENGTH)
  @Matches(/[A-Z]/, { message: 'Must contain uppercase' })
  @Matches(/[a-z]/, { message: 'Must contain lowercase' })
  @Matches(/[0-9]/, { message: 'Must contain number' })
  password!: string;

  @IsString() @IsNotEmpty() @MinLength(1)
  firstName!: string;

  @IsString() @IsNotEmpty() @MinLength(1)
  lastName!: string;
}

// modules/bounties/dto/bounties.validators.ts
export class CreateBountyDto {
  @IsString() @IsNotEmpty() @MaxLength(FIELD_LIMITS.BOUNTY_TITLE_MAX)
  title!: string;

  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsOptional() @IsNumber() @IsPositive()
  rewardValue?: number | null;

  @IsOptional() @IsDateString()
  startDate?: string | null;
  // ...
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| DATABASE_URL | (required) | PostgreSQL connection string |
| JWT_SECRET | (required) | Access token signing secret |
| JWT_REFRESH_SECRET | (required) | Refresh token signing secret |
| JWT_ACCESS_EXPIRY | 15m | Access token lifetime |
| JWT_REFRESH_EXPIRY | 7d | Refresh token lifetime |
| PORT | 3001 | API server port |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origins (comma-separated) |
| NODE_ENV | development | Environment |
| THROTTLE_TTL | 60000 | Rate limit window (ms) |
| THROTTLE_LIMIT | 100 | Max requests per window |
| FILE_UPLOAD_MAX_SIZE | 5242880 | Max upload size (bytes) |
| FILE_UPLOAD_DEST | ./uploads | Upload directory |
| SMTP_HOST | localhost | SMTP server |
| SMTP_PORT | 1025 | SMTP port |
| SENTRY_DSN | (empty) | Sentry error tracking |

---

## Bootstrap (`main.ts`)

```typescript
app.use(helmet());
app.enableCors({ origin, methods: ['GET','POST','PATCH','DELETE'], credentials: true });
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new SanitizePipe(), new ValidationPipe({ ... }));
app.useGlobalFilters(new HttpExceptionFilter());
await app.listen(process.env.PORT || 3001);
```

---

## Key Gotchas

1. **AuthGuard handleRequest signature** — must include the optional `status` param or TypeScript errors
2. **Prisma JSON fields** — cast `Record<string, unknown>` to `Prisma.InputJsonValue`
3. **Jest module mapping** — `rootDir: '.'` with `roots: ['<rootDir>/src']`; mapper: `'^@social-bounty/shared$': '<rootDir>/../../packages/shared/src/index'`
4. **API tsconfig** — extends root but adds `emitDecoratorMetadata` and `experimentalDecorators`
5. **Shared enum imports** — use value imports (`import { UserRole }`) not type imports in DTOs that use `@IsEnum()`
