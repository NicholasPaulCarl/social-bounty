# Social Bounty MVP

> God node · 28 connections · `claude.md`

**Community:** [[Project charter & ADRs]]

## Summary

The `Social Bounty MVP` node is the canonical product-charter concept rooted in `claude.md` — the single source of truth that defines the bounty-based marketplace where brands fund tasks, hunters (participants) submit social proof, business admins review, and super admins govern the platform. It anchors the eight Hard Rules (MVP-only scope, RBAC on every surface, append-only audit logs, 100% green tests, PrimeReact + Tailwind UI, confirmation on destructive actions, agent-routed work) and the ten Financial Non-Negotiables (double-entry, idempotency, integer minor units, append-only ledger, plan snapshot, 3.5% global-fee independence, platform custody).

It exists because every contributor — human or agent — needs one document that fixes scope and rules before code is written. Structurally, it cross-links the three role concepts (`Participant`, `Business Admin`, `Super Admin`), core data-model entities (`User`, `Brand`, `Bounty`, `Submission`, `WebhookEvent`, `AuditLog`), the payment spine (`LedgerService`, `TradeSafe`, `Svix Webhooks`, `Platform custody`, `Reconciliation Engine`), and the operator gates (`PAYOUTS_ENABLED=false`). The `covers` edge to `BACKUP-STRATEGY.md` and the `tests` edge to `apps/web/e2e/README.md` mark it as the document backup and E2E guarantees report to.

## Connections by Relation

### covers
- [[BACKUP-STRATEGY.md]]

### semantically_similar_to
- [[claude.md]] `INFERRED`
- [[Financial Non-Negotiables]] `INFERRED`
- [[TradeSafe]] `INFERRED`
- [[Hard Rules]] `INFERRED`
- [[Participant]] `INFERRED`
- [[Svix Webhooks]] `INFERRED`
- [[PAYOUTS_ENABLED=false gate]] `INFERRED`
- [[Business Admin]] `INFERRED`
- [[Idempotency (UNIQUE referenceId, actionType)]] `INFERRED`
- [[LedgerService]] `INFERRED`
- [[Super Admin]] `INFERRED`
- [[Bounty (data model)]] `INFERRED`
- [[WebhookEvent (data model)]] `INFERRED`
- [[Finance Admin Dashboard]] `INFERRED`
- [[User (data model)]] `INFERRED`
- [[Submission (data model)]] `INFERRED`
- [[Platform custody]] `INFERRED`
- [[Global fee independence (3.5%)]] `INFERRED`
- [[Reconciliation Engine]] `INFERRED`
- [[Plan snapshot]] `INFERRED`

### tests
- [[apps/web/e2e/README.md]]

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*