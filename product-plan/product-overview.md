# Social Bounty — Product Overview

## Summary

Social Bounty is a task marketplace where businesses post bounties with rewards and real people complete them with verifiable proof. It brings accountability, structured review, and transparent payout tracking to the gig-task economy.

## Planned Sections

1. **Bounty Marketplace** — The participant-facing browse and search experience where users discover available bounties, filter by category or reward, and claim tasks to work on.
2. **My Submissions** — A personal dashboard where participants track their active and past submissions, see review status, respond to "Needs More Info" requests, and monitor their earnings.
3. **Bounty Management** — The business admin workspace for creating, editing, and managing bounties through their full lifecycle (Draft, Live, Paused, Closed), including setting rewards and requirements.
4. **Review Center** — Where business admins review incoming submissions, examine proof-of-completion, approve or reject work, request additional information, and track payout status for approved submissions.
5. **Admin Panel** — The super admin control center for platform-wide user management, organization oversight, submission overrides, audit log review, system health monitoring, and simple reporting.

## Product Entities

- **User** — A person who uses the platform with role-based access (Participant, Business Admin, Super Admin)
- **Organization** — A business or company that creates and manages bounties
- **OrganizationMember** — Membership link between User and Organization with role
- **Bounty** — A task posted by an organization with reward, requirements, and deadline (Draft → Live → Paused → Closed)
- **Submission** — A participant's completed work with structured proof (Submitted → In Review → Needs More Info → Approved → Rejected)
- **Payout** — Payment tracking for approved submissions (Not Paid → Pending → Paid)
- **FileUpload** — Files attached to submissions as proof-of-completion
- **AuditLog** — Timestamped record of admin actions for accountability

## Design System

**Colors:**
- Primary: pink — buttons, links, key accents
- Secondary: blue — tags, highlights, secondary elements
- Neutral: slate — backgrounds, text, borders

**Typography:**
- Heading: Space Grotesk
- Body: Inter
- Mono: Source Code Pro

## Implementation Sequence

Build this product in milestones:

1. **Shell** — Set up design tokens and application shell (collapsible sidebar navigation)
2. **Bounty Marketplace** — Participant browse/search, bounty details, submit proof
3. **My Submissions** — Personal submission tracking, earnings, inline resubmit
4. **Bounty Management** — Business admin bounty CRUD, lifecycle management
5. **Review Center** — Submission review queue, approve/reject/need info, payouts
6. **Admin Panel** — Super admin user/org management, audit logs, troubleshooting

Each milestone has a dedicated instruction document in `instructions/`.
