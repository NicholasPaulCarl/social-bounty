---
title: Disclaimer
category: Platform Rules
version: 1.0
effective_date: 2026-04-24
last_updated: 2026-04-24
status: Working draft — pending attorney review
---

> **Working draft.** This document is a first draft intended for internal review. It must be reviewed by an admitted South African attorney before it governs a live user relationship.

# Disclaimer

Social Bounty is a facilitator, not a party to the bounty arrangement between brand and hunter. This page explains what that means and what we do and do not warrant.

## 1. Our role as a facilitator

Social Bounty (Pty) Ltd (registration number 2026/301053/07) operates the Social Bounty platform at socialbounty.cash. We are a **facilitator**: we provide software that connects brands, who publish bounty briefs, with hunters, who deliver social-media content in exchange for a reward.

We are not a party to the contractual arrangement between a brand and a hunter. The substantive bargain — what the brief requires, what the hunter produces, whether the output meets the brief — is between them. Our role is to host the brief, run the mechanical checks our verification partner makes available, and route money through an escrow partner so that hunters are paid when the brief is satisfied.

Bounty funds are held in escrow by our payment partner, TradeSafe Escrow (Pty) Ltd, under TradeSafe's own terms. See the [Payout & Escrow Terms](./escrow-terms.md) for how escrow operates and our role in it.

## 2. No warranty

The Platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by South African law, we do not warrant that:

- the Platform will be uninterrupted, error-free, or available at all times;
- every bounty published is commercially attractive, ethical, or suitable for you;
- every brand who opens an account is reputable, solvent, or pleasant to deal with;
- every hunter's output will meet a brand's expectations beyond the mechanical checks our verification process performs;
- specific commercial outcomes (views, impressions, followers, conversions, sales) will result from any bounty.

Nothing in this Disclaimer excludes or limits any right or protection you enjoy under a statute that cannot lawfully be excluded, including applicable rights under the Consumer Protection Act 68 of 2008 (the **CPA**) where the CPA applies to you. Our CPA position is summarised in the [Consumer Rights Notice](./consumer-rights.md).

## 3. Third-party providers

The Platform relies on independent third parties to do parts of the job. Each of them has its own terms, its own operating capacity, and its own failure modes. We are not responsible for their performance beyond our reasonable procurement and oversight of them.

### TradeSafe (escrow)

TradeSafe Escrow (Pty) Ltd is a separate legal entity that provides the escrow custody and settlement layer. Funds held in escrow are held by TradeSafe under its own terms and in its own bank arrangements. Issues that arise on the TradeSafe side — escrow release delays, payout rail outages, bank failures, compliance holds applied by TradeSafe — are ultimately matters between you and TradeSafe. We will, in good faith, help you engage with TradeSafe and provide such reasonable assistance as we can, but we do not underwrite TradeSafe's performance.

### Apify (verification)

Apify is our verification processor. It fetches public metadata from social-media posts so we can run mechanical checks against the rules a bounty brief specifies. Apify is an independent third party and may experience outages, rate limits, and edge-case failures. See [Limits of automated verification](#4-limits-of-automated-verification) below.

### Hosting, mail, and other infrastructure

We use third-party hosting, email, analytics, error-tracking, and customer-support providers to run the Platform. Those providers are listed (and the categories of personal information shared with them disclosed) in our [Privacy Policy](./privacy-policy.md). Their service disruptions may cause Platform disruptions; we aim to restore service promptly but cannot eliminate this risk.

### Social-media platforms

Instagram, TikTok, Facebook, X, and other social platforms are independent services that we do not control. Their content moderation, metric accuracy, account-suspension decisions, and API behaviour are their own. We cannot, for example, undo a target platform's removal of a hunter's post.

## 4. Limits of automated verification

A core Platform feature is mechanical verification of submissions against the rules a bounty brief sets (for example, minimum views, a required mention, or post-visibility rules). This verification is automated: it reads publicly available post metadata through our verification processor and compares it to the brief. Automated verification has structural limits:

- The processor can fail for transient reasons (rate limits, outages, edge-case URL structures it does not recognise, target-platform throttling).
- A single failed scrape is not enough evidence, by itself, that a submission is non-compliant. We therefore apply a two-consecutive-failure threshold before an automated visibility outcome triggers a refund. See [Payout & Escrow Terms](./escrow-terms.md) and our internal ADR 0010 for the design rationale.
- Verification does not assess creative quality, tone, or whether a post is a "good ad". Quality judgement remains with the brand reviewer.
- Verification relies on public social-media data; if a hunter deletes, unpublishes, or sets a post to private, the processor may report that as a failure even if the hunter believes the underlying content is still compliant.

If you believe a verification decision was wrong, raise the issue through our [Complaints & Dispute Resolution](./complaints.md) process. A human on our team will review the scrape history, the submission, and the relevant rule.

## 5. Not financial advice (FAIS carve-out)

Social Bounty is **not** a financial services provider as contemplated by the Financial Advisory and Intermediary Services Act 37 of 2002 (**FAIS**). We do not furnish financial advice, make recommendations about financial products, or act as an intermediary in respect of any financial product listed in section 1 of FAIS.

Nothing on the Platform — including reward figures, payout timing indicators, or any commentary we provide about the cash-flow implications of participating — should be treated as financial, tax, or investment advice. You are solely responsible for your own financial decisions and, where appropriate, for obtaining advice from a suitably licensed adviser.

Hunters who earn income through the Platform are responsible for their own tax affairs, including income tax registration with the South African Revenue Service where applicable, and for any VAT, PAYE (if they trade through a company that pays them a salary), or provisional tax obligations that result from their earnings. We do not withhold tax on hunter payouts.

## 6. Not a credit provider (NCA carve-out)

Social Bounty does not extend credit. We do not lend money, offer instalment plans, issue credit facilities, or otherwise provide credit agreements as contemplated by the National Credit Act 34 of 2005 (the **NCA**). Bounty payments flow from the brand, through escrow held by TradeSafe, to the hunter. No party is lending to another through this arrangement.

Where a brand funds a bounty and it is later not claimed or is refunded, the brand is returned its own money through the escrow process; that is not a loan repayment and is not regulated by the NCA.

## 7. Not an employment or talent agency

Social Bounty is not a talent agency, a personnel or recruitment agency within the meaning of the Basic Conditions of Employment Act 75 of 1997 or the Labour Relations Act 66 of 1995, or a placement service. The relationship between a brand and a hunter is not one of employer and employee. No hunter becomes our employee, independent contractor, partner, or agent by using the Platform.

Hunters deliver bounties in their own capacity and on their own initiative. A hunter is free to take or ignore any brief, is not subject to our supervision in how they do the work, and carries the creative and operational risk of their own output.

## 8. External links

The Platform may link to external sites — social-media platforms, TradeSafe, payment providers, news articles, third-party tools — for convenience. We do not control those sites, do not endorse their content, and are not responsible for what you find there. Following an external link is at your own risk and under the terms and privacy practices of the site you arrive at.

## 9. User-submitted content

Bounty briefs, submissions, profile information, and messages on the Platform are authored by users — brands and hunters — not by us. We do not pre-moderate user content. Responsibility for user content rests with the user who submitted it.

We act on content that breaches the [Acceptable Use Policy](./acceptable-use.md) when we become aware of it. Where we host user content and receive a valid take-down notice, we follow the procedure set out in our [IP & Copyright Takedown Policy](./ip-policy.md). To the extent we qualify for the intermediary limitations in Chapter XI of the Electronic Communications and Transactions Act 25 of 2002 (**ECTA**), we rely on them.

## 10. Jurisdiction and cross-border use

The Platform is designed primarily for use by people and brands based in South Africa. Our escrow partner, our compliance posture, and the contractual framework assume South African law. If you access the Platform from outside South Africa, you do so on your own initiative and are responsible for compliance with your local law, including any restrictions on cross-border payments, tax, content, advertising, and the use of social-media platforms.

Our hosted services may not be available in every jurisdiction, and we may restrict access from specific countries where required to manage legal or operational risk.

## 11. Changes to the Platform

The Platform is a living product. We add features, remove features, change rules, and retire endpoints over time. Minor changes happen without notice. Material changes — anything that would meaningfully affect the rights or obligations of brands or hunters — are notified in accordance with the [Terms of Service](./terms-of-service.md) and reflected in the versioning of this and related documents.

## 12. Contact

Questions about this Disclaimer can be directed to [legal@socialbounty.cash](mailto:legal@socialbounty.cash), or by post to our registered office at 2 Alyth Road, Forest Town, Johannesburg, Gauteng, 2193, South Africa.

---

*Social Bounty (Pty) Ltd · CIPC 2026/301053/07 · [legal@socialbounty.cash](mailto:legal@socialbounty.cash)*
