# DisputesService

> God node · 22 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`

**Community:** [[API service layer]]

## Summary

`DisputesService` runs the full dispute workflow with a DRAFT → OPEN → UNDER_REVIEW → AWAITING_RESPONSE → ESCALATED → RESOLVED → CLOSED state machine (see `DISPUTE_TRANSITIONS`). It covers three high-level dispute categories — `NON_PAYMENT`, `POST_QUALITY`, `POST_NON_COMPLIANCE` — each with a curated reason whitelist so UI and service stay in sync. Key methods: `.create()` (hunter or brand starts a dispute), `.submitDraft()` (promote DRAFT → OPEN), `.transition()` / `.assign()` / `.escalate()` / `.resolve()` (admin progression and resolution writes), `.sendMessage()` + `.uploadEvidence()` (dispute thread), `.withdraw()` (hunter/brand abandon), plus list methods (`.listMine()`, `.listForBrand()`, `.listAll()`) and `.getStats()`. `.generateDisputeNumber()` produces the human-readable reference.

It exists because disputes are legally- and financially-sensitive: every transition must land in the audit log, notification emails must fire to both sides, and resolution may trigger downstream refund writes via `RefundService`. `DisputesService` is `semantically_similar_to` the main content services — `SubmissionsService`, `BrandsService`, `SocialHandlesService` — and the async `DisputeSchedulerService` that auto-progresses stale tickets. Dependencies are minimal-footprint: `PrismaService`, `AuditService`, `MailService`. It is called by `DisputesController` (the /disputes/* REST surface) and by admin flows in `AdminService` for cross-entity visibility.

## Connections by Relation

### contains
- [[disputes.service.ts]] `EXTRACTED`

### method
- [[.resolve()]] `EXTRACTED`
- [[.submitDraft()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.transition()]] `EXTRACTED`
- [[.assign()]] `EXTRACTED`
- [[.withdraw()]] `EXTRACTED`
- [[.create()]] `EXTRACTED`
- [[.findById()]] `EXTRACTED`
- [[.update()]] `EXTRACTED`
- [[.escalate()]] `EXTRACTED`
- [[.uploadEvidence()]] `EXTRACTED`
- [[.sendMessage()]] `EXTRACTED`
- [[.listForBrand()]] `EXTRACTED`
- [[.generateDisputeNumber()]] `EXTRACTED`
- [[.listMine()]] `EXTRACTED`
- [[.listAll()]] `EXTRACTED`
- [[.getStats()]] `EXTRACTED`

### semantically_similar_to
- [[SubmissionsService]] `INFERRED`
- [[SocialHandlesService]] `INFERRED`
- [[BrandsService]] `INFERRED`
- [[DisputeSchedulerService]] `INFERRED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*