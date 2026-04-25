# Incident Response Playbook — Social Bounty

**Version:** 1.2
**Owner:** Engineering Lead
**Last Updated:** 2026-04-25
**Review Cycle:** Quarterly

> **IMPORTANT — pre-launch:** this playbook contains contact placeholders written as `<TO BE FILLED — ...>`. Every one MUST be filled with real contact details before prod cutover. The go-live checklist (`docs/deployment/go-live-checklist.md` §7) gates this.

---

## Table of Contents

1. [Severity Levels](#1-severity-levels)
2. [Response Timelines](#2-response-timelines)
3. [Escalation Contacts](#3-escalation-contacts)
4. [Incident Detection and Declaration](#4-incident-detection-and-declaration)
5. [Response Procedures](#5-response-procedures)
   - [5.1 Data Breach](#51-data-breach)
   - [5.2 Service Outage](#52-service-outage)
   - [5.3 Account Compromise](#53-account-compromise)
   - [5.4 Dependency Vulnerability](#54-dependency-vulnerability)
   - [5.5 Financial Kill Switch (Payment Incidents)](#55-financial-kill-switch-payment-incidents)
   - [5.6 SMS Rail Outage](#56-sms-rail-outage)
6. [Communication Templates](#6-communication-templates)
7. [Post-Incident Review Template](#7-post-incident-review-template)

---

## 1. Severity Levels

| Severity | Label | Criteria | Examples |
|---|---|---|---|
| **SEV-1** | Critical | Platform is down or data is actively being exfiltrated. Affects all users or poses immediate financial/legal risk. | Full outage, active data breach, payment system failure, auth bypass exploited in production |
| **SEV-2** | High | Significant degradation of a core feature for a subset of users, or a confirmed vulnerability that has not yet been exploited. | Login failures for >10% of users, unconfirmed breach, high-severity CVE in production runtime |
| **SEV-3** | Medium | Partial or degraded functionality. Users are impacted but a workaround exists. Not actively exploited. | Slow page loads, email delivery failures, non-critical feature unavailable |
| **SEV-4** | Low | Minor issue with minimal user impact. Can be addressed during normal working hours. | UI glitch, cosmetic error, low-severity CVE in a dev-only dependency |

---

## 2. Response Timelines

| Severity | Acknowledge | Contain | Resolve | Status Updates |
|---|---|---|---|---|
| **SEV-1 Critical** | 15 minutes | 1 hour | Target 4 hours; hard deadline 24 hours | Every 30 minutes |
| **SEV-2 High** | 30 minutes | 4 hours | Target 8 hours; hard deadline 48 hours | Every 2 hours |
| **SEV-3 Medium** | 2 hours | 24 hours | Target 3 business days | Daily |
| **SEV-4 Low** | Next business day | 1 week | 1–2 week sprint | Weekly |

**Clock starts** when the incident is first detected (alert fires, user report received, or engineer discovers the issue), not when it is declared.

---

## 3. Escalation Contacts

All contacts are placeholders. Replace with real names and channels before going live.

| Role | Name | Primary Contact | Backup Contact | Escalate When |
|---|---|---|---|---|
| On-Call Engineer | [On-Call Rotation] | PagerDuty / Slack #on-call | [Secondary On-Call] | Any SEV-1/SEV-2 alert |
| Engineering Lead | [Engineering Lead Name] | Slack DM / Mobile | [Engineering Lead Email] | SEV-1; SEV-2 not resolved within 2 hours |
| CTO / Technical Co-Founder | [CTO Name] | Mobile | [CTO Email] | SEV-1; any data breach regardless of severity |
| Security Lead | [Security Lead Name] | Slack #security / Mobile | [Security Lead Email] | Any suspected breach, account compromise, or CVE exploitation |
| Product Lead | [Product Lead Name] | Slack DM | [Product Lead Email] | SEV-1/SEV-2; any user-facing impact lasting >1 hour |
| Legal Counsel | [Legal Counsel Name/Firm] | [Phone] | [Email] | Any confirmed data breach (GDPR/POPIA notification obligations) |
| Payment Processor Support (TradeSafe) | <TO BE FILLED — TradeSafe account manager name> | <TO BE FILLED — TradeSafe support email> | <TO BE FILLED — TradeSafe merchant dashboard URL> | Any payment processing failure, escrow webhook failure, or TradeSafe API outage |
| SMS Provider Support (Brevo) | Brevo support contact: [TBD — register a primary contact in Brevo dashboard before launch] | https://app.brevo.com/ → Help | <TO BE FILLED — Brevo support email/phone> | Any SMS delivery failure spike, sender-ID rejection, or Brevo API outage (see §5.6) |
| Infrastructure / Hosting Support | [Hosting Provider] | [Support Ticket URL] | [Emergency Phone] | Infrastructure-level outages |

**Incident Commander:** The first senior engineer to acknowledge a SEV-1 or SEV-2 becomes the Incident Commander (IC) until explicitly handed off. The IC coordinates response, owns communication, and makes containment decisions.

---

## 4. Incident Detection and Declaration

### Detection Sources

- Automated alerts (uptime monitoring, Sentry error spikes, PagerDuty)
- User reports via support channels
- Anomaly detection in application logs
- Third-party security researcher disclosure
- Engineer discovery during routine work

### Declaring an Incident

1. Post in Slack `#incidents` channel: `INCIDENT DECLARED — [SEV level] — [One-line description] — IC: [Your name]`
2. Create an incident thread pinned to `#incidents`
3. Open an incident ticket in the issue tracker
4. Begin the appropriate response procedure in Section 5

### Downgrading / Resolving

- An incident is **resolved** when the immediate risk is mitigated and the platform is operating normally
- A resolved incident remains **open** (in monitoring state) for 24 hours before formal close
- Post a resolution message in `#incidents` and update the ticket

---

## 5. Response Procedures

### 5.1 Data Breach

**Trigger:** Unauthorized access to user PII, passwords, payment data, or internal systems is confirmed or strongly suspected.

#### Immediate Actions (0–1 hour)

1. **Isolate** the affected system or data store. Take it offline if necessary to stop ongoing exfiltration.
2. **Preserve evidence** — do not delete logs, containers, or database records. Snapshot affected systems immediately.
3. **Notify** Engineering Lead, CTO, and Security Lead immediately regardless of time of day.
4. **Rotate all credentials** potentially exposed: database passwords, JWT signing secrets, API keys, Redis auth tokens.
5. **Invalidate all active sessions** by rotating the JWT signing secret and flushing all Redis refresh token keys.
6. **Do not communicate** the breach externally until legal counsel is engaged.

#### Containment Actions (1–4 hours)

7. Identify the attack vector: review access logs, application logs, and database audit logs for the time window.
8. Block the attacker's access (IP block, revoke API keys, disable compromised accounts).
9. Engage legal counsel to assess notification obligations under GDPR, POPIA, and any other applicable regulations.
10. Document all affected records: how many users, what data categories, what time window.

#### Recovery Actions (4–24 hours)

11. Patch the vulnerability that enabled the breach before bringing affected systems back online.
12. Restore from the most recent clean backup if data integrity is in question.
13. Issue breach notifications to affected users within the legally required window (GDPR: 72 hours to supervisory authority; POPIA: without unreasonable delay).
14. Force password resets for all affected accounts.

#### Regulatory Checklist

- [ ] Legal counsel engaged
- [ ] Supervisory authority notification filed (if required)
- [ ] Affected user notifications drafted and sent
- [ ] Law enforcement notified (if criminal activity suspected)
- [ ] Documentation prepared for regulatory inquiry

---

### 5.2 Service Outage

**Trigger:** The platform is fully or substantially unavailable. Uptime monitor fires, or >25% of requests are failing.

#### Immediate Actions (0–15 minutes)

1. **Confirm the outage** — check the uptime dashboard, run a manual health check against `/api/health`.
2. **Identify scope** — is it total (all users) or partial (specific region, feature, user group)?
3. **Declare the incident** in `#incidents` and assign an Incident Commander.
4. **Activate the status page** — update the public status page to "Investigating."

#### Diagnosis Checklist

5. Check infrastructure health: database, Redis, application server, load balancer.
6. Review recent deployments — was a deployment made in the last 2 hours? Consider rollback.
7. Check Sentry for a spike in errors. What is the error message and stack trace?
8. Check application logs for the first error timestamp — identify what changed.
9. Check third-party dependencies: payment processor, email provider, external APIs.

#### Containment Actions

10. If a bad deployment: **roll back immediately** — do not attempt to hotfix a broken production deploy.
11. If infrastructure: engage hosting provider support; consider failing over to a backup region or instance.
12. If database: check connection pool exhaustion, disk space, replication lag.
13. If Redis: check memory usage; restart Redis and verify application reconnects gracefully.

#### Recovery

14. Restore service using the fastest safe path (rollback > hotfix > restore from backup).
15. Verify recovery end-to-end with a synthetic transaction test.
16. Update the status page: "Monitoring" then "Resolved."
17. Post a follow-up in `#incidents` with time-to-resolution and a brief root cause summary.

---

### 5.3 Account Compromise

**Trigger:** A user account has been taken over by an unauthorized party, or suspicious authentication activity is detected (unusual location, token theft, credential stuffing campaign).

#### Immediate Actions (0–30 minutes)

1. **Lock the affected account(s)** — set status to `SUSPENDED` in the database.
2. **Invalidate all sessions** for the affected account — flush all Redis keys matching `refresh:{userId}:*`.
3. **Identify the attack vector:**
   - Credential stuffing (check for high login failure rate from multiple IPs)
   - Phishing (user-reported)
   - Token theft via XSS or local storage access
   - Insider threat

4. **Contact the affected user** via their registered email to confirm the compromise and initiate recovery.

#### Credential Stuffing Response

5. Enable aggressive rate limiting on `/auth/login` — reduce the limit to 3 attempts per IP per 10 minutes.
6. Identify the source IP range and block at the load balancer.
7. Review the list of accounts with recent failed logins — proactively lock high-risk accounts.
8. Consider forcing a password reset for all accounts where the email appears in known breach databases.

#### Token Theft Response

9. Rotate the JWT signing secret — this invalidates all tokens platform-wide. Users will need to re-authenticate.
10. Identify the XSS vector if applicable — patch immediately before re-enabling the affected feature.
11. Review CSP headers and `httpOnly` cookie configuration.

#### Recovery

12. Re-enable the account only after the user completes identity verification.
13. Require a password reset via secure email link.
14. Notify the user of actions taken and advise them to check for unauthorized transactions or submissions.

---

### 5.4 Dependency Vulnerability

**Trigger:** A CVE is published for a package in the production dependency tree, or `npm audit` reports a new vulnerability. Dependabot opens a PR flagging a high/critical advisory.

#### Triage (within response timeline for severity)

1. **Identify the package and version** affected.
2. **Determine if the vulnerable code path is reachable** in Social Bounty:
   - Is the package a devDependency only (build-time, not runtime)?
   - Is the vulnerable function actually called in the application?
   - Does the application pass user-controlled input to the vulnerable function?
3. **Assign a real-world severity** based on reachability (a critical CVE in a devDependency may be SEV-4).

#### Remediation Decision Matrix

| Scenario | Action |
|---|---|
| Runtime dependency, reachable code path, exploit available | SEV-1/SEV-2 — patch immediately, deploy hotfix |
| Runtime dependency, reachable code path, no known exploit | SEV-2 — patch in next release cycle (within 4 hours for High, 24 hours for Medium) |
| Runtime dependency, code path not reachable | SEV-3 — plan upgrade in next sprint |
| devDependency only | SEV-4 — merge Dependabot PR at next opportunity |

#### Patch Procedure

4. Create a feature branch: `fix/cve-[cve-id]-[package-name]`.
5. Update the package: `npm install [package]@[fixed-version]`.
6. Run the full test suite: `npx jest --config apps/api/jest.config.ts --no-coverage`.
7. Review the changelog for breaking changes. Adjust code if necessary.
8. Open a PR with the CVE reference in the title and description.
9. Request expedited review — do not wait for normal review cycle for SEV-1/SEV-2.
10. Deploy through the standard pipeline (not a direct production push) unless a SEV-1 emergency hotfix procedure is activated.

#### Known Deferred Vulnerabilities

The following vulnerabilities have been assessed and deferred pending major version upgrades. Review this list quarterly.

| Package | CVE / Advisory | Severity | Deferred Because | Target Sprint |
|---|---|---|---|---|
| `multer` | GHSA-xf7r-hgr6-v32p | High | Requires multer v2 API migration | Pre-production |
| `nodemailer` | GHSA-mm7p-fcc7-pg87 | High | Requires nodemailer v8 migration | Pre-production |
| `next` | Multiple | High | Requires Next.js v16 migration | Pre-production |
| `@nestjs/cli` chain | Multiple | Moderate/High | Dev-only; requires NestJS CLI v11 | Sprint N+2 |

---

### 5.5 Financial Kill Switch (Payment Incidents)

The Financial Kill Switch is the platform's ledger-write circuit breaker. Flip it when ledger integrity is in doubt — reconciliation drift, webhook replay storm, duplicate postings, suspected double-spend, or any Critical financial-impact incident per `claude.md` §10.

**Procedure:**

1. **Assess.** Confirm the incident: reconciliation drift? webhook replay storm? duplicate postings? Use the Finance Reconciliation Dashboard at `/admin/finance` and KB recurrences under `category: ledger-imbalance`.
2. **Flip.** Log into `/admin/finance` as Super Admin. Toggle the kill switch. Hard Rule #6 applies — typed confirmation word required. The toggle writes an AuditLog row (`action = KILL_SWITCH_TOGGLE`).
3. **Verify.** Within 30s, new ledger-writing flows should throw `KillSwitchActiveError`. Confirm in the log stream. Reconciliation checks continue to run (they're read-only).
4. **Investigate.** Use the dashboard + KB + `scripts/kb-context.ts` to find the root cause. Do NOT merge any fix until the root cause is understood.
5. **Correct (if needed).** Super Admin posts compensating entries via `/admin/finance/overrides`. These land via the one authorised bypass path per ADR 0006 — the ONLY flows that may write while the switch is active.
6. **Resume.** Flip the switch off once integrity is restored. AuditLog row written.

**Related:**
- ADR 0006 — the authorised bypass scope (scoped to `compensating_entry` `actionType` only).
- ADR 0010 — the visibility scheduler's auto-refund path fail-closes on the kill-switch read (treats transient DB errors as "active"); it does NOT bypass.
- `docs/deployment/go-live-checklist.md` §4 — financial readiness gates.

**Do NOT:**
- Do NOT attempt to SQL-edit ledger rows. Append-only (Non-Negotiable #5). Corrections = compensating entries only.
- Do NOT restart the API thinking the switch is just a cache. It's persisted in `SystemSetting.financial.kill_switch.active`; a restart changes nothing.
- Do NOT leave the switch active longer than the investigation requires — the ADR 0010 auto-refund queue and other scheduled jobs queue up.

---

### 5.6 SMS Rail Outage

**Symptom:** Users report not receiving SMS OTP codes. May present as support tickets ("I never got my code"), failed logins, or a spike in "Try Email instead" clicks. Distinct from a general auth outage — email-OTP continues to work throughout.

**Severity guide:** SEV-3 (partial degradation, workaround exists via email) unless >25% of auth attempts are SMS-only with no email fallback, in which case escalate to SEV-2.

#### First Check

1. Open the Brevo dashboard at `https://app.brevo.com/` → SMS → Statistics. Look for a failed-delivery spike in the last 1–2 hours.
   - **Delivery failures from Brevo:** Brevo accepted the send (HTTP 201) but the telco rejected delivery. Likely a ZA alphanumeric sender-ID rejection. Contact Brevo support; see the escalation contact in §3.
   - **HTTP errors from Brevo:** Brevo is returning 4xx/5xx. Check API key validity in Render environment vars. If the key is valid, check Brevo's status page (`https://status.brevo.com/`).
   - **No sends in logs:** `SMS_ENABLED` may have been accidentally flipped or the API process is not routing to `SmsService`. Check boot logs for `SMS rail enabled` / `SMS rail disabled` message.

2. Check Render API logs (`social-bounty-api` → Logs) for `SmsService` error lines. The service logs structured error output including the Brevo HTTP status and response body.

3. Confirm the per-phone daily cap has not been globally exhausted: check Redis key pattern `sms:daily:*`. A single phone cap (10/day) is expected; if hundreds of distinct keys are at cap, investigate for an abuse pattern.

#### Kill Switch — Flip `SMS_ENABLED=false`

1. In Render dashboard → `social-bounty-api` service → Environment → set `SMS_ENABLED=false`.
2. Render auto-redeploys; takes approximately 2 minutes.
3. After deploy, verify boot logs show `SMS rail disabled — SMS_ENABLED=false`.

**Post-flip behaviour:** The channel toggle still renders in the login UI — users can select SMS, but the request returns the standard generic "if an account exists, a code has been sent" message without any SMS going out (same anti-enumeration shape as the email path). Users see no error; they naturally click "Try Email instead." There is **no data integrity impact** — no ledger, no financial state, no session data is affected.

#### Recovery

1. Once Brevo is healthy (delivery stats normal, no HTTP errors), flip `SMS_ENABLED=true` in Render.
2. Confirm the next boot log contains: `SMS rail enabled — Brevo, sender=<sender>`.
3. Send a test OTP to a known phone number and confirm delivery within 30 seconds.
4. Update the incident in `#incidents` with time-to-recovery and root cause.

#### Per-Phone Cap Exhausted

A single user phone hitting the 10-SMS daily cap returns the silent generic message — they cannot distinguish cap exhaustion from a successful send. This is by design (abuse-surface reduction).

- **Normal resolution:** wait for the Redis TTL to expire (24h from the first SMS in the window).
- **Manual reset (support escalation):** `redis-cli DEL sms:daily:<e164Phone>` — replace `<e164Phone>` with the E.164 number (e.g. `+27821234567`). Only do this for a confirmed legitimate user via a support ticket; this resets their cap to 0.

#### Cost Monitoring

Every SMS costs approximately 10.2 Brevo credits for South African delivery. The `usedCredits` field is returned in the Brevo API response and logged by `SmsService`. Monitor credit balance in the Brevo dashboard. Suggested thresholds:
- **Warning:** credit balance below 200 (approximately 20 SMS remaining).
- **Refill trigger:** at 10% of purchased credit volume, or enable Brevo's auto-replenish in the billing settings.

**Related:**
- ADR 0012 — Multi-channel OTP rail design, failure-mode table, and per-phone cap rationale.
- `CLAUDE.md` §SMS_ENABLED — kill switch documentation.

---

## 6. Communication Templates

### Status Page — Investigating

```
We are investigating reports of [describe issue]. Our engineering team is actively
working to identify the cause. We will provide an update within [30 minutes / 2 hours].
```

### Status Page — Identified

```
We have identified the cause of [describe issue]: [brief root cause without sensitive
technical detail]. We are working on a fix and expect to restore full service by
[estimated time]. Affected functionality: [list].
```

### Status Page — Resolved

```
The issue affecting [describe feature] has been resolved as of [time] [timezone].
All systems are operating normally. We apologize for the inconvenience.
A full post-incident review will be completed within 5 business days.
```

### User Breach Notification (Draft — Legal Review Required)

```
Subject: Important Security Notice Regarding Your Social Bounty Account

Dear [User Name],

We are writing to inform you of a security incident that may have affected your
Social Bounty account.

What happened: [Description]
What information was involved: [Data categories]
What we are doing: [Remediation steps]
What you should do: [User action items — change password, monitor account]

We take the security of your data seriously. If you have questions, please contact
[support email].

[Legal required disclosures per jurisdiction]
```

---

## 7. Post-Incident Review Template

Complete within **5 business days** of incident resolution for SEV-1/SEV-2, or within **2 weeks** for SEV-3.

---

### Incident Summary

| Field | Value |
|---|---|
| **Incident ID** | INC-[YYYY-MM-DD]-[SEQ] |
| **Severity** | SEV-[1/2/3/4] |
| **Date/Time Detected** | |
| **Date/Time Resolved** | |
| **Total Duration** | |
| **Incident Commander** | |
| **Participants** | |

### Timeline

| Time | Event |
|---|---|
| [HH:MM] | First detection (alert / user report / discovery) |
| [HH:MM] | Incident declared |
| [HH:MM] | Root cause identified |
| [HH:MM] | Containment action taken |
| [HH:MM] | Service restored |
| [HH:MM] | Incident resolved |

### Impact Assessment

| Dimension | Detail |
|---|---|
| **Users Affected** | [Number / percentage] |
| **Features Affected** | [List] |
| **Data Affected** | [None / describe] |
| **Financial Impact** | [Estimated] |
| **SLA Breached** | [Yes / No] |

### Root Cause Analysis

**Immediate cause** (the direct trigger):

**Contributing factors** (what allowed the immediate cause to have this impact):

**Root cause** (the systemic issue that should be fixed to prevent recurrence):

### What Went Well

-
-
-

### What Could Be Improved

-
-
-

### Action Items

| # | Action | Owner | Target Date | Status |
|---|---|---|---|---|
| 1 | | | | Open |
| 2 | | | | Open |
| 3 | | | | Open |

### Lessons Learned

_Summarize the key takeaways for the team. What process, tool, or practice change would have the highest impact?_

---

*End of post-incident review. File in the incident log and link from the incident ticket.*

---

*Document Owner: Engineering Lead. For questions about this playbook, open a discussion in the engineering Slack channel.*
