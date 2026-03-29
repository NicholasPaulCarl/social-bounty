# QA Developer — Known Issues & Routine Checks

> **Maintained by:** QA Lead
> **Last updated:** 2026-03-29

---

## Routine Pre-Test Checks

Run these checks **before every test session** to avoid wasting time on environment issues.

### 1. Stale `.next` Webpack Cache (Blank Page / Non-Interactive Page)

**Symptom:** Frontend at `http://localhost:3000` shows either:
- A completely blank white page, OR
- The page renders visually but buttons, forms, and links don't respond to clicks (React fails to hydrate)

Browser console may show `Cannot find module './XXXX.js'` errors or JS chunk 404s.

**Root Cause:** Next.js dev server caches compiled webpack chunks in `.next/server/` and `.next/static/`. When files are added, renamed, or significantly changed between sessions (especially by multiple agents working in parallel), the cached chunks become stale. The HTML renders server-side but client JS chunks return 404, preventing React hydration — the page looks fine but is completely non-interactive.

**How to detect:**
```bash
# Check 1: Does the HTML render?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
# 200 = HTML renders (but may still be broken)

# Check 2: Do the JS chunks load?
curl -s http://localhost:3000/login | grep -o 'src="/_next[^"]*"' | head -3 | while read -r src; do
  url=$(echo "$src" | sed 's/src="//;s/"$//')
  echo "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$url") $url"
done
# All should return 200. Any 404 = broken hydration = non-interactive page

# Check 3: Look for the error in server logs
grep "Cannot find module\|404" /tmp/sb-web.log | tail -5
```

**Fix:**
```bash
# 1. Kill the dev server
pkill -f "next dev"

# 2. Delete ALL caches
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache

# 3. Restart with clean state
cd apps/web && npx next dev

# 4. Wait for full compilation (may take 10-20s first time)
# Verify: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login should return 200
# AND all JS chunk URLs in the HTML should also return 200
```

**Prevention:**
- Always clear `.next` after git pull or branch switch
- Always clear `.next` after bulk file creation/deletion (e.g., new feature with many new pages)
- Recommended dev startup: `rm -rf .next && npx next dev`
- If page looks correct but is unresponsive, this is the FIRST thing to check

**Incident History:**
- 2026-03-29 (first): Blank page after Component Library + mobile UI batch changes. Fix: clear `.next`.
- 2026-03-29 (second): Login page rendered but non-interactive (buttons didn't work). JS chunks returning 404. Fix: clear `.next` + `node_modules/.cache`.

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

## Agent Post-Deployment Verification Protocol

When agents make bulk changes (especially multiple agents in parallel), the following verification MUST run before declaring the task complete:

### Mandatory Post-Change Checks

```bash
# 1. Backend compiles
cd apps/api && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit

# 2. All tests pass
cd /path/to/social-bounty && npx jest --config apps/api/jest.config.ts --no-coverage

# 3. Frontend builds (catches type errors + missing imports)
cd apps/web && npx next build

# 4. Frontend dev server actually works (catches runtime/hydration errors)
rm -rf .next && npx next dev &
sleep 15
# Verify HTML renders AND JS chunks load:
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
JS_STATUS=$(curl -s http://localhost:3000/login | grep -o 'src="/_next/static/chunks/main-app[^"]*"' | sed 's/src="//;s/"$//' | xargs -I{} curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000{}")
echo "HTML: $STATUS | JS: $JS_STATUS"
# Both must be 200

# 5. API smoke test
curl -s http://localhost:3001/api/v1/health | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])"
# Must print "ok"
```

### Agent Error Learning

When a bug is caused by agent work, document it here with:
1. **What happened** — the symptom the user experienced
2. **Root cause** — what the agent did (or didn't do) that caused it
3. **Detection** — how to catch this before the user sees it
4. **Prevention** — what the agent prompt should include to prevent recurrence

#### Known Agent-Caused Issues

**Issue: Non-interactive frontend after bulk file changes**
- **What happened:** Login page rendered but buttons didn't work. User couldn't login.
- **Root cause:** Multiple agents created/modified 20+ files in parallel. Next.js dev server's hot-reload cache became inconsistent — HTML referenced chunk IDs that no longer existed.
- **Detection:** After bulk changes, always verify JS chunks load (not just HTML status). `next build` passes but dev server can still serve stale chunks.
- **Prevention:** Agent prompts should include a step to clear `.next` cache and verify the dev server after bulk file creation. Add to all frontend agent prompts: "After creating files, run `rm -rf .next` and restart the dev server."

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
