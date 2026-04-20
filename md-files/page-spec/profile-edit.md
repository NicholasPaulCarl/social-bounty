# Edit Profile — `/profile/edit`

**Route path:** `/profile/edit`
**File:** `apps/web/src/app/(participant)/profile/edit/page.tsx`
**Role:** Any authenticated role.
**Access:** `AuthGuard` via participant layout.
**Nav entry:** From `/profile` Edit action, profile completion CTA, or post-signup welcome redirect (`?welcome=true`).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Single editable form covering profile picture, basic info (first/last name), bio, interests, and social links. Saves all sections on Save. Handles welcome-mode banner and post-save redirect.

## Entry & exit
- **Reached from:** `/profile` Edit CTA, welcome redirect.
- **Links out to:** `/profile` (Back/Cancel/welcome-post-save).

## Data
- **React Query hooks:** `useProfile()`, `useUpdateProfile()`, `useUploadProfilePicture()`, `useDeleteProfilePicture()`, `useSocialLinks()`, `useUpsertSocialLink()`, `useDeleteSocialLink()`, `useToast()`, `useSearchParams()`.
- **API endpoints called:** `GET /profile`, `PATCH /profile`, `POST /profile/picture` (multipart), `DELETE /profile/picture`, `GET /profile/social-links`, `POST /profile/social-links` (upsert), `DELETE /profile/social-links/:id`.
- **URL params:** None.
- **Search params:** `welcome=true` triggers welcome banner + redirect to `/profile` on save.

## UI structure
- `PageHeader` "Edit profile" + Back button.
- Welcome banner when `?welcome=true`.
- Cards in order:
  1. Profile picture card — avatar/initials + Upload + Remove, accepting JPEG/PNG/GIF/WebP up to `PROFILE_LIMITS.PROFILE_PICTURE_MAX_SIZE` (2 MB).
  2. Basic info card — First name + Last name (grid).
  3. Bio card — textarea with char count / `PROFILE_LIMITS.BIO_MAX`.
  4. Interests card — `HUNTER_INTERESTS` chips (toggle buttons).
  5. Social links card — one `<SocialLinkInput>` per entry, "Add link" button with dropdown of remaining platforms (Instagram/TikTok/Facebook).
- Footer: Save + Cancel (Cancel = `Link to /profile`).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A.
- **Error:** `ErrorState` on initial fetch; toasts on mutation failures.
- **Success:** Toast "Profile locked in." and (welcome-mode) `router.push('/profile')`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Upload picture | `uploadPicture.mutateAsync(file)` | Uploads new picture |
| Remove picture | `deletePicture.mutateAsync()` | Removes |
| Toggle interest | `toggleInterest(val)` | Local state |
| Add link | `addSocialLink(platform)` | Appends empty row |
| Remove link | `removeSocialLink(idx)` | Calls delete-link if persisted, then splices |
| Save | `handleSave()` — updates profile then upserts each social link in parallel | Toast + optional redirect |
| Cancel | `Link href="/profile"` | Back |

## Business rules
- Picture upload validates size + MIME client-side against `PROFILE_LIMITS.PROFILE_PICTURE_MAX_SIZE` + `PROFILE_PICTURE_MIME_TYPES`.
- Bio strictly capped at `PROFILE_LIMITS.BIO_MAX` via `onChange` length gate.
- Each platform can have at most one social link (dropdown filters out used platforms).
- Social link removal is optimistic: deletes via mutation (swallowed on error), then splices from local state regardless.
- On save, social links parallel-upserted via `Promise.all` — partial success not detected (UI reports success if no throw).

## Edge cases
- Profile fetch error → `ErrorState` (whole page).
- Same file re-selected → `input.value = ''` reset enables re-upload.
- Unhandled save failure → toast error, local state preserved.
- Welcome flag without completing → normal save stays on edit page (no auto-redirect).

## Tests
No colocated tests.

## Related files
- `@/hooks/useProfile` — all six mutation hooks
- `@/components/features/profile/SocialLinkInput`
- `@/lib/api/client` — `getUploadUrl`, `ApiError`
- Shared: `HUNTER_INTERESTS`, `PROFILE_LIMITS`, `SocialChannel`, `SocialLinkResponse`

## Open questions / TODOs
- No "dirty state" guard on navigate-away; unsaved changes can be lost silently.
- Instagram/Facebook icons are neutral `Link2` fallbacks per DS ICONS.md (Lucide 1.8 trademark policy).
- Partial save success is not surfaced if one social link upsert fails.
