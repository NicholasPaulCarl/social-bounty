# Admin Panel Specification

## Overview
The Admin Panel is the super admin command center for full platform oversight and control. It provides a single-page interface with horizontal tabs for switching between Dashboard, User Management, Organisation Management, Bounty & Submission Oversight, Audit Logs, and Troubleshooting. Every action is audit-logged with actor, role, reason, and before/after state. Super admin accounts are created via database seeding only — never through the UI.

## User Flows
- View the Dashboard tab with at-a-glance counts (users, orgs, bounties by status, submissions by status, payouts by status), a recent activity feed of latest audit log entries, and a system health indicator
- Switch between tabs: Dashboard, Users, Organisations, Oversight, Audit Logs, Troubleshooting
- Search and filter users by email/ID, role (Participant, Business Admin), and status (Active, Suspended); view a user list with name, email, role, status, org, and join date
- Click a user row to navigate to a full-page user detail view showing their submissions and activity
- Suspend a user with a mandatory reason (confirmation dialog, audit logged)
- Reinstate a suspended user (confirmation dialog, audit logged)
- Force a user's password reset (confirmation dialog, audit logged)
- Search and filter organisations by name and status; view an org list with name, status, member count, bounty count, and contact email
- Click an org to navigate to a full-page org detail view showing members, bounties, and submissions
- Suspend an org with a mandatory reason (confirmation dialog, audit logged); suspension pauses all Live bounties, blocks new bounties and submissions, but allows existing submissions to still be reviewed
- Reinstate a suspended org (confirmation dialog, audit logged)
- Browse all bounties and submissions across all orgs in the Oversight tab; override a submission's status with a mandatory reason (audit logged with before/after state); view-only access to bounty details
- View searchable, filterable audit logs: timestamp, actor, role, action, entity type, entity ID, before/after state; filter by actor, action type, entity type, date range; sort by timestamp (newest first default); logs are immutable and read-only
- View the Troubleshooting tab with recent system errors, health check statuses (API, database, storage), and an optional global kill switch to disable new signups or submissions

## UI Requirements
- Single-page layout with horizontal tab navigation for all sub-sections
- Dashboard tab: stat cards for key counts (no charts), recent activity feed list, system health status indicator
- Users tab: searchable table with role and status filters, action buttons for suspend/reinstate/force reset
- Organisations tab: searchable table with status filter, action buttons for suspend/reinstate
- Oversight tab: bounty and submission browsers, submission status override with mandatory reason
- Audit Logs tab: searchable table with filters for actor, action type, entity type, and date range
- Troubleshooting tab: error log list, health check status cards, optional kill switch toggles
- Full-page detail views for user and org detail (navigate away from the tabbed view, with back button)
- All destructive actions require confirmation dialogs with mandatory reason where specified
- Colour-coded status badges for user status, org status, bounty status, submission status, payout status

## Configuration
- shell: true
