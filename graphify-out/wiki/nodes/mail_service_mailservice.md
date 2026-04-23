# `MailService`

> The single transactional-email dispatcher used for OTPs, state-change notifications, and post-visibility alerts.

## What it does

`MailService` is the NestJS service that wraps the configured email provider (SMTP or mock in dev) and renders Handlebars templates. It exposes one method per business-event type: `sendOtpEmail(to, otp)`, `sendWelcomeEmail`, `sendBrandInvitationEmail`, `sendSubmissionApprovedEmail`, `sendSubmissionRejectedEmail`, `sendSubmissionNeedsMoreInfoEmail`, `sendDisputeEscalatedEmail`, `sendDisputeResolvedEmail`, `sendWithdrawalCompletedEmail`, `sendWithdrawalFailedEmail`, `sendPostVisibilityWarningHunterEmail` (Phase 3A — first-failure warning), `sendPostRemovedBrandEmail` + `sendPostRemovedHunterEmail` (Phase 2A — second-failure auto-refund notification). Templates live under `apps/api/src/modules/mail/templates/*.hbs`. Every method is fire-and-forget at the call site — callers wrap in `setImmediate(() => mail.sendX(...).catch(err => logger.error(...)))` to avoid blocking the request thread on SMTP.

## Why it exists

State-change emails are the out-of-band communication surface that ties the platform's state machine to user awareness. Without them, a hunter wouldn't know their submission was approved until they opened the app; a brand wouldn't know a post they paid for has been removed until a disputed refund surfaces. The fire-and-forget wrapping matches `AuditService.log()`'s pattern — email write failures never block the user's request. `MailService` is `@Global()` so every module can inject it without importing `MailModule` explicitly. Phase 3A added the `post-visibility-warning-hunter.hbs` template so a hunter gets a first-failure nudge before the auto-refund fires on the second — a softer UX that gives the hunter a chance to fix the post.

## How it connects

- **`SubmissionsService.review`** — approval/rejection/needs-more-info emails on state change.
- **`DisputesService`** — escalation/resolution/response-required emails.
- **`AuthService`** — OTP and welcome emails.
- **`BrandsService.inviteMember`** — brand-invitation email.
- **`WalletService` / `WithdrawalService`** — withdrawal-settled and withdrawal-failed emails.
- **`SubmissionVisibilityScheduler`** — Phase 3A warning email (first failure) and Phase 2A auto-refund emails (second failure).
- **`AuditService.log`** — every email dispatch is paired with an AuditLog row for compliance review.
- **Handlebars templates** — colocated under the mail module; one file per event type.

---
**degree:** 19 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/mail/mail.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** email is the weakest-coupled side-effect in the system (fire-and-forget, mock in dev), which is both a strength (failure doesn't cascade) and a risk (silent email-dispatch failures go unnoticed). Consider periodic reconciliation against the provider's delivery logs once the SMTP vendor is live, surfacing delivery failures in the admin dashboard.
