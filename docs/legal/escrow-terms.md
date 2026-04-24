---
title: Payout & Escrow Terms
category: Commercial
version: 1.0
effective_date: 2026-04-24
last_updated: 2026-04-24
status: Working draft — pending attorney review
---

> **Working draft.** This document is a first draft intended for internal review. It must be reviewed by an admitted South African attorney before it governs a live user relationship.

# Payout & Escrow Terms

How bounty funds are held in escrow by TradeSafe Escrow (Pty) Ltd, how and when payouts are released to hunters, and when a payment may be refunded or reversed.

## 1. Overview

These Payout & Escrow Terms describe how money moves through the Platform and supplement the main [Terms of Service](./terms-of-service.md). Where this document and the main Terms of Service disagree, the main Terms of Service take precedence for contract formation and [dispute-handling](./terms-of-service.md#disputes), and this document takes precedence for the mechanics of custody and payout.

The Platform uses a three-party escrow arrangement operated by **TradeSafe Escrow (Pty) Ltd** (**TradeSafe**), a registered South African digital-escrow service:

- The **brand** that posts and funds a bounty is the **BUYER**.
- The **hunter** who claims the bounty, submits compliant proof, and receives a payout is the **SELLER**.
- **Social Bounty (Pty) Ltd** acts as **AGENT** on the transaction — we instruct release from escrow when the brand approves the submission and are paid our fees through the same mechanism.
- **TradeSafe** is the escrow — it holds the funds from deposit to release in its regulated escrow account.

Social Bounty does **not** receive, hold, or re-transmit bounty funds in its own bank account at any point. The funds sit in TradeSafe's escrow from deposit to release.

## 2. Not banking, not lending, not investment

The service described in these Terms is a **commercial escrow** on a per-bounty basis. It is not any of the following, and nothing on the Platform should be read as offering any of the following:

- **It is not a deposit-taking service.** Social Bounty (Pty) Ltd is not a bank, is not registered as such under the Banks Act 94 of 1990, and does not hold balances on your behalf. You cannot deposit funds with us and cannot withdraw a "wallet balance" on demand — there is no wallet.
- **It is not a credit or lending service.** No credit is extended by us to any participant. Nothing in these Terms constitutes a "credit agreement" for the purposes of the National Credit Act 34 of 2005 (**NCA**).
- **It is not a financial-advice or intermediary service.** We do not give financial advice and we do not act as an intermediary in a financial product for purposes of the Financial Advisory and Intermediary Services Act 37 of 2002 (**FAIS**). The Platform does not offer investment, savings, or yield features.
- **It is not an investment scheme.** Funding a bounty is payment for a specific promotional deliverable; it is not the purchase of a security and carries no expectation of return beyond the content described in the brief.

TradeSafe's own regulatory status as a digital-escrow service is set out on its website. Our arrangement with TradeSafe does not extend its licences or registrations to Social Bounty (Pty) Ltd.

## 3. How funds move

The end-to-end flow for a single bounty is:

1. The brand creates a bounty, enters a face-value reward, and is quoted a total charge that includes the brand admin fee, transaction fee, and global platform fee (see clause 5).
1. The brand pays the total charge via TradeSafe's hosted checkout. TradeSafe captures the payment and records it against the bounty's escrow transaction.
1. TradeSafe **holds the funds in escrow**. Social Bounty receives confirmation of the deposit and flips the bounty to live; the bounty can now accept submissions.
1. Hunters claim the bounty, submit proof, and (where the brief has checkable rules) their submissions are automatically verified.
1. The brand approves a submission in the brand review tool. Social Bounty (as AGENT) calls TradeSafe's `allocationAcceptDelivery` instruction.
1. TradeSafe **releases the hunter's net payout** from escrow to the hunter's registered South African bank account, deducts the platform fees and pays them to Social Bounty, and marks the allocation as settled.
1. Social Bounty records the release in its internal double-entry ledger and writes an audit-log entry for the transaction.

## 4. Payment methods

Inbound payments are captured through TradeSafe's hosted checkout. TradeSafe supports a range of South African payment methods, which currently include:

- Debit and credit card (Visa, Mastercard)
- Instant EFT via Ozow
- SnapScan
- Ecentric card-present flows (for in-person scenarios)
- PayJustNow (pay-in-instalments)
- Manual EFT (bank-deposit reference)

The exact list available at checkout is controlled by TradeSafe and may change without notice. Foreign-issued cards may be declined by the issuing bank for South African merchants; that is a matter between you and your issuer.

Outbound payouts to hunters are made by **EFT to a South African bank account** registered on the hunter's TradeSafe SELLER token. We do not currently support payouts to mobile-money wallets, foreign bank accounts, or crypto wallets.

## 5. Fees recap

Fees deducted from each bounty comprise:

- a **20% hunter commission** (Free plan), deducted from the reward before the hunter is paid;
- a **15% brand admin fee** (Free plan), added to the brand's checkout total;
- a **5% transaction fee**, added to the brand's checkout total;
- a **3.5% global platform fee**, charged separately on each side of the transaction.

Banking or payment-method charges imposed by TradeSafe or the paying bank are passed through at cost and disclosed at checkout. Social Bounty (Pty) Ltd is not currently VAT-registered (our turnover is below the R1 million compulsory-registration threshold under the Value-Added Tax Act 89 of 1991), so no VAT is charged on our fees. The full numeric example is in clause 8 of the [Terms of Service](./terms-of-service.md#fees).

## 6. Clearance & settlement

The time between brand approval and funds landing in the hunter's bank account has two components:

- **Platform clearance** — a hold we apply on the hunter's side, set by the hunter's plan, to absorb reversal-within-window scenarios (see clause 7). Current plan terms are published on the Platform and recorded on each transaction at the moment of approval. The plan in force at that moment is the one that applies, even if the hunter's plan changes later.
- **TradeSafe settlement** — the time TradeSafe takes to move the funds from its escrow account to the hunter's bank. TradeSafe's own service-level commitments apply; in typical operation this is same-business-day after the release instruction. TradeSafe's settlement timings are controlled by TradeSafe and **are not guaranteed by Social Bounty**.

Payouts requested on weekends or public holidays settle on the next business day. If your bank has its own inbound-deposit hold, the funds may be visible but not yet cleared in your account for a further period — that is a matter between you and your bank.

## 7. Refunds & reversals

A bounty-funded payment may be refunded or reversed in the following scenarios. In each case we write an audit-log entry and (where you are affected) notify you by email with a short reason.

### 7.1 Submission rejected before approval

If a brand rejects every submission to a bounty, or cancels the bounty before any submission is approved, the escrowed funds (less non-recoverable payment-method fees levied by TradeSafe or the paying bank) are refunded to the brand's originating payment method. Refunds follow TradeSafe's refund channel for the original payment method and typically take two to seven business days to appear.

### 7.2 Auto-refund on post removal

Where a bounty brief requires the hunter's post to remain publicly accessible for a set duration, our scheduler re-checks the post on a regular cadence. If **two consecutive re-checks at least six hours apart** both find the post unreachable, and the failures are not attributable to a known third-party outage, we may automatically reverse the payout back to the brand by posting a compensating ledger entry.

We notify both brand and hunter by email before and at the point of reversal. Hunters who believe the reversal was triggered by a false-positive check (for example the post is live but geo-blocked to the scraper) may appeal through our [complaints process](./complaints.md), and we reinstate the payout where the appeal is upheld.

### 7.3 Dispute decided in the brand's favour

Where a formal dispute is decided in the brand's favour following review, the escrow release for that submission may be reversed by compensating entry and the funds returned to the brand.

### 7.4 Financial Kill Switch

During a suspected financial-integrity incident a super-admin may activate the Platform's **Financial Kill Switch**, which halts new payouts and new ledger postings while the underlying cause is investigated. Pending instructions to TradeSafe are held in the queue rather than cancelled. Once the incident is resolved, the queue is released. The Kill Switch is a last-resort control and is fully audit-logged.

### 7.5 Super-admin correction

Where a ledger error is identified that cannot be fixed by ordinary flows, a super-admin may post a balanced compensating entry to correct the error. Compensating entries require a typed confirmation and a written reason, and a full audit-log row is written with the actor identity and the correction rationale. They are reviewed post-hoc through our Finance dashboards.

## 8. TradeSafe's own terms

TradeSafe Escrow (Pty) Ltd has its own service terms, privacy notice, and fee schedule that apply in addition to these Terms. Your use of TradeSafe (as BUYER to fund a bounty, as SELLER to receive a payout) is governed by those TradeSafe terms, which you will be asked to accept when you first interact with the TradeSafe hosted checkout or beneficiary-capture flow.

You can read TradeSafe's service terms, privacy notice, and fee schedule at [tradesafe.co.za](https://www.tradesafe.co.za). Social Bounty (Pty) Ltd is not responsible for TradeSafe's own policies, but we choose our escrow partner with care and we will tell you if we change it.

## 9. Outages & retries

If TradeSafe is unreachable when a brand tries to fund a bounty or when we try to release a payout, the relevant instruction is held in the queue and retried on an exponential backoff. Brands will see a clear error and can retry; hunters will see the payout as "release initiated — waiting for escrow partner" until TradeSafe confirms.

For release instructions, our system is **idempotent**: a retried instruction will not cause a double release. The TradeSafe webhook replay protections and our own double-entry ledger prevent duplicate postings even if multiple retries reach TradeSafe.

If an outage lasts more than 24 hours for any single instruction, we will proactively email the affected user with a short update and an ETA where we have one.

## 10. Tax

**Hunters are responsible for their own income tax.** Payouts to a hunter are payments for services rendered; they are not employment income and we do not withhold PAYE or UIF. If you are unsure of your tax position, speak to a SARS-registered tax practitioner.

We may be required to report aggregated payout information to the South African Revenue Service under the Tax Administration Act 28 of 2011. Where we do so, we act as required by law and in line with the disclosure commitments in our [Privacy Policy](./privacy-policy.md).

**VAT.** Social Bounty (Pty) Ltd is not currently VAT-registered under the Value-Added Tax Act 89 of 1991, as our taxable supplies are below the R1 million compulsory-registration threshold. No VAT is charged on our fees and no VAT invoices are issued. If our turnover reaches the threshold we will register, display our VAT number on the Platform, and give at least 30 days' notice before adding VAT to any fee.

**Record retention.** We retain financial records for at least **five years** from the date of the transaction, in line with section 29 of the Tax Administration Act, and for longer where another law requires it. Deleting your account does not delete financial records within that window.

## 11. Contact

For questions about payouts, escrow, or any item in this document, email us at [legal@socialbounty.cash](mailto:legal@socialbounty.cash). To raise a formal complaint, use our [Complaints & Dispute Resolution](./complaints.md) process.

---

*Social Bounty (Pty) Ltd · CIPC 2026/301053/07 · [legal@socialbounty.cash](mailto:legal@socialbounty.cash)*
