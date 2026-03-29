# QA Developer — Known Issues & Routine Checks

> **Maintained by:** QA Lead
> **Last updated:** 2026-03-29

---

## Routine Pre-Test Checks

Run these checks **before every test session** to avoid wasting time on environment issues.

### 1. Stale `.next` Webpack Cache (Blank Page)

**Symptom:** Frontend loads at `http://localhost:3000` but shows a completely blank white page. Browser console may show `Cannot find module './XXXX.js'` errors.

**Root Cause:** Next.js dev server caches compiled webpack chunks in `.next/server/`. When files are added, renamed, or significantly changed between sessions (especially by multiple agents working in parallel), the cached chunks become stale and reference modules that no longer exist.

**How to detect:**
```bash
curl -s http://localhost:3000/login | grep "Cannot find module"
# If this returns a match, the cache is stale
```

**Fix:**
```bash
# 1. Kill the dev server
pkill -f "next dev"

# 2. Delete the cache
rm -rf apps/web/.next

# 3. Restart
cd apps/web && npx next dev
```

**Prevention:**
- Always clear `.next` after git pull or branch switch
- Always clear `.next` after bulk file creation/deletion (e.g., new feature with many new pages)
- Add to dev startup script: `rm -rf .next && npx next dev`

**Added to checklist:** 2026-03-29 after blank page incident caused by stale cache following Component Library + mobile UI batch changes.

---

### 2. API Server Port Conflict (EADDRINUSE)

**Symptom:** API fails to start with `Error: listen EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
lsof -ti:3001 | xargs kill -9
# Then restart API
```

---

### 3. Prisma Client Out of Sync

**Symptom:** TypeScript errors like `Property 'X' does not exist on type 'Y'` when a new model or field was added to the schema but the client wasn't regenerated.

**Fix:**
```bash
cd packages/prisma && npx prisma generate
```

---

### 4. Stale API Build (tsconfig.tsbuildinfo)

**Symptom:** API dev server starts but new modules or changes aren't reflected. Routes return 404 for endpoints that exist in the code.

**Fix:**
```bash
cd apps/api && rm -f tsconfig.tsbuildinfo && npx tsc -p tsconfig.json
```

---

### 5. Redis Not Running

**Symptom:** API health check shows `redis: error`. Auth tokens, brute force protection, and dashboard caching won't work.

**Fix:**
```bash
docker compose up -d redis
# Verify:
docker exec social-bounty-redis redis-cli ping
# Should return: PONG
```

---

### 6. Database Migration Drift

**Symptom:** Prisma queries fail with `The table X does not exist` or `Unknown column Y`.

**Fix:**
```bash
cd packages/prisma && npx prisma db push --accept-data-loss
```

---

## Full Environment Health Check Script

Run this before any testing session:

```bash
#!/bin/bash
echo "=== Social Bounty Environment Check ==="

# 1. Docker services
echo -n "PostgreSQL: "
docker exec social-bounty-db pg_isready -U postgres 2>/dev/null && echo "OK" || echo "FAIL"
echo -n "Redis: "
docker exec social-bounty-redis redis-cli ping 2>/dev/null || echo "FAIL"
echo -n "MailHog: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8025 && echo " OK" || echo "FAIL"

# 2. API
echo -n "API Health: "
curl -s http://localhost:3001/api/v1/health | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "NOT RUNNING"

# 3. Frontend
echo -n "Frontend: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>/dev/null)
if [ "$STATUS" = "200" ]; then echo "OK"; elif [ "$STATUS" = "500" ]; then echo "STALE CACHE - run: rm -rf apps/web/.next"; else echo "NOT RUNNING"; fi

# 4. Tests
echo -n "Unit Tests: "
cd /Users/nicholasschreiber/Documents/social-bounty
npx jest --config apps/api/jest.config.ts --no-coverage --silent 2>&1 | tail -1

echo "=== Check Complete ==="
```

---

## Test Session Checklist

Before running any tests:

- [ ] Docker services running (postgres, redis, mailhog)
- [ ] `.next` cache cleared if files changed since last session
- [ ] API compiles (`npx tsc --noEmit` in apps/api)
- [ ] Frontend builds (`npx next build` in apps/web)
- [ ] API health endpoint returns `{"status":"ok"}`
- [ ] Frontend login page returns HTTP 200
- [ ] Demo seed data present (20 users, 15 bounties)
- [ ] All unit tests passing (530+)
