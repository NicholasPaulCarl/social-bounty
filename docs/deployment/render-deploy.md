# Render deploy runbook — Social Bounty API

> **Audience:** you (the operator) doing a one-time cutover from "no prod API" to "NestJS running at `api.socialbounty.cash`" on Render. After the first-time setup, Render auto-deploys every push to `main`.

**Total time:** ~30 min active + ~30 min waiting on DNS propagation.

**Why Render over Vercel for the API:** NestJS has 10 persistent cron schedulers (reconciliation, clearance, auto-refund, etc.) that serverless can't run. See ADR 0011 §6 and `docs/deployment/deployment-plan.md` §1.3.

---

## Pre-flight — confirm these are true before starting

- [ ] Latest `main` is at [41c3a18](https://github.com/NicholasPaulCarl/social-bounty/commit/41c3a18) or later. (Current session's ADR 0011 + token service + webhook handler all landed.)
- [ ] `apps/api/Dockerfile` + `render.yaml` + `.dockerignore` all exist at repo root (they do, as of this doc).
- [ ] You have the secrets handy for env vars (Supabase URLs, Redis creds, JWT secrets, Stitch creds, Apify token, SMTP, `BENEFICIARY_ENC_KEY`, `STITCH_SYSTEM_ACTOR_ID`). Open your local `.env` as a reference. <!-- historical -->
- [ ] TradeSafe has NOT yet issued production creds — that's expected. Leave `TRADESAFE_CLIENT_ID` + `TRADESAFE_CLIENT_SECRET` blank for now; the API boots fine with them empty (it falls into mock mode, which is safe).

---

## Step 1 — Create the Render account + connect GitHub (~5 min)

1. Sign up at [render.com](https://render.com) using GitHub OAuth.
2. Install the Render GitHub app with access to the `NicholasPaulCarl/social-bounty` repo.
3. On the Render dashboard, click **Blueprints** (sidebar) → **New Blueprint Instance**.

## Step 2 — Apply the Blueprint (~2 min)

1. Select the `social-bounty` repo.
2. Render auto-detects `render.yaml`. Confirm it sees one service: `social-bounty-api` (Docker, Frankfurt region, Starter plan).
3. Click **Apply**.
4. Render will pause for env var input — move to Step 3 before clicking deploy.

## Step 3 — Paste in the secrets (~10 min)

Render opens a form listing every `sync: false` env var. Paste values from your local `.env`. Quick reference:

### Database (Supabase)

```bash
# Runtime — pooler (port 6543)
DATABASE_URL=postgresql://postgres.cbgmcxrjqclkdkvyxsiu:<PASSWORD>@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true

# Migrations — direct (port 5432, NO pgbouncer flag)
DIRECT_URL=postgresql://postgres.cbgmcxrjqclkdkvyxsiu:<PASSWORD>@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

**Why two URLs:** Supabase's pgBouncer transaction mode (port 6543) can't execute DDL statements that Prisma migrations need. Port 5432 bypasses pgBouncer. Runtime queries (reads, writes) go through the pooler for connection efficiency.

### Redis (Upstash / wherever you have it)

Pull these four from your local `.env`:
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB` (set to `0` if unset)

### Auth secrets

Generate two 64-char hex strings if they aren't in your local `.env`:

```bash
openssl rand -hex 32   # for JWT_SECRET
openssl rand -hex 32   # for JWT_REFRESH_SECRET
```

### Stitch <!-- historical -->

Copy from your local `.env`:
- `STITCH_CLIENT_ID` <!-- historical -->
- `STITCH_CLIENT_SECRET` <!-- historical -->
- `STITCH_WEBHOOK_SECRET` <!-- historical -->
- `STITCH_SYSTEM_ACTOR_ID` — the user UUID the system uses for AuditLog fallback. If you don't have one, create a row in `users` with role `SUPER_ADMIN` and paste its id. <!-- historical -->

### TradeSafe

Already prepared earlier this session:
- `TRADESAFE_CALLBACK_SECRET` → `e709b9467faf93b6faa1d9f95d8769a92237e0db0931efeb`
- `TRADESAFE_CLIENT_ID` → LEAVE BLANK until TradeSafe approves Go-Live and issues prod creds
- `TRADESAFE_CLIENT_SECRET` → LEAVE BLANK

### Encryption key

```bash
openssl rand -hex 32   # for BENEFICIARY_ENC_KEY
```

Vault this outside Render too — losing it means losing access to encrypted beneficiary bank details in the DB.

### Apify

- `APIFY_API_TOKEN` — from your local `.env`

### Mail (SMTP)

If you don't have prod SMTP yet, you can skip for now — the mail service degrades gracefully (logs mail attempts, doesn't crash the app). Set these when you have a real provider:
- `SMTP_HOST` (e.g. `smtp.sendgrid.net`)
- `SMTP_PORT` (typically `587`)
- `SMTP_USER`
- `SMTP_PASS`

### Sentry (optional)

- `SENTRY_DSN` — leave blank if you haven't provisioned a Sentry project yet.

---

## Step 4 — First deploy (~10 min)

1. Click **Create Services**.
2. Render starts the first deploy. Watch the build log:
   - Pulls `node:20-alpine`
   - `npm ci` (~2 min)
   - `prisma generate` + `nest build`
   - Multi-stage copy → final image (~180MB)
3. Before the new container gets traffic, `preDeployCommand` runs:
   ```
   npx prisma migrate deploy --schema=packages/prisma/schema.prisma
   ```
   This applies every migration in `packages/prisma/migrations/` to Supabase. Expect 6–8 already-applied ones plus the new `20260424152555_tradesafe_schema` (landed this session).
4. Service starts. Logs should show:
   ```
   [Nest] [Bootstrap] Social Bounty API running on port 3001
   ```
5. Render assigns you a `*.onrender.com` URL, e.g. `social-bounty-api-xyz.onrender.com`. Test it:
   ```bash
   curl -sI https://social-bounty-api-xyz.onrender.com/api/v1/subscription
   # Expected: HTTP 401 Unauthorized (auth guard rejects unauth'd request)
   ```

## Step 5 — Point `api.socialbounty.cash` at Render (~10 min + DNS propagation)

Currently `api.socialbounty.cash` CNAMEs to Vercel, which returns `DEPLOYMENT_NOT_FOUND`. You need to re-point it.

1. In Render → your service → **Settings** → **Custom Domain** → **Add** → enter `api.socialbounty.cash`.
2. Render shows the CNAME target (something like `social-bounty-api-xyz.onrender.com`).
3. In your DNS provider (where `socialbounty.cash` is managed):
   - Delete the existing `api.socialbounty.cash` CNAME (currently pointing to `50a494db5cd140d9.vercel-dns-017.com.`)
   - Add a new CNAME: `api` → `<render-target>.onrender.com`
4. Wait 15–60 min for DNS propagation (some providers take longer; TTL depends on your current record).
5. Verify propagation:
   ```bash
   dig +short api.socialbounty.cash @8.8.8.8
   # Expected: points to a Render IP (formerly pointed to a Vercel IP)
   ```
6. Once DNS resolves, Render auto-provisions a Let's Encrypt TLS cert (~5 min more).

## Step 6 — Smoke-test the new production API (~5 min)

```bash
# 1. Auth guard returns 401 on a protected endpoint
curl -sI https://api.socialbounty.cash/api/v1/subscription
# Expected: HTTP/2 401

# 2. OAuth callback endpoint exists (returns 302 or 400 on empty params)
curl -sI "https://api.socialbounty.cash/api/v1/auth/tradesafe/callback?code=test&state=test"
# Expected: HTTP/2 302 (redirects to failure URL since no real token)

# 3. TradeSafe transaction callback rejects bad secret
curl -s -w "\nHTTP %{http_code}\n" -X POST \
  https://api.socialbounty.cash/api/v1/webhooks/tradesafe/wrongsecret \
  -H "Content-Type: application/json" \
  -d '{"id":"test","state":"CREATED"}'
# Expected: HTTP 401

# 4. TradeSafe transaction callback accepts correct secret (200 even for bogus id — the re-fetch fails gracefully)
curl -s -w "\nHTTP %{http_code}\n" -X POST \
  "https://api.socialbounty.cash/api/v1/webhooks/tradesafe/e709b9467faf93b6faa1d9f95d8769a92237e0db0931efeb" \
  -H "Content-Type: application/json" \
  -d '{"id":"nonexistent-tx","state":"CREATED"}'
# Expected: HTTP 200 (with processed body; handler logs the miss at WARN)
```

All four checks green → API is production-ready.

---

## What this gets you

- Production NestJS API at `https://api.socialbounty.cash`
- All 10 cron schedulers running persistently (reconciliation every 15 min, auto-refund every 6h, etc.)
- Auto-deploy from `main` via Render's GitHub integration
- Prisma migrations run idempotently on every deploy before traffic switches
- TLS auto-provisioned + auto-renewed
- Logs + metrics in Render dashboard

---

## What's still required for TradeSafe Go-Live (post-deploy)

After TradeSafe approves and issues production creds:

1. Render → service → Environment → update:
   - `TRADESAFE_CLIENT_ID` (from approval email)
   - `TRADESAFE_CLIENT_SECRET` (shown ONCE)
2. Render auto-redeploys on env var change.
3. Verify live auth works:
   ```bash
   # From your local machine
   TRADESAFE_LIVE_SMOKE=1 \
   TRADESAFE_AUTH_URL=https://auth.tradesafe.co.za/oauth/token \
   TRADESAFE_GRAPHQL_URL=https://api.tradesafe.co.za/graphql \
   TRADESAFE_CLIENT_ID=<prod-id> \
   TRADESAFE_CLIENT_SECRET=<prod-secret> \
   TRADESAFE_MOCK=false \
   npx jest --config apps/api/jest.config.ts --testPathPatterns tradesafe-graphql.live.smoke
   ```

---

## Known limitations / things to watch

- **Free tier goes to sleep after 15 min of inactivity.** If you stay on `starter` plan ($7/mo), the service is always-on. Don't deploy to the free tier — schedulers can't fire on a sleeping service.
- **Starter plan has 512MB RAM.** The API currently sits around 280MB idle; with the 10 schedulers active it peaks around 380MB. You have headroom but watch for OOMs once bounties scale.
- **The Supabase connection pool can be exhausted.** Each Render instance opens connections via pgBouncer (port 6543) — fine for a single instance. If you bump to 2+ replicas, monitor Supabase pooler connections.
- **Migrations that fail abort the deploy.** This is a feature — partial-state is worse than "old version keeps running." If a migration fails, fix the migration locally (test against a fresh DB), push, and Render retries.

---

## Rollback

If a deploy breaks:

1. Render → service → **Deploys** → find the last known-good commit
2. Click **Rollback**
3. Render re-deploys that version (runs its preDeployCommand too — migrations already idempotent so this is safe)

For a code-level emergency (kill-switch the whole API): set `PAYMENTS_PROVIDER=none` in Render env vars — forces all Stitch/TradeSafe calls to a safe mock mode. Still need to verify each code path respects this — not a substitute for the DB-backed financial kill switch (`SystemSetting.financial.kill_switch.active`), which is the canonical stop. <!-- historical -->
