# Edit Bounty — `/business/bounties/[id]/edit`

**Route path:** `/business/bounties/[id]/edit`
**File:** `apps/web/src/app/business/bounties/[id]/edit/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (Edit button on detail + list).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Edit form for an existing bounty. Reuses `<CreateBountyForm>` with `initialBounty` + `readOnlyMode`. DRAFT + unpaid bounties chain straight into Stitch hosted checkout on Submit (mirroring the new-bounty flow). <!-- historical -->

## Entry & exit
- **Reached from:** `/business/bounties/{id}` (Edit action), `/business/bounties` (Edit icon).
- **Links out to:** `/business/bounties/{id}` (Save Draft, readonly save, fund-failure fallback); Stitch hosted checkout (DRAFT unpaid path). <!-- historical -->

## Data
- **React Query hooks:** `useBounty(id)`, `useUpdateBounty(id)`, `useAuth`.
- **API endpoints called:** `GET /api/v1/bounties/:id`, `PATCH /api/v1/bounties/:id`, `POST /api/v1/bounties/:id/fund` (DRAFT unpaid path only).
- **URL params:** `id`
- **Search params:** none

## UI structure
- `PageHeader` with breadcrumbs (Bounties / bounty title / Edit).
- Contextual banner at top:
  - LIVE: warning banner — "Only eligibility rules, proof requirements, max submissions, and end date can be edited."
  - PAUSED: info banner with Revert-to-draft shortcut.
  - DRAFT: no banner.
- `<CreateBountyForm initialBounty={bounty} readOnlyMode={isLive ? 'live' : isPaused ? 'paused' : undefined} ... />` — the same form component; `readOnlyMode` locks non-editable fields.

## States
- **Loading:** `<LoadingState type="form" />`
- **Empty:** `return null` when `bounty` is falsy.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Saving draft:** button spinner; toast success → detail page.
- **Saving submit:** button spinner; DRAFT+unpaid → `fundBounty` + redirect; else toast + detail page.
- **Fund failure:** toast ("Saved, but couldn't start payment"), navigate to detail page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save Draft | `updateBounty.mutate` → detail page | DRAFT preserved. |
| Save Changes / Go Live | `updateBounty.mutate` + DRAFT unpaid → fund | Detail page (LIVE+) or Stitch hosted checkout (DRAFT unpaid). | <!-- historical -->
| Revert to draft (banner shortcut, PAUSED) | `router.push` | `/business/bounties/{id}` (user then clicks the actual revert button). |

## Business rules
- **Edit constraints by status:**
  - DRAFT: full edit.
  - LIVE: `readOnlyMode='live'` — only eligibility, proof requirements, max submissions, end date editable (backend enforces; UI mirrors via `readOnlyMode`).
  - PAUSED: `readOnlyMode='paused'` — most fields locked; revert to draft for full edits.
  - CLOSED: page still loads but all edits rejected server-side.
- **DRAFT→LIVE funding gate** same as `/business/bounties/new` — DRAFT + unpaid Submit kicks the hosted-checkout flow.
- Brand-asset uploads and deletes are separate endpoints — handled inside `CreateBountyForm` (not visible here).

## Edge cases
- Bounty ID mismatch / deleted bounty: `useBounty` errors → `ErrorState`.
- LIVE bounty + field locked: form won't send locked fields (component-level); backend would reject regardless.
- Concurrent editors: last-write-wins at the DB level (no optimistic locking exposed).
- KYB not approved: fund call fails at the funding step; bounty still saved.

## Tests
None colocated. `CreateBountyForm` behaviour covered in `components/bounty-form/**/*.test.ts(x)`.

## Related files
- `components/bounty-form/` (`CreateBountyForm`, reducer)
- `hooks/useBounties.ts` (`useBounty`, `useUpdateBounty`)
- `lib/api/bounties.ts`
- `lib/utils/redirect-to-hosted-checkout.ts`

## Open questions / TODOs
- `readOnlyMode` prop is a local string literal (`'live' | 'paused'`), not a shared type — keep colocated.
