# Multi-stage Dockerfile for the Social Bounty NestJS API.
#
# Why multi-stage: the builder stage needs dev deps (prisma CLI, nest build,
# typescript) which would bloat the runtime image. The runtime stage has only
# what's needed to execute + run prisma migrations at deploy time.
#
# Why prisma stays in node_modules at runtime: `packages/prisma/package.json`
# declares `prisma` in devDependencies. Running `prisma migrate deploy` at
# release time (via Render's preDeployCommand) needs the CLI on disk. Copying
# the full node_modules tree is the simplest path; the size hit (~150MB) is
# acceptable for a small team.
#
# Why node:20-alpine: matches CLAUDE.md's Node 20 LTS convention. Alpine gives
# us a ~180MB final image vs ~900MB for Debian-slim.

# ════════════════════════════════════════════════════════════════════
# Stage 1 — Builder
# ════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL is required by Prisma's query engine binary. node:20-alpine ships
# with libssl3 but Prisma 6 needs it exposed as a library explicitly.
RUN apk add --no-cache openssl

# Copy workspace manifests first — this layer only rebuilds when deps change.
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma/package*.json ./packages/prisma/

# Install all workspace dependencies (root-hoisted).
#   --ignore-scripts: skip husky install + graphify post-install which are
#   dev-local only and fail in a container.
RUN npm ci --ignore-scripts

# Copy only what's needed to build the API (skip apps/web — we don't build it here).
COPY packages/prisma ./packages/prisma
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client + build TypeScript outputs.
RUN npx prisma generate --schema=packages/prisma/schema.prisma \
 && npm run build:shared \
 && npm run build:api

# Prisma generates into packages/prisma/node_modules/.prisma/client — mirror
# into apps/api/node_modules so the API's resolver finds it at runtime.
# Matches the infra note in CLAUDE.md about the workspace Prisma client drift.
RUN mkdir -p apps/api/node_modules/.prisma \
 && cp -R packages/prisma/node_modules/.prisma/client apps/api/node_modules/.prisma/

# ════════════════════════════════════════════════════════════════════
# Stage 2 — Runtime
# ════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runtime

# tini reaps zombie processes + handles SIGTERM correctly for graceful shutdown.
# Critical for the webhook controllers — without it, in-flight requests would
# drop mid-flight on redeploys.
RUN apk add --no-cache tini openssl

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

# Copy installed node_modules (includes prisma CLI for preDeployCommand).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Prisma schema + migrations (needed for `prisma migrate deploy`).
COPY --from=builder /app/packages/prisma ./packages/prisma

# Shared package build output + manifest (the `@social-bounty/shared` symlink
# in node_modules resolves here).
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# API build output + manifest + .prisma client.
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma

EXPOSE 3001

# tini as PID 1 so SIGTERM propagates cleanly to the Node process.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
