# Bounty Invitations — `/business/bounties/[id]/invitations`

**Route path:** `/business/bounties/[id]/invitations`
**File:** `apps/web/src/app/business/bounties/[id]/invitations/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only.
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Invite specific hunters (by social-handle) to a CLOSED bounty; view pending / responded / expired invitations.

## Entry & exit
- **Reached from:** Bounty detail page (CLOSED access).
- **Links out to:** `/business/bounties/{id}`.

## Data
- **React Query:** raw `useQuery` with `queryKeys.bountyAccess.invitations(bountyId)` → `bountyAccessApi.listInvitations`; raw `useMutation` for create.
- **API endpoints called:** `GET /api/v1/bounties/:bountyId/invitations`, `POST /api/v1/bounties/:bountyId/invitations`. (`DELETE /api/v1/bounties/:bountyId/invitations/:id` not wired — see TODOs.)
- **URL params:** `id`
- **Search params:** none

## UI structure
- `PageHeader` — Invitations, breadcrumbs.
- Inline add-invite form in `glass-card`: Platform Dropdown (X / Instagram / Facebook / TikTok), handle InputText (strips leading `@`), Send invite button. Enter key submits.
- Invitations list grouped into Pending / Responded via `glass-card` with per-platform colour chip, status tag, invited date, revoke button (PENDING only — currently surfaces a "not yet supported" toast).
- `ConfirmAction` revoke dialog (currently no-op).

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** Inline "No invitations sent yet" panel (Mail icon).
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** grouped list.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Send invite | POST `/invitations` | Notifies target via their linked social handle; hunter accepts/declines on `/invitations/my`. |
| Revoke (PENDING only) | Shows "not yet supported" error | No backend call — see TODOs. |

## Business rules
- **`BountyAccessType.CLOSED`** only. PUBLIC bounties don't use invitations.
- Subscription tier: CLOSED-bounty creation requires Pro.
- Invitation status machine: PENDING → ACCEPTED / DECLINED / EXPIRED. Only PENDING shows the Revoke button.
- Hunter match is done server-side via `UserSocialHandle` lookup; unmatched invitations stay unlinked (`inv.userName` absent).

## Edge cases
- Handle stripped of leading `@` before send.
- Invite sent to a handle the hunter hasn't linked yet: invitation created, no user match until the hunter links the handle.
- Duplicate invitation (same platform+handle): backend may deduplicate; UI doesn't pre-check.
- No toast on empty submit — inline `formError` shown.

## Tests
None colocated.

## Related files
- `lib/api/bounty-access.ts` (`bountyAccessApi.listInvitations`, `createInvitations`)
- `lib/query-keys.ts`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `ConfirmAction.tsx`

## Open questions / TODOs
- Revoke API exists (`DELETE /api/v1/bounties/:bountyId/invitations/:id` per sitemap §bounty-access) but UI hard-codes "Revoke is not yet supported by the API" — wiring work pending.
- In-file `STATUS_CONFIG` / `PLATFORM_COLORS` are bespoke; `StatusBadge` component doesn't yet cover invitation status natively.
