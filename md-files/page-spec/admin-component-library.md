# Component library — `/admin/component-library`

**Route path:** `/admin/component-library`
**File:** `apps/web/src/app/admin/component-library/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** System → Component Library (with child hashes #brand, #design-tokens, #atoms, #molecules, #organisms, #form-sections, #primereact)
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `apps/web/src/styles/design-system/README.md` + `SKILL.md` (canonical Claude Design handoff bundle, 2026-04-18), CLAUDE.md (design system lives at `apps/web/src/styles/design-system/`).

## Purpose
**Internal-facing** design-system reference for team + Claude agents. Shows the canonical tokens + atoms/molecules/organisms + form sections + PrimeReact primitives mapped to the Claude Design handoff bundle. Lives behind the admin guard because it depends on the admin shell layout.

## Entry & exit
- **Reached from:** admin sidebar → Component Library (plus the 7 child anchor links).
- **Links out to:** in-page anchors (`#brand`, `#design-tokens`, `#atoms`, `#molecules`, `#organisms`, `#form-sections`, `#primereact`).

## Data
- **React Query hooks:** none — all content is static (sourced from local fixtures + live components).
- **API endpoints called:** none.
- **URL params:** none.
- **Search params:** none (only the hash fragment).

## UI structure
- `PageHeader` breadcrumbs (Dashboard → Component library) + title "Component library" + subtitle "Social Bounty design system — canonical tokens + component reference".
- Two-column flex layout:
  - Left: `<LibrarySidebar activeSection={...}>` — active-section driven by `IntersectionObserver` (rootMargin `-20% 0px -60% 0px`).
  - Right: stacked sections — each with a Lucide icon header (pink-600) + body component:
    1. `#brand` — `<BrandSection>` (Star).
    2. `#design-tokens` — `<DesignTokensSection>` (Palette).
    3. `#atoms` — `<AtomsSection>` (Circle).
    4. `#molecules` — `<MoleculesSection>` (LayoutGrid).
    5. `#organisms` — `<OrganismsSection>` (Network).
    6. `#form-sections` — `<FormSectionsSection>` (List).
    7. `#primereact` — `<PrimeReactSection>` (Crown).

## States
- **Loading:** none (static).
- **Empty:** N/A.
- **Error:** N/A (no network).
- **Success:** always rendered.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Sidebar anchor click | scroll-into-view + update active section via IO | In-page scroll |

## Business rules
- RBAC: SUPER_ADMIN-only (incidental — it's an internal reference behind the admin shell).
- **No mutations** — pure read/reference surface.
- This page is the canonical renderer of the handoff CSS (`colors_and_type.css`, `components.css`) and the naming / token contract from `apps/web/src/styles/design-system/README.md`.

## Edge cases
- Mobile narrow view — sidebar collapses (LibrarySidebar handles responsive).
- Deep-link to a hash → observer may briefly highlight wrong section while scrolling; settles.
- Icon references are all Lucide (PrimeIcons fully removed across `apps/web/src` — CLAUDE.md migration note).
- `MOCK_BOUNTIES` in `OrganismsSection.tsx` had an `accessType: BountyAccessType.PUBLIC` fix land in commit `cdc0351` — relevant for showing BountyCard organism.

## Tests
Integration-only (visual regression would be a future add).

## Related files
- `apps/web/src/app/admin/component-library/_components/LibrarySidebar.tsx`.
- `apps/web/src/app/admin/component-library/_components/sections/` — per-section renderers.
- `apps/web/src/styles/design-system/` — canonical DS bundle.

## Open questions / TODOs
- No search across components.
- No dark-mode preview.
- No live edit / Figma cross-link (handoff docs are in-repo).
