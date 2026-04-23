# `BountyAccessService`

> Owns the CLOSED-bounty application/invitation flow — apply, accept, invite, revoke.

## What it does

`BountyAccessService` is the NestJS service managing the `BountyApplication` and `BountyInvitation` entities — the two tables that gate hunter access to CLOSED bounties. `.applyToBounty(userId, bountyId, dto)` lets a hunter apply to a `BountyAccessType.CLOSED` bounty (applications are meaningless for PUBLIC bounties, rejected with a `BadRequestException`); requires `bounty.status === LIVE`. `.approveApplication(applicationId, user)` transitions the application to `APPROVED` (BUSINESS_ADMIN only). `.rejectApplication(applicationId, user)`, `.inviteHunter(bountyId, userId, dto)`, `.acceptInvitation(invitationId, user)`, `.declineInvitation(invitationId, user)`, `.revokeInvitation(invitationId, user)`. Each mutation does three things: (1) RBAC via `assertBrandAdmin(bounty, user)`, (2) state check via `BountyApplicationStatus` / `BountyInvitationStatus`, (3) AuditLog emit.

## Why it exists

CLOSED bounties are a Pro-tier feature that lets brands work with a curated hunter pool. Without this service, the access model would collapse into a single `BountyAccessType.PUBLIC` — which is fine for some bounties but doesn't match the revenue model's Pro-tier feature set. The service's existence as a separate module (rather than methods on `BountiesService`) is deliberate: the application/invitation surface has its own state machine, its own audit-log actions (`BOUNTY_APPLICATION_APPROVED`, `BOUNTY_INVITATION_ACCEPTED`, etc.), and its own DTO set. Keeping it separate keeps `BountiesService` focused on the bounty lifecycle itself.

## How it connects

- **`BountiesService`** — checks `BountyAccessType` when serving the bounty detail; this service's methods are only reachable for CLOSED bounties.
- **`SubmissionsService.create`** — consults this service to confirm a hunter has an APPROVED application (or ACCEPTED invitation) before accepting a submission.
- **`AuditService.log`** — every mutation emits an audit row (Hard Rule #3).
- **`SubscriptionsService.isFeatureEnabled(CLOSED_BOUNTIES)`** — consulted upstream to gate creation of CLOSED bounties by Pro-tier only.
- **`BountyApplication`, `BountyInvitation` (Prisma entities)** — the rows this service writes.
- **`BountyAccessType`, `BountyApplicationStatus`, `BountyInvitationStatus` (shared enums)** — the state-machine types.
- **`BOUNTY_ACCESS_CONSTANTS` (shared)** — message-length caps, pagination defaults.
- **`/bounties/[id]/apply`, `/business/bounties/[id]/applications`, `/business/bounties/[id]/invitations` page.tsx** — the UI consumers.

---
**degree:** 16 • **community:** "Bounty access & mutation" (ID 15) • **source:** `apps/api/src/modules/bounty-access/bounty-access.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** `bounty-access.service.ts:528` (referenced in claude.md's `accessType` fix entry) has its own Prisma `select` clause — deliberately doesn't go through `BountiesService.findById`. If changing the `findById` response shape, double-check this service's query doesn't break silently.
