# `BUSINESS_ADMIN` role

> The brand-operator tier — creates bounties, funds them, reviews submissions, manages brand members.

## What it does

`BUSINESS_ADMIN` is the middle tier in the `UserRole` enum (between `PARTICIPANT` and `SUPER_ADMIN`). A user with this role is associated with exactly one `BrandMember` row that carries their `brandId` (or multiple rows across brands via the multi-brand JWT claim). Within the scope of their brand(s), they can: create/edit bounties (DRAFT only), fund bounties via Stitch hosted checkout, review submissions (`SubmissionStatus.PENDING` → `APPROVED` / `REJECTED` / `NEEDS_MORE_INFO`), manage brand members (invite, suspend), submit KYB documents, view brand-scoped disputes, and access the bounty performance dashboard. The role is checked both at the NestJS controller level (`@Roles(UserRole.BUSINESS_ADMIN)` on `BountiesController`, `SubmissionsController`'s review endpoints, `DisputesController.listForBrand`) and at the Next.js layout level (`AuthGuard allowedRoles={[UserRole.BUSINESS_ADMIN]}` in `apps/web/src/app/business/layout.tsx`).

## Why it exists

Hard Rule #2 requires role gating on every screen and API endpoint; BUSINESS_ADMIN is the role that scopes access to brand-owned resources. The multi-brand JWT pattern (commit `8c50d38`) allows a BUSINESS_ADMIN to carry multiple `BrandMember` claims and switch-brand via the concept_switch_brand flow. Every controller method that mutates a `Bounty`, `Submission`, or `BrandMember` validates `bounty.brandId === user.brandId` or `assertBrandAdmin(bounty, user)` inside the service layer — the role by itself is insufficient; resource ownership must also match (defence-in-depth per audit batch 13A).

## How it connects

- **`SUPER_ADMIN` role** — the sibling tier one level up; a superset of BUSINESS_ADMIN permissions.
- **`AuthGuard business/layout` concept** — the Next.js layout-guard pattern at `apps/web/src/app/business/layout.tsx` gating the whole `/business/*` surface.
- **`BountiesController`, `DisputesController`, `SubmissionsController`** — all three have `@Roles(BUSINESS_ADMIN)` decorators on mutation endpoints that scope to the caller's brand.
- **`BrandsService.getBrand(brandId)`, `.updateBrand()`, `.inviteMember()`** — the brand-management surface; BUSINESS_ADMIN is the primary actor.
- **`BountyAccessService`** — enforces BUSINESS_ADMIN scoping on applications/invitations for CLOSED bounties.
- **Page specs for `/business/*`** — the ~30 business-surface route specs document `Role: BUSINESS_ADMIN` in their header blocks.
- **`switchBrand` concept** — the mechanism by which a BUSINESS_ADMIN with multiple BrandMember rows picks which brand context to operate in.

The degree of 24 is close to SUPER_ADMIN's 36 — BUSINESS_ADMIN is the primary user of ~2/3 of the surface that SUPER_ADMIN can also access.

---
**degree:** 24 • **community:** "Page spec documentation" (ID 5) • **source:** `md-files/page-spec/` (referenced across enums + decorators + layouts)

> **Architectural note:** the multi-brand JWT pattern is the non-obvious bit here. A BUSINESS_ADMIN can be a member of multiple brands and toggles between them client-side via `switchBrand`; the JWT carries the active `brandId`. Worth reading the shim at `jwt.strategy.ts:11,41-42` + `auth.service.ts:428-430` if debugging a "I don't see my bounty" report from a multi-brand user.
