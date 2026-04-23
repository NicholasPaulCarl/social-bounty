# Bounty Detail (`/business/bounties/[id]`)

> Brand-admin bounty detail page — overview, actions, submissions drill-down.

## What it does

`/business/bounties/[id]` is the primary single-bounty control surface for BUSINESS_ADMINs. It renders all bounty metadata (title, description, channels/formats, rewards, deadlines, payout metrics), the current status badge (DRAFT / LIVE / CLOSED / RESOLVED), the `accessType` padlock (PUBLIC/CLOSED) wired via `BountyAccessType` (commit `da71b0a`), the verification-check preview from `<VerificationReportPanel audience="brand" />` (Phase 2B preview addition commit `264ae71`), the submission queue filtered by status, the applications list (for CLOSED bounties), per-submission review actions, and the primary CTAs: **Go Live** (DRAFT → LIVE once PAID), **Edit** (routes to `/business/bounties/[id]/edit`), **Fund** (for unpaid DRAFTs, chains through `redirect-to-hosted-checkout.ts`), **Close** (LIVE → CLOSED). Submission cards render with the approval-gate-disabled state tooltip when URL scrapes are incomplete (commit `d7f2752`).

## Why it exists

The bounty detail page is where all the Phase 1/2/3 verification work becomes visible to the brand — it's the operator dashboard for a single bounty. The `accessType` wire-up fix (commit `da71b0a`) made the PUBLIC/CLOSED padlock render correctly (previously the field was never sent, always fell back to PUBLIC, routing logic was unreachable). The Go Live button's hard gate on `paymentStatus === PAID` is the enforcement of the Financial Non-Negotiables §4.8 — platform custody before distribution.

## How it connects

- **`@social-bounty/shared`** — imports every enum it renders (`BountyStatus`, `BountyAccessType`, `SubmissionStatus`, `PostFormat`, `SocialChannel`).
- **Browse Bounties page (`/bounties`)** — the participant-facing list this detail page has a partner on; `imports_from` edge in the graph.
- **`useBounty(id)`, `useBountySubmissions(id)`, `useBountyApplications(id)` hooks** — the data plumbing from `useBounties.ts`.
- **`useUpdateBountyStatus(id)` mutation** — the Go Live / Close button handler.
- **`<VerificationReportPanel>`** — the Phase 2B preview component that renders "rules to be auto-verified".
- **`<ReviewActionBar>`** — the per-submission approve/reject toolbar with the hard-gate disabled state.
- **Sibling `page.tsx` across the app** — semantically linked via embedding-similarity edges (participant `bounties/[id]`, admin `bounties/[id]`, etc.).

---
**degree:** 20 • **community:** "Page spec documentation" (ID 5) • **source:** `md-files/page-spec/business-bounties-id.md` (spec) + `apps/web/src/app/business/bounties/[id]/page.tsx` (route)

> **Architectural note:** this page is a natural showcase of how the platform's concerns stack up — RBAC (BUSINESS_ADMIN via layout), financial (fund + Go Live gated on PAID), verification (scrape-status gate on approve), and UX (preview panel renders before any submission). A change to any one layer is likely to touch this page; treat it as an integration test surface in manual QA.
