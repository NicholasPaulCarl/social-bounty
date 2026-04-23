# `BrandsService`

> Brand aggregate CRUD — create, update (with logo upload), KYB submission, member invitations, public-profile reads.

## What it does

`BrandsService` manages the `Brand` aggregate — the top-level tenant row for the BUSINESS_ADMIN role. `.create(user, dto, logoFile?)` creates a brand with handle uniqueness check, uploads the logo to the configured asset store, and creates the initial `BrandMember` row linking the creating user with `BrandMemberRole.OWNER`. `.update(id, dto, logoFile?)` handles the full edit surface (name, handle, description, website, social links, brand color, logo swap). `.getById(id)`, `.getByHandle(handle)` (the public-profile read path). `.listMembers(id)`, `.inviteMember(brandId, dto)` (sends invitation email + creates `BrandInvitation` row), `.acceptInvitation(token)`, `.removeMember(brandId, memberUserId)`. `.submitKyb(brandId, dto, documents[])` uploads KYB documents and transitions `KybStatus.NOT_SUBMITTED → PENDING_REVIEW`.

## Why it exists

The Organisation→Brand rename (commits `539467e`, `8e4c21f`, `c055b2a`, `55cb3b8`, `cb388a2`) renamed this service in-place from `OrganisationsService` → `BrandsService`. The rename preserved DB table/column names (`Prisma @map`/`@@map` directives at 8 sites) to avoid a migration, and kept the JWT compat shim at `jwt.strategy.ts:11,41-42` + `auth.service.ts:428-430` (commit `8c50d38`) so existing sessions keep working. The public-profile read (`.getByHandle`) serves the `/brands/[handle]` and `/hunters/[handle]` routes — those pages are unauthenticated and consume this endpoint via a cache-friendly path.

## How it connects

- **`BrandsController`** — the HTTP shell forwarding `POST /brands` (create), `GET /brands/:id`, `PATCH /brands/:id` (update), `GET /brands/handle/:handle` (public-profile read), member-management endpoints, and KYB submission.
- **`useBrand.ts` (web)** — the TanStack Query hook bundle consuming this service's endpoints.
- **`AuditService.log`** — every create/update/member-invite/KYB-submit audits.
- **`MailService.sendBrandInvitationEmail`** — sends the invitation email on `.inviteMember()`.
- **`BrandStatus`, `KybStatus`, `BrandMemberRole` (shared enums)** — the state-machine enum set.
- **`BRAND_PROFILE_LIMITS`, `BRAND_ASSET_LIMITS` (shared)** — caps for name, description, logo size.
- **`AdminService.createBrand`** — the SUPER_ADMIN manual brand-creation path that delegates to this service with a `force: true` flag.
- **`SubscriptionsService`** — brand subscription is a separate entity type (`SubscriptionEntityType.ORG`), referenced here during brand creation for default-tier wiring.

---
**degree:** 16 • **community:** "User & brand profile services" (ID 11) • **source:** `apps/api/src/modules/brands/brands.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the Prisma `@map` directive preserving `organisations`/`organisation_members` table names is a deliberate tradeoff — avoids a destructive migration but means DB-level introspection still shows the old names. If/when a full rename becomes worthwhile, it's a one-migration event with a clear rollback (map removal).
