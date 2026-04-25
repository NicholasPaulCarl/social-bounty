# Multi-stage Dockerfile for the Social Bounty Next.js web app.
#
# Base image: node:20-slim (Debian-based) — matches API Dockerfile for consistency.
# Prisma client is needed at build time (transpilePackages: ['@social-bounty/shared']).
#
# Build strategy:
#   - Builder stage: install all deps, build shared package, build Next.js
#   - Runtime stage: copy .next/ + public/ + production deps only
#   - Final image ~150MB (optimized, no build tools)

# ════════════════════════════════════════════════════════════════════
# Stage 1 — Builder
# ════════════════════════════════════════════════════════════════════
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL + ca-certs: needed for npm registry HTTPS calls.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first — this layer only rebuilds when deps change.
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/prisma/package*.json ./packages/prisma/

# Root tsconfig.json is extended by packages/shared/tsconfig.json.
# Must live at /app before tsc invocations or they fail with TS5083.
COPY tsconfig*.json ./

# Remove the root `prepare` script before `npm ci` — it references scripts/
# that won't exist in the build context at this point. HUSKY=0 alone isn't
# enough because `prepare` uses `&&` to chain commands.
RUN npm pkg delete scripts.prepare \
 && npm ci

# Copy only what's needed to build the web app.
COPY packages/prisma ./packages/prisma
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Generate Prisma client (used by shared package at build time).
RUN npm run db:generate

# Build the shared package (tsc).
RUN npm run build:shared

# CRITICAL: NEXT_PUBLIC_* env vars are baked into the Next.js bundle at
# BUILD time, not read at runtime. Setting NEXT_PUBLIC_API_URL in
# render.yaml's `envVars` block alone is too late — the bundle is already
# compiled with the localhost fallback from `client.ts`.
#
# Pattern: declare as ARG (so future per-env builds can override via
# Docker --build-arg or a CI matrix) with a sane production default.
# The default matches the production API host wired up in render.yaml.
ARG NEXT_PUBLIC_API_URL=https://api.socialbounty.cash/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js app — NEXT_PUBLIC_API_URL is now in the env, so
# `next build` will inline it everywhere `process.env.NEXT_PUBLIC_API_URL`
# is referenced (notably apps/web/src/lib/api/client.ts).
RUN npm run build:web

# ════════════════════════════════════════════════════════════════════
# Stage 2 — Runtime
# ════════════════════════════════════════════════════════════════════
FROM node:20-slim AS runtime

# tini for proper signal handling (graceful shutdown on redeploys).
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HUSKY=0

# Install production dependencies only (no build tools).
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/web/package*.json ./apps/web/

RUN npm ci --production --omit=dev

# Shared package dist + manifest (the @social-bounty/shared symlink resolves here).
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Next.js build output (.next/) + manifest + config.
# Note: apps/web/public/ is optional in Next.js — only copied when present.
# This project doesn't currently use a public/ directory, so it's omitted.
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

EXPOSE 3000

# tini as PID 1 so SIGTERM propagates cleanly to Node.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "--workspace=apps/web", "start"]
