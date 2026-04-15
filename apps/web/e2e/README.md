# Playwright E2E Tests

E2E / smoke tests for the Social Bounty web app. Uses Playwright (Chromium only).

## Install (one-time)

Dependencies are already declared in `apps/web/package.json` (`@playwright/test`).
After `npm install` at the repo root, install the Chromium browser binary:

```bash
# From apps/web (or anywhere in the repo)
npx playwright install chromium
# If the CI runner needs system libs (Linux):
# npx playwright install --with-deps chromium
```

`playwright.config.ts` lives at `apps/web/playwright.config.ts`. The `testDir`
is `./e2e` (this folder).

## Prerequisites to run the tests

The tests hit a live running stack — they do NOT start the API or web for you.
Before running any spec, you must have:

| Service | URL | How to start |
|---|---|---|
| PostgreSQL | local or Supabase | per your `.env` / `docker-compose.yml` |
| Redis | `127.0.0.1:6379` | `redis-server` (required for OTP login in dev) |
| API (NestJS) | `http://localhost:3001` | from `apps/api/`: `npm run dev` |
| Web (Next.js) | `http://localhost:3000` | from `apps/web/`: `npm run dev` |

Pre-flight checks (run before invoking tests):

```bash
curl -s http://localhost:3001/api/v1/health   # expect 200, status: ok
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000   # expect 200
```

Additional env for the DRAFT → Go Live smoke test:

- `PAYMENTS_PROVIDER=stitch_sandbox` in `apps/api/.env`. The test does **not**
  complete checkout — it only asserts the client was redirected toward
  `express.stitch.money`. Safe to run against the sandbox.

### Demo credentials (OTP login)

The OTP helper at `./helpers.ts` assumes:

- `participant@demo.com` (PARTICIPANT)
- `admin@demo.com` (BUSINESS_ADMIN)
- `superadmin@demo.com` (SUPER_ADMIN)
- OTP shortcut: `000000` accepted in dev/test mode via Redis-backed code path.

Run `npm run db:seed` (from repo root) to ensure those rows exist.

## Running

From `apps/web/`:

```bash
# Full suite
npm run test:e2e

# Smoke subset only (4 critical flows — see below)
npx playwright test --grep @smoke

# Single spec
npx playwright test e2e/smoke-finance-kill-switch.spec.ts

# Headed / UI mode
npm run test:e2e:ui
npm run test:e2e:debug
```

Reports: `playwright-report/` (HTML) and `test-results/` (traces on failure).

## The @smoke subset

Four specs, one file each. All are tagged `@smoke` in their `describe()` so
CI pipelines can run just this subset before a release gate.

| # | File | Flow |
|---|---|---|
| 1 | `smoke-finance-kill-switch.spec.ts` | Super Admin → `/admin/finance`: balances + Kill Switch card render; ACTIVATE opens confirm dialog; Cancel closes it without toggling |
| 2 | `smoke-brand-go-live.spec.ts` | Business Admin → `/business/bounties`: open a DRAFT, click Go Live, assert redirect to `express.stitch.money` (skipped if no DRAFT exists) |
| 3 | `smoke-hunter-payouts.spec.ts` | Participant → `/settings/payouts`: form (holder/bank/account/type) + history table or empty state render |
| 4 | `smoke-admin-finance-tabs.spec.ts` | Super Admin → `/admin/finance/exceptions` and `/admin/finance/insights` both load without errors |

Expected outcome of `npx playwright test --grep @smoke`, against a freshly
seeded stack with no DRAFT bounties:

- smoke-finance-kill-switch: **2 passed**
- smoke-brand-go-live:       **1 skipped** (no DRAFT available) OR **1 passed**
- smoke-hunter-payouts:      **1 passed**
- smoke-admin-finance-tabs:  **2 passed**

Total: 5 passing, 1 passing-or-skipped.

## Notes

- The ACTIVATE Kill Switch button is **not** currently disabled until 10 chars
  are typed in the reason field — the current implementation validates on
  click and toasts an error. The smoke test reflects actual UX (Cancel closes
  the dialog) and carries a TODO that can be flipped on when/if the
  button-disabled behaviour is added (see inline comment in
  `smoke-finance-kill-switch.spec.ts`).

- `smoke-brand-go-live.spec.ts` aborts the navigation to Stitch before leaving
  the app — it verifies the client was redirected toward `express.stitch.money`
  either by capturing the `hostedUrl` from `POST /bounties/:id/fund` or by
  observing a `framenavigated` event to a Stitch URL. We never complete the
  checkout, so the test is safe against the sandbox.
