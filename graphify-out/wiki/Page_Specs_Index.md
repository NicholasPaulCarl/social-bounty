# Page Specs Index

> God node · 21 connections · `md-files/page-spec/README.md`

**Community:** [[Page spec documentation]]

## Summary

`Page Specs Index` is the directory entry to 91 per-route specs under `md-files/page-spec/`, one markdown file per `page.tsx` in `apps/web/src/app/`. Generated 2026-04-19, each spec follows a fixed template: **Route path · File · Role · Access · Nav entry · Layout** header; a 1–2 sentence Purpose; Entry & exit (inbound sources, outbound hrefs); Data (hooks, API endpoints, URL + search params); top-to-bottom UI structure; loading/empty/error/success states; primary actions; business rules (RBAC, kill-switch, plan-tier, state-machine gates, Financial Non-Negotiables where applicable); edge cases; colocated test files; related files; and inferred open TODOs.

It exists so any agent touching a route has a single file to read for contract, role gate, and dependency surface — and a pair (route spec + `docs/architecture/sitemap.md`) that must be updated together whenever a `page.tsx` is added, renamed, moved, or deleted. The 21 outbound `references` edges visible in the graph are the Super-Admin routes (the highest-density neighborhood); the full 91 specs span public/unauthenticated (9), shared (1), participant (18), business (varied), admin, and marketing surfaces. Role gates themselves live in `layout.tsx` files — this index captures them declaratively so reviewers can see RBAC violations without reading code.

## Connections by Relation

### references
- [[/admin/brands/[id]]] `EXTRACTED`
- [[/admin/bounties/[id]]] `EXTRACTED`
- [[/admin/disputes/[id]]] `EXTRACTED`
- [[/admin/bounties]] `EXTRACTED`
- [[/admin/brands]] `EXTRACTED`
- [[/admin/disputes]] `EXTRACTED`
- [[/admin/audit-logs]] `EXTRACTED`
- [[/admin/brands/new]] `EXTRACTED`
- [[/admin/dashboard]] `EXTRACTED`
- [[/admin/finance/groups/[transactionGroupId]]] `EXTRACTED`
- [[/admin/finance/payouts]] `EXTRACTED`
- [[/admin/finance/overrides]] `EXTRACTED`
- [[/admin/finance/refunds]] `EXTRACTED`
- [[/admin/finance/audit-trail]] `EXTRACTED`
- [[/admin/finance/exceptions]] `EXTRACTED`
- [[/admin/finance/inbound]] `EXTRACTED`
- [[/admin/finance/insights/[system]]] `EXTRACTED`
- [[/admin/finance/earnings-payouts]] `EXTRACTED`
- [[/admin/audit-logs/[id]]] `EXTRACTED`
- [[/admin/finance/insights]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*