# Milestone 1: Shell

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps all sections.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

**Colors:** pink (primary), blue (secondary), slate (neutral)
**Fonts:** Space Grotesk (headings), Inter (body), Source Code Pro (mono)

### 2. Application Shell

Copy the shell components from `product-plan/shell/components/`:

- `AppShell.tsx` — Main layout wrapper with collapsible sidebar and mobile overlay
- `MainNav.tsx` — Navigation component with active indicator and notification badges
- `UserMenu.tsx` — User menu with avatar, settings, and logout

**Wire Up Navigation:**

| Route | Label | Roles |
|-------|-------|-------|
| `/marketplace` | Bounty Marketplace | Participant, Super Admin |
| `/my-submissions` | My Submissions | Participant, Super Admin |
| `/bounty-management` | Bounty Management | Business Admin, Super Admin |
| `/review-center` | Review Center | Business Admin, Super Admin |
| `/admin` | Admin Panel | Super Admin |

**User Menu:**

The user menu expects:
- User name
- Avatar URL (optional, falls back to initials)
- Role (optional, displayed below name)
- Logout callback
- Settings callback

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts)
- [ ] Shell renders with collapsible sidebar navigation
- [ ] Navigation items are role-filtered and route correctly
- [ ] User menu shows user info with dropdown
- [ ] Mobile responsive: hamburger menu with slide-over
- [ ] Dark mode works correctly
