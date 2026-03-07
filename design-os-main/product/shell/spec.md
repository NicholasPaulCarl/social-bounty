# Application Shell Specification

## Overview
Social Bounty uses a collapsible sidebar navigation that adapts to the user's role. The sidebar can toggle between full-width (with labels) and icon-only mode, giving users more content space when needed. Navigation items are filtered based on the current user's role (Participant, Business Admin, Super Admin).

## Navigation Structure
- **Bounty Marketplace** → Browse and discover available bounties (Participant, Super Admin)
- **My Submissions** → Track submissions, statuses, and earnings (Participant, Super Admin)
- **Bounty Management** → Create and manage bounties (Business Admin, Super Admin)
- **Review Center** → Review submissions, approve/reject, track payouts (Business Admin, Super Admin)
- **Admin Panel** → User management, audit logs, system health (Super Admin only)

## User Menu
Pinned to the bottom of the sidebar. Displays the user's avatar (initials fallback), name (hidden when collapsed), and a dropdown with:
- Profile / Settings
- Logout

## Layout Pattern
Collapsible sidebar on the left, main content area on the right. The sidebar has:
- Logo/brand at the top
- Role-filtered navigation items in the middle
- User menu pinned to the bottom
- Collapse/expand toggle button

## Default Landing View
- Participant → Bounty Marketplace
- Business Admin → Bounty Management
- Super Admin → Admin Panel

## Responsive Behavior
- **Desktop (lg+):** Full sidebar with labels, collapsible to icon-only via toggle
- **Tablet (md):** Icon-only sidebar by default, expandable on hover or toggle
- **Mobile (sm):** Sidebar hidden, hamburger menu in a top bar triggers a slide-over overlay

## Design Notes
- Primary color (pink) used for active nav item indicator and hover states
- Secondary color (blue) used for notification badges and counts
- Neutral color (slate) for sidebar background and text
- Space Grotesk for nav labels, Inter for secondary text
- Smooth transition animation when collapsing/expanding (200ms)
- Dark mode: sidebar uses slate-900 background, slate-100 text
