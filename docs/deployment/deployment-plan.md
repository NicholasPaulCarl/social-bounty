# Deployment Plan - Social Bounty MVP

## Overview

This document defines the deployment strategy for the Social Bounty MVP across local development, staging, and production environments.

---

## 1. Environments

### 1.1 Local Development

| Component | Technology | Access |
|-----------|-----------|--------|
| Database | PostgreSQL 16 via Docker Compose | localhost:5432 |
| Email | MailHog via Docker Compose | SMTP: localhost:1025, UI: localhost:8025 |
| API | NestJS dev server | localhost:3001 |
| Frontend | Next.js dev server | localhost:3000 |
| File Storage | Local filesystem (`./uploads`) | Relative path |

**Setup steps**:
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `docker-compose up -d` to start PostgreSQL and MailHog
4. Run `npm install` at the monorepo root
5. Run `npm run db:generate` to generate Prisma client
6. Run `npm run db:migrate` to apply migrations
7. Run `npm run db:seed` to seed the Super Admin account
8. Run `npm run dev:api` and `npm run dev:web` in separate terminals

### 1.2 Staging

| Component | Technology | Notes |
|-----------|-----------|-------|
| Database | Managed PostgreSQL (e.g., AWS RDS, Supabase) | Separate credentials per environment |
| Email | Transactional email service (e.g., SendGrid, Resend) | Sandbox/test mode |
| API | Containerised NestJS (Docker) | Behind a reverse proxy/load balancer |
| Frontend | Next.js (containerised or Vercel) | Connected to staging API |
| File Storage | Cloud storage (e.g., AWS S3) | Separate bucket from production |
| Error Tracking | Sentry (staging project) | Separate DSN from production |

### 1.3 Production

| Component | Technology | Notes |
|-----------|-----------|-------|
| Database | Managed PostgreSQL with automated backups | Daily backups, point-in-time recovery |
| Email | Transactional email service | Production mode with domain verification |
| API | Containerised NestJS (Docker) | Behind load balancer, min 2 replicas |
| Frontend | Next.js (containerised or Vercel) | CDN for static assets |
| File Storage | Cloud storage (e.g., AWS S3) | Private bucket, signed URLs |
| Error Tracking | Sentry (production project) | Alerts configured for critical errors |
| SSL/TLS | HTTPS enforced via reverse proxy | Auto-renewal via Let's Encrypt or managed cert |

---

## 2. Docker Configuration

### 2.1 API Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/prisma/package.json packages/prisma/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN npm ci

COPY packages/prisma/ packages/prisma/
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

RUN npm run build:shared
RUN npm run db:generate
RUN npm run build:api

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./packages/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
```

### 2.2 Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN npm ci

COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

RUN npm run build:shared
RUN npm run build:web

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/web"]
```

---

## 3. Database Management

### 3.1 Migration Strategy

| Environment | Command | When |
|-------------|---------|------|
| Local | `npx prisma migrate dev` | During development |
| Staging | `npx prisma migrate deploy` | On each deployment |
| Production | `npx prisma migrate deploy` | On each deployment (with approval) |

### 3.2 Seed Data

- A seed script provisions at least one Super Admin account for initial setup.
- Seed script is idempotent (safe to run multiple times).
- Staging may include additional test data.
- Production seed is minimal (Super Admin only).

### 3.3 Backup Strategy

| Environment | Frequency | Retention | Method |
|-------------|-----------|-----------|--------|
| Local | N/A | Docker volume | Manual |
| Staging | Daily | 7 days | Managed service automated |
| Production | Daily + hourly WAL | 30 days | Managed service with PITR |

---

## 4. Environment Variables

All environment variables are documented in `.env.example`. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens (min 256 bits) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (min 256 bits) |
| `JWT_ACCESS_EXPIRY` | No | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRY` | No | Refresh token expiry (default: 7d) |
| `PORT` | No | API server port (default: 3001) |
| `NODE_ENV` | Yes | `development`, `staging`, or `production` |
| `CORS_ORIGIN` | Yes | Allowed CORS origins (comma-separated) |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | Yes | From email address |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `FILE_UPLOAD_MAX_SIZE` | No | Max upload size in bytes (default: 5MB) |
| `FILE_UPLOAD_DEST` | No | Upload destination path (default: ./uploads) |
| `NEXT_PUBLIC_API_URL` | Yes | API URL for the frontend |

---

## 5. Health Checks and Monitoring

### 5.1 Health Endpoint

- `GET /api/v1/health` returns system status (database, file storage).
- Used by load balancers and uptime monitors.
- Returns `200 OK` when healthy, `503 Service Unavailable` when degraded.

### 5.2 Monitoring

| Aspect | Tool | Notes |
|--------|------|-------|
| Error tracking | Sentry | Captures unhandled exceptions with user context |
| Uptime monitoring | External service (e.g., UptimeRobot) | Pings `/api/v1/health` every 60s |
| Application logs | Structured JSON logs (pino) | Stdout in containers, collected by log aggregator |
| Database monitoring | Managed service dashboard | Connection pool, query performance |

---

## 6. Release Process

### 6.1 Pre-Release Checklist

1. All tests pass (100% pass rate required)
2. No P1 or P2 bugs open
3. Database migrations reviewed and tested
4. Environment variables documented
5. Sentry release created with source maps

### 6.2 Deployment Steps

1. **Build**: Create Docker images tagged with git SHA and version
2. **Migrate**: Run `prisma migrate deploy` against the target database
3. **Deploy**: Roll out new containers (rolling update, zero downtime)
4. **Verify**: Check health endpoint, smoke test critical flows
5. **Monitor**: Watch Sentry and logs for 30 minutes post-deploy

### 6.3 Rollback Procedure

1. Revert to previous Docker image tag
2. If migration was destructive, restore from backup (assess case-by-case)
3. Notify stakeholders of rollback and reason

---

## 7. Security in Deployment

- HTTPS enforced in staging and production
- Secrets managed via environment variables (never committed to git)
- Database credentials are unique per environment
- JWT secrets are unique per environment (min 256 bits)
- File upload directory is not web-accessible (served via authenticated API)
- Docker images built from minimal base (Alpine)
- `npm audit` run in CI pipeline

---

## Assumptions

1. Cloud provider choice is flexible (AWS, GCP, Vercel, etc.). This plan is provider-agnostic.
2. Container orchestration (ECS, Kubernetes, etc.) is chosen based on team preference.
3. DNS and domain configuration are handled separately.
4. SSL certificates are managed by the reverse proxy or cloud provider.
5. Log aggregation tooling (CloudWatch, Datadog, etc.) is chosen based on provider.
