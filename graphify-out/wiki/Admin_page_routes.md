# Admin page routes

> 263 nodes · cohesion 0.02

## Key Concepts

- **.log()** (110 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- **.get()** (73 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- **.update()** (72 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **.toString()** (44 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.create()** (36 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.catch()** (30 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- **.dispatch()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **.postTransactionGroup()** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/ledger.service.ts`
- **MailService** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **DisputesService** (18 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **.resolve()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **SubmissionsService** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.sendWithRetry()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **.createBountyFunding()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- **.recordRecurrence()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- **WithdrawalService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`
- **PayoutsService** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.receive()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/stitch-webhook.controller.ts`
- **.receive()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts`
- **TradeSafeWebhookHandler** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.postApproval()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- **BrandFundingHandler** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **.onPaymentSettled()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **.releaseEligible()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts`
- **.renderWithLayout()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- *... and 238 more nodes in this community*

## Relationships

- [[Apify post scraping]] (271 shared connections)
- [[Admin operations & overrides]] (231 shared connections)
- [[Bounty access & users]] (146 shared connections)
- [[Auth & webhook verification]] (112 shared connections)
- [[kb-context.ts]] (40 shared connections)
- [[Reconciliation engine]] (37 shared connections)
- [[Admin withdrawals UI]] (15 shared connections)
- [[Brand funding & form state]] (15 shared connections)
- [[SectionPanel.tsx]] (12 shared connections)
- [[ADR headline docs]] (8 shared connections)
- [[ADRs & audit log]] (7 shared connections)
- [[.callback()]] (6 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/main.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/kyb.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/dispute-scheduler.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/notifications.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/clearance.scheduler.ts`

## Audit Trail

- EXTRACTED: 627 (44%)
- INFERRED: 793 (56%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*