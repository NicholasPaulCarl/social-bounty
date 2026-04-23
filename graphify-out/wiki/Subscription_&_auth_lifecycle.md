# Subscription & auth lifecycle

> 99 nodes · cohesion 0.03

## Key Concepts

- **useFinanceAdmin.ts** (21 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/hooks/useFinanceAdmin.ts`
- **FinanceAdminController** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.controller.ts`
- **subscriptions.controller.ts** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/subscriptions.controller.ts`
- **exports.controller.ts** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **FinanceExportsService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **FinanceExportsController** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **social-handles.controller.ts** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.controller.ts`
- **roles.guard.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/roles.guard.ts`
- **bounty-access.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.controller.ts`
- **business.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.controller.ts`
- **finance-admin.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.controller.ts`
- **reconciliation.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.controller.ts`
- **admin.controller.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.controller.ts`
- **kb.controller.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.controller.ts`
- **.inbound()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.send()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.stamp()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.toCsv()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **wallet.controller.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.ledger()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.refunds()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.reserves()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- **.inboundCsv()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.refundsCsv()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.payouts()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.controller.ts`
- *... and 74 more nodes in this community*

## Relationships

- [[Finance admin dashboard]] (184 shared connections)
- [[Controllers & RBAC guards]] (83 shared connections)
- [[Next.js page routes]] (14 shared connections)
- [[Bounty service & tests]] (3 shared connections)
- [[REST API controllers]] (3 shared connections)
- [[Bounty access & mutation]] (3 shared connections)
- [[API service layer]] (3 shared connections)
- [[User & brand profile services]] (1 shared connections)
- [[Wallet service]] (1 shared connections)
- [[Ledger & payment services]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/decorators/roles.decorator.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/roles.guard.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/roles.guard.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/subscriptions.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/app/admin/finance/audit-trail/page.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/app/admin/finance/visibility-failures/page.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/hooks/useFinanceAdmin.ts`

## Audit Trail

- EXTRACTED: 203 (68%)
- INFERRED: 95 (32%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*