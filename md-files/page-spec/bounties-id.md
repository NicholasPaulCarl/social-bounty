# Bounty Detail — `/bounties/[id]`

**Route path:** `/bounties/[id]`
**File:** `apps/web/src/app/(participant)/bounties/[id]/page.tsx`
**Role:** Any authenticated role (participant-targeted actions gated on `user.role === 'PARTICIPANT'`).
**Access:** `AuthGuard` via participant layout; bounty access-type (PUBLIC/CLOSED) additionally gates submit/apply CTAs.
**Nav entry:** Reached from `/bounties` cards, email links, invitations.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Full bounty detail: overview, channels, reward, payment method, engagement rules, post-visibility terms, brand assets, and the auto-verification preview panel. Primary CTA is submission or application depending on access-type + state.

## Entry & exit
- **Reached from:** `/bounties` card, email deep-link, invitation banner.
- **Links out to:** `/bounties/:id/apply` (CLOSED, no application yet), `/bounties/:id/submit` (access granted), `/bounties` (breadcrumb).

## Data
- **React Query hooks:** `useBounty(id)`, `useAuth()`, `useMyApplication(id)`, `useMyInvitations()`, `useWithdrawApplication(id)`, `useAcceptInvitation()`, `useDeclineInvitation()`, `useToast()`.
- **API endpoints called:** `GET /bounties/:id`, `GET /bounty-access/applications/mine/:bountyId`, `GET /bounty-access/invitations/mine`, `POST /bounty-access/applications/:id/withdraw`, `POST /bounty-access/invitations/:id/accept|decline`.
- **URL params:** `id` — bounty UUID.
- **Search params:** None.

## UI structure
- `PageHeader` with breadcrumb trail, title, and dynamic CTA from `renderAccessCTA()`.
- Status banners: PAUSED warn, CLOSED info, pending invitation (warning/Mail), pending application (warning/Clock + Withdraw), rejected application (danger/XCircle with review note).
- Two-column grid (lg:grid-cols-3):
  - Main (2-span): Overview card (status + access-type badge + description + `fullInstructions` + `proofRequirements` bullets + eligibility), Channels card (per-channel format pills), Post visibility rule card, `VerificationReportPanel` (preview mode, `audience="hunter"`, derived via `derivePreviewChecks`).
  - Sidebar: Reward card (rewards array OR legacy single reward), Payment method card (maps `bounty.payoutMethod`), Details card (start/end dates + `timeRemaining` + submission counter + AI-content flag), Engagement card (tag/mention/comment bullets), Brand assets card (filenames + sizes + Download).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** Not applicable — 404 surfaces as `ErrorState`.
- **Error:** `ErrorState error onRetry`.
- **Success:** Card grid renders; CTA derived from role/status/access-type/application/invitation state.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Submit proof (PUBLIC live, canSubmit) | `router.push('/bounties/:id/submit')` | Proof form |
| Apply to hunt (CLOSED, no app/invite) | `router.push('/bounties/:id/apply')` | Application form |
| Submit proof (CLOSED, approved/accepted) | `router.push('/bounties/:id/submit')` | Proof form |
| Accept invitation | `acceptMutation.mutateAsync(id)` | Success toast |
| Decline invitation | `declineMutation.mutateAsync(id)` | Success toast |
| Withdraw application | `withdrawMutation.mutateAsync()` | Success toast |
| Download brand asset | Opens `${API_URL}/files/brand-assets/:id/download` | New tab |

## Business rules
- `canSubmit = isLive && isParticipant && (no maxSubmissions OR submissionCount < max) && (PUBLIC OR closedAccessGranted)`.
- `closedAccessGranted = APPROVED application OR ACCEPTED invitation`.
- Invitation takes precedence over application.
- PUBLIC bounties auto-redirect `/apply` back to detail (checked in apply page).
- All CTA logic confined to `renderAccessCTA()` — single source of truth.

## Edge cases
- Bounty 404 → `ErrorState`.
- Non-PARTICIPANT (e.g. BRAND_ADMIN viewing) → no CTA renders but full detail is visible.
- Bounty CLOSED or PAUSED → banners surface; no CTA.
- Max submissions reached → no CTA.
- Invitation PENDING → banner shows Accept/Decline; no CTA in header.
- Application REJECTED → banner shows review note; no CTA.

## Tests
No colocated tests.

## Related files
- `@/components/features/submission/VerificationReportPanel` — previews auto-verification rules to hunters
- `@/lib/utils/bounty-preview-checks` — pure `derivePreviewChecks(bounty)`
- `@/lib/utils/format` — `formatCurrency`, `formatDate`, `timeRemaining`, `formatEnumLabel`, `formatBytes`
- `@/components/common/StatusBadge` — status/access-type/role chips
- Local `PayoutMethod` enum at top (until shared exports it)

## Open questions / TODOs
- Local `PayoutMethod` enum noted as temporary until `@social-bounty/shared` exports it.
- `proofRequirements` rendering has a hardcoded whitelist of string values (`'url' | 'screenshot' | ...`) — fragile if more values land.
