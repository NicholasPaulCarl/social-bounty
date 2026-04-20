# Apply to Bounty — `/bounties/[id]/apply`

**Route path:** `/bounties/[id]/apply`
**File:** `apps/web/src/app/(participant)/bounties/[id]/apply/page.tsx`
**Role:** PARTICIPANT (any authenticated user allowed by guard; CLOSED-bounty gate applied at page level).
**Access:** `AuthGuard`; if bounty is not CLOSED, `router.replace('/bounties/:id')` fires.
**Nav entry:** Deep-link only — reached from `/bounties/:id` "Apply to hunt" CTA.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Submit a short optional application message to request access to a CLOSED bounty. On success, routes back to detail where the pending-application banner renders.

## Entry & exit
- **Reached from:** `/bounties/:id` Apply CTA.
- **Links out to:** `/bounties/:id` (cancel button, post-success redirect).

## Data
- **React Query hooks:** `useBounty(id)`, `useApplyToBounty(id)`, `useToast()`.
- **API endpoints called:** `POST /bounty-access/applications` (payload: `{ bountyId, message? }`).
- **URL params:** `id` — bounty UUID.
- **Search params:** None.

## UI structure
- `PageHeader` "Apply to hunt" with breadcrumb (`Bounties > {title} > Apply`).
- Centered `max-w-2xl` column.
- Bounty summary card: Lock icon (warning tint), title, line-clamped short description.
- Application form card:
  - Heading "Your application" + supporting copy.
  - Textarea `InputTextarea` (optional, 500 chars max), live "X characters remaining" with warning color at <50.
  - Inline `Message severity="error"` for `submitError`.
  - Cancel (outlined) + Submit buttons right-aligned.

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A.
- **Error:** `ErrorState` if bounty fetch fails; inline `Message` on submit failure.
- **Success:** Toast "Application dropped!" + `router.push('/bounties/:id')`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push('/bounties/:id')` | Back to detail |
| Submit | `applyMutation.mutateAsync({ message })` | POST + success redirect |

## Business rules
- Only renders for `BountyAccessType.CLOSED` — PUBLIC bounties auto-redirect (page-level guard).
- Message is optional (`message.trim() || undefined`).
- `MAX_MESSAGE_LENGTH = 500` enforced client-side.
- API enforces dedupe (single application per user per bounty).

## Edge cases
- Bounty is PUBLIC → immediate `router.replace` back to detail.
- Bounty 404 → `ErrorState`.
- Submit while already pending → API returns conflict (`ApiError` surfaces via toast + inline `Message`).
- Message > max length → inline validation blocks submit.

## Tests
No colocated tests.

## Related files
- `@/hooks/useBountyAccess` — `useApplyToBounty` + related access hooks
- `@/lib/api/client` — `ApiError`
- `BountyAccessType` (shared enum)

## Open questions / TODOs
- No draft persistence — refresh loses the message.
