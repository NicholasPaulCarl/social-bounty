# Application Shell

## Overview

Social Bounty uses a collapsible sidebar navigation that adapts to the user's role. The sidebar toggles between full-width (with labels) and icon-only mode.

## Navigation Structure

- **Bounty Marketplace** — Browse bounties (Participant, Super Admin)
- **My Submissions** — Track submissions and earnings (Participant, Super Admin)
- **Bounty Management** — Create and manage bounties (Business Admin, Super Admin)
- **Review Center** — Review submissions (Business Admin, Super Admin)
- **Admin Panel** — Platform oversight (Super Admin only)

## Components

- `AppShell.tsx` — Main layout wrapper with sidebar and mobile overlay
- `MainNav.tsx` — Navigation items with active indicator and badges
- `UserMenu.tsx` — User avatar, name, and dropdown (Settings, Logout)

## Props

**AppShell:**
- `children` — Page content
- `navigationItems` — Array of `{ label, href, icon, isActive?, badge? }`
- `user` — `{ name, avatarUrl?, role? }`
- `productName` — Brand name (default: "Social Bounty")
- `onNavigate` — Route handler
- `onLogout`, `onSettings` — User actions

## Responsive Behavior

- **Desktop (lg+):** Full sidebar, collapsible to icon-only
- **Mobile:** Hidden sidebar, hamburger menu triggers slide-over overlay

## Design Notes

- Pink accent for active nav indicator
- Blue for notification badges
- Slate for sidebar chrome
- Space Grotesk for nav labels
