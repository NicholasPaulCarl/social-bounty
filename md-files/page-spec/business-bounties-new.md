# Create Bounty — `/business/bounties/new`

**Route path:** `/business/bounties/new`
**File:** `apps/web/src/app/business/bounties/new/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (CTA from Dashboard + Bounties list + Empty states).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Multi-section form for creating a new bounty. Chains directly into the Stitch hosted-checkout flow on Create — no detour via the detail page. Save Draft path skips payment and lands on the detail page.

## Entry & exit
- **Reached from:** Dashboard CTA, `/business/bounties` CTA, empty-state CTAs.
- **Links out to:** Stitch hosted checkout (prod: same-page redirect; dev: new tab); `/business/bounties/{id}` (on Save Draft or on fund failure).

## Data
- **React Query hooks:** `useCreateBounty()` (`hooks/useBounties.ts`), `useBrand(user.brandId)`, `useAuth`.
- **API endpoints called:** `POST /api/v1/bounties`, `POST /api/v1/bounties/:id/brand-assets` (optional), `POST /api/v1/bounties/:id/fund` (Create path only).
- **URL params:** none
- **Search params:** none

## UI structure
- Page title "Create new bounty".
- Brand-context banner (`Building2` icon + active brand name) when `useBrand` resolves.
- `<CreateBountyForm>` — the big multi-section form managed by the `useCreateBountyForm` reducer. See CLAUDE.md "Bounty-form UX" (2026-04-17) + "bounty form proof-requirements integrity" (2026-04-16) entries for the full field inventory, section layout, and mobile tightening history. Key sections: Basic Info, Channels, Rewards, Bounty Rules (optional), Eligibility, Payout Metrics, Post Visibility, Brand Assets, Advanced. Fixed footer with Save Draft + Create Bounty. Staged file refs held via `stagedFilesRef` and uploaded post-create.

## States
- **Loading:** inline — `isSubmitting` / `isSavingDraft` drive button spinners; `isFunding` bridges the gap between mutation settle and Stitch redirect firing.
- **Empty:** N/A (new form).
- **Error:** `formError` string displayed inline; extracted from API error via `extractErrorMessage` (handles `details` array + fallback `message`).
- **Success — Save Draft:** toast + `router.push(/business/bounties/{id})`.
- **Success — Create Bounty:** `uploadStagedFiles` → `fundBounty` → `redirectToHostedCheckout` (same-page redirect or new-tab per env). Production page unloads here. Dev stays on form (onDevSettled clears `isFunding`).
- **Fund failure after create:** bounty is saved as DRAFT; error toast; navigate to detail page to retry via Go Live.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save Draft | `createBounty.mutate` → detail page | Bounty persisted as DRAFT; no payment. |
| Create Bounty | `createBounty.mutate` + `uploadStagedFiles` + `fundBounty` + redirect | Hosted checkout. On success Stitch webhook flips PaymentStatus server-side. |

## Business rules
- RBAC: BUSINESS_ADMIN.
- Subscription tier gate: CLOSED bounties require Pro (enforced server-side; form exposes the toggle regardless).
- CLAUDE.md §4: `POST /bounties` is NOT a ledger mutation — it only creates the record; no money moves until Stitch webhook settles. `POST /bounties/:id/fund` is the hosted-checkout trigger (still not a ledger write; ledger writes on settlement webhook).
- Brand-asset uploads are non-blocking on Save Draft — if upload fails the brand gets a recovery toast.
- Form validation: proof-requirements must be explicitly selected (`f5353d2` removed the auto-tick); Bounty Rules section is optional; CASH rewards skip reward name; TikTok auto-selects Video Only.

## Edge cases
- Brand has no funded wallet / no KYB: create persists; Stitch hosted-checkout will still open (pays the reserve), but payouts later are gated by KYB_APPROVED on the beneficiary side.
- KYB not yet approved: DRAFT still works; Go Live flow hits server gate at funding time. (NOTE: gate is actually enforced at fund-bounty time; form doesn't check.)
- Kill-switch active: fund-bounty call hits kill-switch gate server-side.
- Network error mid-upload of brand assets: non-blocking — brand is told to re-upload from edit page.
- Iframe-sandboxed preview (Claude Preview, staging): `redirectToHostedCheckout` opens in new tab via `window.open(_blank)`.

## Tests
Form logic tested in `hooks/useCreateBountyForm.*.test.ts` (reducer behaviour, section completion, validation).

## Related files
- `components/bounty-form/` (entry `index.ts` → `CreateBountyForm`)
- `components/bounty-form/hooks/useCreateBountyForm.ts` (reducer)
- `components/bounty-form/utils/buildCreateBountyRequest.ts`
- `lib/api/bounties.ts`
- `lib/utils/redirect-to-hosted-checkout.ts`
- `hooks/useBounties.ts`, `useBrand.ts`, `useAuth.ts`, `useToast.ts`

## Open questions / TODOs
- CLAUDE.md flags that the "URL" proof checkbox is not pre-ticked — form must require an explicit selection (`f5353d2` integrity fix). No TODO in code; just watch that refactors don't regress.
