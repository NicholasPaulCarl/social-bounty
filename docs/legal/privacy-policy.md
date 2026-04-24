---
title: Privacy Policy
category: POPIA & Data
version: 1.0
effective_date: 2026-04-24
last_updated: 2026-04-24
status: Working draft — pending attorney review
---

> **Working draft.** This document is a first draft intended for internal review. It must be reviewed by an admitted South African attorney before it governs a live user relationship.

# Privacy Policy

What personal information we collect when you use Social Bounty, why we collect it, who we share it with, how long we keep it, and the rights you have under the Protection of Personal Information Act (POPIA).

## Introduction

This Privacy Policy explains how **Social Bounty (Pty) Ltd** (trading as Social Bounty) handles personal information about the people who use our platform at [socialbounty.cash](https://socialbounty.cash). We are bound by the Protection of Personal Information Act 4 of 2013 (POPIA), and we take that responsibility seriously.

Social Bounty is a bounty marketplace. Brands post tasks with cash rewards, hunters complete them and submit proof, and we sit in the middle — verifying the work, moving the money, and keeping an audit trail. Doing that requires handling personal information about both brands and hunters, and this document explains exactly what that means in practice.

We have written this policy in plain English. Where we cite an Act or section, we do so to be precise, not to hide behind jargon. If anything here is unclear, email us at [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash) and we will explain it.

This policy sits alongside our [Cookie Policy](./cookie-policy.md), our [PAIA Manual](./paia-manual.md), our [Information Officer page](./information-officer.md), and our [Terms of Service](./terms-of-service.md). Read them together — this policy explains what we do with your data; the Terms explain the commercial relationship.

## Who we are

For POPIA purposes, Social Bounty is the **responsible party** — the entity that decides why and how your personal information is processed.

- **Registered name:** Social Bounty (Pty) Ltd
- **CIPC registration number:** 2026/301053/07
- **Registered office / domicilium:** 2 Alyth Road, Forest Town, Johannesburg, Gauteng, 2193, South Africa
- **Trading domain:** socialbounty.cash
- **Information Officer:** Nicholas Paul Carl Schreiber (Director (Acting Information Officer))
- **Privacy contact:** [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash)

See our [Information Officer page](./information-officer.md) for the role's statutory responsibilities under POPIA sections 55 and 56.

## Personal information we collect

We only collect what we need to run the platform. Here is the full list, grouped by why we collect it.

### Account and authentication data

When you sign up as a hunter or a brand, we collect your name, email address, a cryptographic hash of your password (we never store the plain password), and any profile details you choose to add. We generate a unique user ID for our database. If you verify your email by one-time code, we store the fact that verification happened and when.

### Brand verification data (KYB)

If you operate as a brand, we collect information about your business: the CIPC registration number, registered name, trading name, VAT number (if registered), and the name and role of the person administering the brand account. This is a **product-level** KYB check — it is not the same as the statutory FICA due diligence, which our payment partner (TradeSafe Escrow) performs in its capacity as an accountable institution.

### Hunter banking details (via TradeSafe)

To pay a hunter, we need their banking details. You supply those details directly to [TradeSafe Escrow (Pty) Ltd](https://www.tradesafe.co.za), our registered digital escrow partner, through their token-registration flow. Social Bounty does not store your bank account number, branch code, or account holder details on our own servers — we store a TradeSafe-issued opaque token that lets us instruct TradeSafe to pay you without us ever seeing the underlying banking data. Social Bounty acts as an agent of the transaction; TradeSafe is the custodian of the funds and the banking information.

### Submission content

When you submit proof for a bounty, we collect the URLs you submit, any supporting media you upload, any text notes you include, and any messages you exchange with the brand during the review. This content is visible to the brand reviewing the submission and to authorised platform admins investigating disputes.

### Apify-scraped social post data

To verify a submission automatically, we send the URLs you submit to [Apify](https://apify.com), which retrieves the publicly accessible post data — scraped metrics (views, likes, comments), post metadata, and the public profile information attached to the post. We do this only for URLs you have submitted to us, and only for posts you have made public.

We also re-scrape submission URLs on an ongoing basis to enforce the bounty's post-visibility rule. If a post that you were paid for stops being publicly accessible for two consecutive checks, the platform may automatically reverse the payment back to the brand in line with our auto-refund policy. The re-scrape activity is logged against your submission for auditability.

### Device, usage, and technical data

When you use the platform, we automatically collect: your IP address, browser type and version, device type, operating system, referring URLs, pages visited, timestamps, and session identifiers. This is standard server-log data and is used to operate the service, detect abuse, and improve performance.

### Communications with us

If you email us, submit a support ticket, or contact us through the platform, we retain a copy of the conversation so we can follow up and improve our service.

## How we use your information

POPIA section 11 lists the lawful bases on which a responsible party may process personal information. Every use of your data on Social Bounty falls under one of the following bases.

### Performance of a contract (section 11(1)(b))

Most of what we do with your data is necessary to perform the contract between you and us. This includes: operating your account, posting and reviewing bounties, verifying submissions against bounty rules, instructing TradeSafe to pay hunters, applying platform fees, issuing refunds, and maintaining the audit trail every financial transaction needs.

### Compliance with a legal obligation (section 11(1)(c))

We are required by law to retain financial and tax records for seven years (Tax Administration Act 28 of 2011 section 29). We also retain records we may need to produce for SARS, the Information Regulator, the South African Reserve Bank, or a court. We process personal information to the extent necessary to meet those obligations.

### Legitimate interests (section 11(1)(f))

We rely on legitimate interests for activities that are not strictly contract performance but are necessary to run a safe, honest platform. These include: fraud prevention, abuse detection, reconciliation of our ledger against TradeSafe's records, incident investigation, aggregate analytics that let us understand usage patterns, and direct operational communications (e.g. "your payout was released"). We have weighed these uses against your rights and privacy interests and believe they are proportionate. You can object to processing based on legitimate interest — see "Your POPIA rights" below.

### Consent (section 11(1)(a))

We rely on consent only where POPIA actually requires it, such as non-essential analytics cookies (see [Cookie Policy](./cookie-policy.md)) and any optional marketing communications. You can withdraw consent at any time without affecting the lawfulness of what we did before.

## Who we share your information with

We do not sell your personal information. We share it only with the operators below, and only to the extent each one needs to perform its role. Each operator is bound by a written agreement that meets the requirements of POPIA sections 20 and 21.

### TradeSafe Escrow (Pty) Ltd — payment and escrow partner

TradeSafe is our registered South African digital escrow partner. They hold bounty funds between brand funding and hunter payout, perform the FICA due diligence on brands and hunters who transact, and execute the bank transfers that pay hunters. We share with TradeSafe: your name, email, relevant contact details, the transaction reference, and (for hunters) the opaque token that links your Social Bounty account to your TradeSafe party record. Banking details are captured by TradeSafe directly; we never see them.

### Apify — social-post verification processor

Apify retrieves publicly available post data for URLs you submit so we can verify the work automatically. We share with Apify: the post URL you submitted. Apify returns the scraped public post data to us. Apify operates from the European Union and the United States — see "Cross-border transfer" below for how that transfer is protected under POPIA section 72.

### Cloud hosting and infrastructure providers

The platform runs on commercial cloud infrastructure. The hosting provider stores encrypted copies of our database and file uploads on our behalf as an operator under POPIA. They do not access your data for their own purposes.

### Transactional email provider

We use a transactional email service to send account emails (verification, password reset, payout confirmation, dispute notifications). It receives your name and email address to deliver the message.

### Error monitoring

We use an error-monitoring service so we can investigate crashes and unexpected errors. Server-side errors may include user identifiers and request metadata; we filter out sensitive fields before sending the error to the service.

### Legal and regulatory disclosures

We will disclose personal information to the South African Revenue Service, the Information Regulator, the Financial Intelligence Centre, a court, or another competent authority when required by a validly issued legal instrument (summons, subpoena, warrant, or statutory demand).

### Business transfers

If Social Bounty is acquired, merged, or sold as a going concern, personal information may be transferred to the acquirer as part of the transaction. We will give you reasonable notice and explain the practical effect on this Privacy Policy before the transfer takes effect.

## Cross-border transfer of personal information

POPIA section 72 restricts the transfer of personal information to a third party in another country. Social Bounty is a South African company and our primary processing happens in South Africa. However, some of our operators process your data outside the Republic, so we rely on section 72(1)(b) — the recipient is bound by a law, binding corporate rules, or binding agreement that provides an adequate level of protection.

The cross-border transfers we make are:

- **Apify** (Czech Republic / United States): post URLs and scraped post data. We rely on our data-processing agreement with Apify and their compliance with the EU General Data Protection Regulation, which the Information Regulator has indicated offers comparable protection to POPIA.
- **Cloud hosting provider** (regions vary): encrypted database and file storage. We rely on the provider's data processing agreement and its ISO 27001 / SOC 2 certifications.
- **Transactional email provider**: name and email address for message delivery.
- **Error monitoring service**: request metadata and stack traces (with sensitive fields redacted).

If you want a copy of the operator agreements that protect your cross-border transfer, email us at [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash). We will give you a description of the safeguards — the agreements themselves contain commercially confidential terms we can redact.

## How long we keep your information

POPIA section 14 requires us to keep personal information only for as long as necessary. We apply the following retention periods:

- **Financial, ledger, and tax records:** seven (7) years from the date of the transaction. This matches the requirement in section 29 of the Tax Administration Act 28 of 2011 and section 24 of the Value-Added Tax Act (to the extent applicable). This retention period cannot be shortened by a deletion request — if you ask us to delete your account, we will delete or anonymise everything we can, but financial records tied to completed transactions remain for the statutory period.
- **Account and profile data (after account closure):** retained for ninety (90) days after you close your account, then anonymised or deleted unless a longer period is required for a specific legal purpose (for example an open dispute or regulatory inquiry).
- **Server logs:** ninety (90) days, after which they are automatically purged.
- **Support communications:** two (2) years, so we can track recurring issues and honour any commitments we made.
- **Aggregated and anonymised data:** retained indefinitely. Once data has been fully anonymised it is no longer personal information and POPIA does not apply.

## Your rights under POPIA

POPIA gives you a set of rights over your personal information. You can exercise any of them free of charge (we may charge a reasonable fee for repeated or excessive requests, and will tell you before we do). We will respond within thirty (30) days as required by POPIA regulation 3 read with section 24.

### Right of access (section 23)

You may ask us whether we hold personal information about you and, if we do, ask us to give you a copy of it. Our response will describe the categories of data, the purposes we use it for, who we share it with, and how long we keep it.

### Right to correction or deletion (section 24)

You may ask us to correct personal information that is inaccurate, out of date, incomplete, misleading, or unlawfully obtained; or to delete or destroy personal information we no longer have authority to hold. If we cannot delete data because of a statutory retention obligation, we will tell you which obligation applies and delete whatever we can.

### Right to object (section 11(3))

You may object to processing that relies on legitimate interest or direct marketing. We will stop unless we can show a lawful reason to continue.

### Right to not be subject to automated decision-making (section 71)

The automatic verification checks we run on a submission, and the auto-refund that can follow two consecutive post-visibility failures, are automated decisions that affect you. You can ask us to review the decision manually, and we will review it promptly. The checks themselves are documented in the bounty rules you can see before you submit.

### Right to complain to the Information Regulator

If you are not satisfied with how we have handled your personal information, you can complain to the Information Regulator of South Africa:

- Website: [https://inforegulator.org.za](https://inforegulator.org.za)
- Email: [POPIAComplaints@inforegulator.org.za](mailto:POPIAComplaints@inforegulator.org.za)

We would appreciate the chance to resolve the issue with you first — email [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash). You do not need to exhaust that route before going to the Regulator, but it is usually faster.

For details on how to submit a POPIA rights request, see our [Information Officer & Data Subject Rights](./information-officer.md) page.

## How we protect your information

POPIA section 19 requires us to take reasonable technical and organisational steps to secure your personal information. In practice that means:

- Transport encryption (TLS) on every connection to the platform.
- Encryption at rest for databases and file uploads.
- Password hashing with a modern key-derivation function; we never store or log plaintext passwords.
- Role-based access control (RBAC) on every screen and API endpoint, with the principle of least privilege applied to staff access.
- An append-only audit log for every administrative action and financial state change, so we can reconstruct what happened and who did it.
- Segregation of banking information to TradeSafe's environment so our servers never hold the data.
- Documented incident response procedures and notifications to the Information Regulator and affected data subjects as POPIA section 22 requires in the event of a security compromise.

No system is perfectly secure. If we become aware of a compromise affecting your data, we will notify you and the Information Regulator in line with section 22.

## Children

Social Bounty is an 18+ platform. You must be at least 18 years old to register, create bounties, or submit work. We do not knowingly collect personal information from anyone under 18. If we find out that we have collected personal information from a child, we will delete it promptly. If you believe a child has registered, email [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash).

## Changes to this Privacy Policy

We will update this Privacy Policy from time to time. Minor edits (clarifying wording, fixing typos, updating contact details) appear here with a new version number. Material changes — new categories of data, new operators, a new retention period, changes to your rights — will be notified to you by email and with a banner on the platform at least fourteen (14) days before they take effect, so you have time to review and decide whether to continue using the platform.

The current version of this policy is Version 1.0, effective 2026-04-24.

## Contact us

For anything relating to your personal information or this policy, contact our Information Officer:

- **Name:** Nicholas Paul Carl Schreiber
- **Role:** Director (Acting Information Officer)
- **Email:** [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash)
- **Postal address:** 2 Alyth Road, Forest Town, Johannesburg, Gauteng, 2193, South Africa

To escalate, see our [Information Officer page](./information-officer.md). To file a formal record request, see our [PAIA Manual](./paia-manual.md).

---

*Social Bounty (Pty) Ltd · CIPC 2026/301053/07 · [privacy@socialbounty.cash](mailto:privacy@socialbounty.cash)*
