# AdminService

> God node · 22 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`

**Community:** [[Auth & settings admin]]

## Summary

`AdminService` is the SUPER_ADMIN command-plane for the non-financial half of the platform: users, brands, submissions, audit logs, system settings, and system-health surfaces. It owns list + detail methods for users (`.listUsers()`, `.getUserDetail()`), brands (`.listBrands()`, `.getBrandDetail()`, `.createBrand()`), and submissions (`.listSubmissions()`); status mutations (`.updateUserStatus()`, `.updateBrandStatus()`); the two override escape hatches (`.overrideBounty()`, `.overrideSubmission()`); settings read/write (`.getSettings()`, `.updateSettings()`, plus the feature-flag helpers `.isSignupEnabled()` + `.isSubmissionEnabled()`); and the dashboard + health telemetry (`.getDashboard()`, `.recordError()`, `.getRecentErrors()`, `.getSystemHealth()`).

It exists because Hard Rule #2 (RBAC mandatory) and #3 (audit logs required) mean every admin touchpoint must route through a single service that writes to `AuditService` in the same transaction. Unlike `FinanceAdminService` (its counterpart in `Finance admin dashboard` community), `AdminService` never posts to the ledger — financial overrides live next door, and `.overrideBounty()` here only mutates bounty state, not money. Its upstream dependencies are the usual suspects: `PrismaService`, `AuditService`, `MailService` (status-change notifications), and `SettingsService` (kill-switch and signup-flag read path). `.getDashboard()` was collapsed from 23 parallel `count()` calls to 6 `groupBy` queries in commit `6e110ca` (~100ms → ~30ms).

## Connections by Relation

### contains
- [[admin.service.ts]] `EXTRACTED`

### method
- [[.getUserDetail()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.overrideBounty()]] `EXTRACTED`
- [[.getBrandDetail()]] `EXTRACTED`
- [[.updateBrandStatus()]] `EXTRACTED`
- [[.isSignupEnabled()]] `EXTRACTED`
- [[.updateSettings()]] `EXTRACTED`
- [[.updateUserStatus()]] `EXTRACTED`
- [[.overrideSubmission()]] `EXTRACTED`
- [[.isSubmissionEnabled()]] `EXTRACTED`
- [[.getSettings()]] `EXTRACTED`
- [[.createBrand()]] `EXTRACTED`
- [[.listUsers()]] `EXTRACTED`
- [[.listBrands()]] `EXTRACTED`
- [[.listSubmissions()]] `EXTRACTED`
- [[.listAuditLogs()]] `EXTRACTED`
- [[.getAuditLog()]] `EXTRACTED`
- [[.getDashboard()]] `EXTRACTED`
- [[.recordError()]] `EXTRACTED`
- [[.getRecentErrors()]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*