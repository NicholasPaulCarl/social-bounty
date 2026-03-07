# Admin Panel

## Overview

The super admin control center for platform-wide oversight. Single-page tabbed interface with Dashboard, Users, Organizations, Oversight, Audit Logs, and Troubleshooting. Every destructive action requires a confirmation dialog and is audit-logged.

## User Flows

- View dashboard with platform stats, recent activity, system health
- Search/filter users, suspend/reinstate/force password reset
- Search/filter orgs, suspend/reinstate
- Browse all bounties and submissions, override submission status
- View searchable/filterable audit logs
- View system errors, health checks, toggle kill switches
- Full-page user and org detail views

## Components

- `AdminPanel` — Main tabbed container
- `DashboardTab`, `UsersTab`, `OrganizationsTab`, `OversightTab`, `AuditLogsTab`, `TroubleshootingTab` — Tab content
- `UserDetail` — Full-page user view
- `OrgDetail` — Full-page org view
- `ConfirmationDialog` — Reusable confirmation modal
- `StatusBadges` — All admin status badges

## Callback Props

| Callback | Triggered When |
|----------|---------------|
| `onViewUser` | View user detail |
| `onSuspendUser` | Suspend user (with reason) |
| `onReinstateUser` | Reinstate user |
| `onForcePasswordReset` | Force password reset |
| `onViewOrg` | View org detail |
| `onSuspendOrg` | Suspend org (with reason) |
| `onReinstateOrg` | Reinstate org |
| `onOverrideSubmission` | Override submission status |
| `onToggleKillSwitch` | Toggle kill switch |

## Visual Reference

See screenshots in this folder for the target UI design.
