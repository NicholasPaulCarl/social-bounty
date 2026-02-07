# DevOps Agent Reference

> Project scaffolding, CI/CD, environment config, deployment

## Responsibilities

- Maintain the monorepo structure and build pipeline
- Configure CI/CD (GitHub Actions)
- Manage Docker Compose for local development
- Handle environment variables and config
- Database migration workflows
- Deployment planning and runbooks

---

## Monorepo Setup

### Workspace Layout

```
social-bounty/
  apps/
    api/              # NestJS backend
    web/              # Next.js frontend
  packages/
    shared/           # Shared types, DTOs, constants
    prisma/           # Prisma schema, migrations, seed
```

**Package manager**: npm workspaces (defined in root `package.json`)

### Root Scripts (`package.json`)

| Script | Command | Description |
|---|---|---|
| `dev:api` | `npm run dev --workspace=apps/api` | Start API dev server (port 3001) |
| `dev:web` | `npm run dev --workspace=apps/web` | Start web dev server (port 3000) |
| `build:shared` | `npm run build --workspace=packages/shared` | Build shared package |
| `build:api` | `npm run build --workspace=apps/api` | Build API |
| `build:web` | `npm run build --workspace=apps/web` | Build web |
| `build:all` | `build:shared && build:api && build:web` | Build everything (order matters) |
| `test` | `npm run test --workspaces --if-present` | Run all tests |
| `lint` | `npm run lint --workspaces --if-present` | Lint all workspaces |
| `db:generate` | `npm run generate --workspace=packages/prisma` | Generate Prisma client |
| `db:migrate` | `npm run migrate:dev --workspace=packages/prisma` | Run dev migrations |
| `db:seed` | `npm run seed --workspace=packages/prisma` | Seed demo data |
| `db:studio` | `npm run studio --workspace=packages/prisma` | Open Prisma Studio |

### Build Order (critical)

`packages/shared` must build **before** `apps/api` and `apps/web` because both import from it.

```
1. packages/shared  (build:shared)
2. packages/prisma  (db:generate — generates @prisma/client)
3. apps/api         (build:api)
4. apps/web         (build:web)
```

---

## Docker Compose (`docker-compose.yml`)

### Services

**PostgreSQL**:
- Image: `postgres:16-alpine`
- Container: `social-bounty-db`
- Port: `5432:5432`
- Credentials: `postgres` / `postgres`
- Database: `social_bounty`
- Volume: `postgres_data` (persistent)
- Healthcheck: `pg_isready -U postgres`

**MailHog** (dev email catcher):
- Image: `mailhog/mailhog:latest`
- Container: `social-bounty-mail`
- SMTP port: `1025:1025` (API sends here)
- Web UI: `8025:8025` (view captured emails at http://localhost:8025)

### Commands

```bash
docker-compose up -d          # Start services in background
docker-compose down           # Stop services
docker-compose down -v        # Stop and remove volumes (reset data)
docker-compose logs postgres  # View postgres logs
```

---

## Environment Variables

### Complete List (`.env.example`)

| Variable | Default | Required | Description |
|---|---|---|---|
| **Database** | | | |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/social_bounty?schema=public` | Yes | PostgreSQL connection string |
| **Authentication** | | | |
| `JWT_SECRET` | — | Yes | Access token signing key (min 256 bits) |
| `JWT_REFRESH_SECRET` | — | Yes | Refresh token signing key (min 256 bits) |
| `JWT_ACCESS_EXPIRY` | `15m` | No | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | No | Refresh token lifetime |
| **Application** | | | |
| `NODE_ENV` | `development` | No | Environment identifier |
| `PORT` | `3001` | No | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | No | Allowed origins (comma-separated) |
| **File Uploads** | | | |
| `FILE_UPLOAD_MAX_SIZE` | `5242880` | No | Max upload size in bytes (5MB) |
| `FILE_UPLOAD_DEST` | `./uploads` | No | Upload directory path |
| `FILE_UPLOAD_MAX_FILES` | `5` | No | Max files per request |
| **Email** | | | |
| `SMTP_HOST` | `localhost` | No | SMTP server hostname |
| `SMTP_PORT` | `1025` | No | SMTP port |
| `SMTP_USER` | — | No | SMTP username |
| `SMTP_PASS` | — | No | SMTP password |
| `SMTP_FROM` | `noreply@socialbounty.com` | No | Sender email |
| **Monitoring** | | | |
| `SENTRY_DSN` | — | No | Sentry error tracking DSN |
| **Rate Limiting** | | | |
| `THROTTLE_TTL` | `60000` | No | Rate limit window in ms |
| `THROTTLE_LIMIT` | `100` | No | Max requests per window |
| **Frontend** | | | |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` | No | API base URL for frontend |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | No | Show demo login buttons |

### File Locations

- `/.env.example` — Template (committed)
- `/.env` — Active config (gitignored)
- `/apps/web/.env.example` — Frontend template (committed)
- `/apps/web/.env.local` — Frontend active config (gitignored)

### Configuration Loading

- **API**: `@nestjs/config` `ConfigModule.forRoot({ isGlobal: true })` — reads from `process.env` (loaded from root `.env`)
- **Web**: Next.js auto-loads `.env.local`. Only `NEXT_PUBLIC_*` vars are exposed to the browser.

---

## Database Management

### Prisma CLI Commands

Run from project root using workspace scripts, or from `packages/prisma/` directly:

| Task | Root command | Direct command |
|---|---|---|
| Generate client | `npm run db:generate` | `npx prisma generate` |
| Create migration | — | `npx prisma migrate dev --name <name>` |
| Apply migrations (dev) | `npm run db:migrate` | `npx prisma migrate dev` |
| Apply migrations (prod) | — | `npx prisma migrate deploy` |
| Reset database | — | `npx prisma migrate reset` |
| Push schema (no migration) | — | `npx prisma db push` |
| Seed data | `npm run db:seed` | `npx prisma db seed` |
| Open Studio | `npm run db:studio` | `npx prisma studio` |

### Schema Location
`packages/prisma/schema.prisma`

### Seed Script
`packages/prisma/seed.ts` — creates 3 demo users + demo organisation. Configured in `package.json` under `prisma.seed`.

### Migration Workflow

**Development**:
```bash
# Edit schema.prisma, then:
cd packages/prisma
npx prisma migrate dev --name describe_the_change
```

**Production/CI**:
```bash
npx prisma migrate deploy --schema=packages/prisma/schema.prisma
```

---

## CI/CD Pipeline (`.github/workflows/ci.yml`)

### Triggers

- **Push to main**: Runs lint + unit + integration tests
- **PR to main**: Runs all 4 jobs including E2E

### Node Version
`20` (set in workflow env)

### Job 1: Lint & Type Check

```yaml
Steps:
  - checkout
  - setup-node (v20, npm cache)
  - npm ci
  - npm run build:shared
  - npm run db:generate
  - npm run lint --workspace=apps/api
  - npm run lint --workspace=apps/web
  - npx tsc --noEmit --project apps/api/tsconfig.json
  - npx tsc --noEmit --project apps/web/tsconfig.json
```

### Job 2: Unit Tests (needs: lint-and-typecheck)

```yaml
Steps:
  - checkout + setup + install + build:shared + db:generate
  - npx jest --config apps/api/jest.config.ts --ci --coverage --forceExit
  - Upload coverage artifact (7 days retention)
Env:
  JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
```

### Job 3: Integration Tests (needs: unit-tests)

```yaml
Services:
  postgres: postgres:16-alpine (testuser/testpassword/social_bounty_test)
Steps:
  - setup + install + build:shared + db:generate
  - npx prisma migrate deploy --schema=packages/prisma/schema.prisma
  - npx jest --config apps/api/test/jest-e2e.json --ci --forceExit
Env:
  DATABASE_URL: postgresql://testuser:testpassword@localhost:5432/social_bounty_test
  + JWT secrets, CORS, NODE_ENV=test
```

### Job 4: E2E Tests (needs: integration-tests, PRs only)

```yaml
Services:
  postgres: postgres:16-alpine (social_bounty_e2e)
Steps:
  - setup + install + build:shared + db:generate
  - npx playwright install --with-deps chromium
  - prisma migrate deploy
  - npm run db:seed
  - npm run build:all
  - npx playwright test --project=chromium
  - Upload Playwright report artifact (7 days retention)
```

### Concurrency
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## TypeScript Configurations

### Root (`tsconfig.json`)
- `target`: ES2022
- `strict`: true (all strict flags enabled)
- `noUnusedLocals`: true, `noUnusedParameters`: true
- `noImplicitReturns`: true, `noFallthroughCasesInSwitch`: true

### API (`apps/api/tsconfig.json`)
- Extends root
- Adds `emitDecoratorMetadata: true`, `experimentalDecorators: true` (required by NestJS)
- `rootDir: ./src`, `outDir: ./dist`
- Relaxes `noUnusedLocals` and `noUnusedParameters` to false

### Web (`apps/web/tsconfig.json`)
- `target`: ES2022, `module`: esnext, `moduleResolution`: bundler
- `jsx`: preserve, `noEmit`: true
- Path aliases: `@/*` → `./src/*`, `@social-bounty/shared` → `../../packages/shared/src`
- `lib`: dom, dom.iterable, ES2022

### Shared (`packages/shared/tsconfig.json`)
- Extends root
- `outDir: ./dist`, `rootDir: ./src`

### Prisma (`packages/prisma/tsconfig.json`)
- Extends root
- `outDir: ./dist`, `rootDir: .`
- Includes all `.ts` files

---

## Git Conventions

### Commit Messages (Conventional Commits)
```
feat:   New feature
fix:    Bug fix
docs:   Documentation
test:   Tests
chore:  Maintenance, dependencies, CI
refactor: Code restructuring
```

### .gitignore (key exclusions)
```
node_modules/
dist/, build/, .next/, out/
.env, .env.local, .env.*.local
coverage/
uploads/
packages/prisma/generated/
.DS_Store
*.log
```

### Node.js Version
`>=18.0.0` (from `engines` in root `package.json`). CI uses Node 20.

---

## Local Development Setup

### From scratch:

```bash
# 1. Clone and install
git clone <repo>
cd social-bounty
npm install

# 2. Start infrastructure
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env: update DATABASE_URL if not using Docker defaults, set JWT secrets

# Create frontend env
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1' > apps/web/.env.local
echo 'NEXT_PUBLIC_DEMO_MODE=true' >> apps/web/.env.local

# 4. Build shared package + generate Prisma client
npm run build:shared
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Seed demo data
npm run db:seed

# 7. Start dev servers (in separate terminals)
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:3000

# 8. (Optional) View emails
open http://localhost:8025  # MailHog web UI

# 9. (Optional) Browse database
npm run db:studio  # http://localhost:5555
```

---

## Production Considerations

| Area | MVP (current) | Production |
|---|---|---|
| Refresh tokens | In-memory Map | Redis |
| Email | MailHog (dev) | Real SMTP provider (SES, SendGrid) |
| Error tracking | Console logs | Sentry (set `SENTRY_DSN`) |
| File storage | Local `./uploads` dir | S3 / cloud storage |
| Database | Docker PostgreSQL | Managed PostgreSQL (RDS, Cloud SQL) |
| Migrations | `migrate dev` | `migrate deploy` (no interactive prompts) |
| Rate limiting | In-memory throttler | Redis-backed throttler |
| CORS | Single origin | Multiple origins or reverse proxy |
| HTTPS | Not configured | Reverse proxy (nginx) or load balancer |
| Secrets | `.env` file | Secret manager (Vault, AWS SSM) |

### Health Check Endpoint
`GET /api/v1/health` — returns `{ status: 'ok', timestamp, uptime }`. Use for load balancer health checks.

### Deployment Build Steps
```bash
npm ci
npm run build:shared
npm run db:generate
npx prisma migrate deploy --schema=packages/prisma/schema.prisma
npm run build:api
npm run build:web
```

### API Start (production)
```bash
cd apps/api && node dist/main.js
```

### Web Start (production)
```bash
cd apps/web && npm start  # next start
```
