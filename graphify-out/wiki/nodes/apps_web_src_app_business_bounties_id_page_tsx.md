# `/business/bounties/[id]/page.tsx`

> The Next.js App Router page file for the brand-admin bounty detail view.

## What it does

`apps/web/src/app/business/bounties/[id]/page.tsx` is the React component for `/business/bounties/:id`. It fetches the bounty via `useBounty(id)`, the submissions via `useBountySubmissions(id)`, and (for CLOSED bounties) the applications via `useBountyApplications(id)`. Top-to-bottom structure: header block (title, status badge, `accessType` padlock, action menu), overview section (description, channels, formats, rewards, deadlines), brand-asset strip, auto-verification preview (`<VerificationReportPanel audience="brand" />` Phase 2B — renders rules that will auto-verify before any submissions land), submission queue (with per-submission `<ReviewActionBar>` and hard-gate disabled state when URL scrapes are incomplete), applications list (CLOSED-only). Actions: **Go Live** (DRAFT → LIVE, gated on `paymentStatus === PAID`), **Edit** (routes to `[id]/edit`), **Fund** (unpaid DRAFT → Stitch hosted checkout via `redirect-to-hosted-checkout.ts`), **Close** (LIVE → CLOSED).

## Why it exists

This is the most feature-dense brand-admin page in the product. Every Phase 1/2/3 verification, every state-machine transition, every payment integration the product shipped surfaces somewhere on this page. It's the default "where does this break?" integration test surface — if a bounty edit works here end-to-end, the bounty lifecycle is healthy. Wired to the Next.js nested layout (`apps/web/src/app/business/layout.tsx`) for BUSINESS_ADMIN gating per the layout-guard pattern. The page spec at `md-files/page-spec/business-bounties-id.md` is the canonical documentation.

## How it connects

- **`packages/shared/index.ts`** — imports `BountyAccessType`, `BountyStatus`, `SubmissionStatus`, `PostFormat`, `SocialChannel` and ~8 other enums/types from the barrel.
- **Browse Bounties page** — the participant-facing list that links to this page via `/bounties/[id]` (the participant view).
- **Similar `page.tsx` files across the app** — ~50 `page.tsx` files exist under `apps/web/src/app/`, many linked to this one via embedding-similarity edges (they share layout structure, PrimeReact component vocabulary, and data-fetching conventions).
- **`useBounty(id)`, `useBountySubmissions(id)`, `useBountyApplications(id)`, `useUpdateBountyStatus(id)`** — the TanStack Query hooks this page consumes.
- **`<VerificationReportPanel>`** — the preview component that renders auto-verification rules (Phase 2B).
- **`<ReviewActionBar>`** — the per-submission approve/reject toolbar; disabled until all URL scrapes are VERIFIED.
- **`redirect-to-hosted-checkout.ts`** — the Stitch redirect helper invoked by the Fund button.

---
**degree:** 16 • **community:** "Next.js page routes" (ID 0) • **source:** `apps/web/src/app/business/bounties/[id]/page.tsx`
**last touched:** 4 days ago • **commits (90d):** 14 • **commits (total):** 14

> **Architectural note:** 14 commits in 90 days reflects heavy feature churn (bounty-submission verification Phase 1/2/3 all shipped through this page). The page is trending toward being an integration test surface; once it passes ~1500 LOC, extracting the submission-queue section into its own component would ease further iteration.
