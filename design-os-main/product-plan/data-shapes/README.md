# UI Data Shapes

These types define the shape of data that the UI components expect to receive as props. They represent the **frontend contract** — what the components need to render correctly.

How you model, store, and fetch this data on the backend is an implementation decision. You may combine, split, or extend these types to fit your architecture.

## Entities

- **MarketplaceBounty** — A bounty as seen by participants in the marketplace (used in: bounty-marketplace)
- **Category** — A bounty category for filtering (used in: bounty-marketplace, bounty-management)
- **Organization** — An org with name and logo (used in: bounty-marketplace)
- **UserSubmission** — A participant's submission status for a bounty (used in: bounty-marketplace)
- **MySubmission** — A participant's detailed submission with proof and timeline (used in: my-submissions)
- **BountyReference** — A lightweight bounty reference for submission context (used in: my-submissions)
- **EarningsSummary** — Aggregated earning statistics (used in: my-submissions)
- **Bounty** — A full bounty with all management fields (used in: bounty-management)
- **Submission** — A submission with proof, review history, and payout (used in: review-center)
- **Participant** — A participant's profile info (used in: review-center)
- **BountySummary** — A lightweight bounty context for review (used in: review-center)
- **AdminUser** — A user as seen by the super admin (used in: admin-panel)
- **AdminOrganization** — An org as seen by the super admin (used in: admin-panel)
- **AdminBounty** — A bounty as seen by the super admin (used in: admin-panel)
- **AdminSubmission** — A submission as seen by the super admin (used in: admin-panel)
- **AuditLogEntry** — An immutable audit log record (used in: admin-panel)
- **HealthCheck** — A system health check result (used in: admin-panel)
- **SystemError** — A system error log entry (used in: admin-panel)
- **KillSwitch** — A global feature toggle (used in: admin-panel)
- **DashboardStats** — Aggregated platform stats (used in: admin-panel)

## Per-Section Types

Each section includes its own `types.ts` with the full interface definitions:

- `sections/bounty-marketplace/types.ts`
- `sections/my-submissions/types.ts`
- `sections/bounty-management/types.ts`
- `sections/review-center/types.ts`
- `sections/admin-panel/types.ts`

## Combined Reference

See `overview.ts` for all entity types aggregated in one file.
