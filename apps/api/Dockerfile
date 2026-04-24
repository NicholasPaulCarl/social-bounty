# Multi-stage Dockerfile for the Social Bounty NestJS API.
#
# Base image: node:20-slim (Debian-based) — Prisma's default `native` binary
# target matches linux-gnu cleanly. Alpine (musl) caused exit-127s earlier
# because `--ignore-scripts` skipped `@prisma/engines` postinstall AND the
# default binary didn't match musl. Debian slim is ~100MB larger than Alpine
# but eliminates the class of issue and is the officially-recommended base
# for Prisma in production.
#
# Scripts strategy:
#   - `HUSKY=0` is honoured by husky to no-op init (no .git in build context).
#   - `scripts/install-graphify-hook.sh` is safe: it silently exits 0 when
#     the `graphify` binary isn't on PATH (which it won't be in a container).
#   - So we run `npm ci` with scripts ENABLED — this lets Prisma's
#     `@prisma/engines` postinstall download query engines normally.
#
# Each build step runs as a separate RUN so Docker caches + surfaces errors
# at the exact failing command instead of masking them behind `&&` chains.

# ════════════════════════════════════════════════════════════════════
# Stage 1 — Builder
# ════════════════════════════════════════════════════════════════════
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL + ca-certs: Prisma's query engine links against libssl; ca-certs
# needed for Prisma's engine download + any npm registry HTTPS calls.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first — this layer only rebuilds when deps change.
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma/package*.json ./packages/prisma/

# Remove the root `prepare` script before `npm ci`. The script runs
# `husky && bash scripts/install-graphify-hook.sh`, but `scripts/` isn't
# copied into the build context at this point — only the workspace
# manifests are — so the bash invocation exits 127 (file not found).
# HUSKY=0 alone isn't enough because `prepare` uses `&&` to chain into
# the graphify script.
#
# `npm pkg delete` only mutates the package.json inside the image; the
# committed file is untouched. Prisma's postinstall lives in
# `@prisma/engines`'s own package.json, not ours, so engine downloads
# are unaffected by this removal.
RUN npm pkg delete scripts.prepare \
 && npm ci

# Copy only what's needed to build the API (skip apps/web — frontend deploys elsewhere).
COPY packages/prisma ./packages/prisma
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client via the existing workspace script. Running it
# through `npm run --workspace=packages/prisma` sets cwd to packages/prisma
# and prepends `packages/prisma/node_modules/.bin` to PATH, so the prisma
# CLI resolves even though it's not hoisted to the root `.bin/`. This is
# the same path the `db:generate` script uses locally.
RUN npm run db:generate

# Build the shared package (tsc)
RUN npm run build:shared

# Build the API (nest build)
RUN npm run build:api

# Prisma generates into packages/prisma/node_modules/.prisma/client — mirror
# into apps/api/node_modules so the API's resolver finds it at runtime.
# Matches the infra note in CLAUDE.md about the workspace Prisma client drift.
RUN mkdir -p apps/api/node_modules/.prisma \
 && cp -R packages/prisma/node_modules/.prisma/client apps/api/node_modules/.prisma/

# ════════════════════════════════════════════════════════════════════
# Stage 2 — Runtime
# ════════════════════════════════════════════════════════════════════
FROM node:20-slim AS runtime

# tini for proper signal handling (SIGTERM → graceful shutdown on redeploys,
# critical for in-flight webhook requests not being dropped mid-write).
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    HUSKY=0

# Full node_modules (inc. prisma CLI for preDeployCommand's `migrate deploy`).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Prisma schema + migrations — required for `prisma migrate deploy`.
COPY --from=builder /app/packages/prisma ./packages/prisma

# Shared package build output + manifest (the `@social-bounty/shared`
# symlink in node_modules resolves here).
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# API build output + manifest + .prisma client (workspace mirror).
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma

EXPOSE 3001

# tini as PID 1 so SIGTERM propagates cleanly to the Node process.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
