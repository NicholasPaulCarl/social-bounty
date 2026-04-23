# Social Bounty MVP (concept)

> The canonical product concept — bounty-based creator-marketplace with Stitch inbound, TradeSafe outbound, and strict RBAC.

## What it does

The `Social Bounty MVP` concept node represents the product the whole monorepo ships. In domain terms: brands with a `BUSINESS_ADMIN` role create `Bounty` rows with a reward budget, acceptable channels (`INSTAGRAM`, `FACEBOOK`, `TIKTOK`, `X`), required post formats (`REEL`, `FEED_POST`, `VIDEO_POST`, etc.) and rules (engagement minimums, post-visibility requirements, brand-asset links). Hunters with a `PARTICIPANT` role browse bounties, (for CLOSED bounties) apply and get invited, submit `ProofLinkInput[]` per format when they've posted, and have those URLs auto-scraped via Apify for verification. Brands review and approve; the approval posts a ledger transaction group via `LedgerService.postTransactionGroup` that moves reserved funds into hunter-available balance. Hunters withdraw via the outbound TradeSafe rail (currently behind `PAYOUTS_ENABLED=false`). SUPER_ADMINs hold the kill-switch and reconciliation dashboard.

## Why it exists

This concept is the anchor every other domain node ties back to — charter rules, ADRs, phase plans, and the agent play-books all cite the MVP as their scope boundary. The canonical spec lives at `md-files/social-bounty-mvp.md`; this concept node is the graph-side index into it. Hard Rule #1 ("MVP only — no feature creep. If it's not in the spec, don't build it.") is enforced by pointing at this concept when triaging scope-creep proposals: if it's not in the MVP as described here, it's a backlog item, not a now-item.

## How it connects

- **`claude.md`** — the project charter defines the MVP; the concept is the semantic pointer back to the `md-files/social-bounty-mvp.md` spec.
- **Agent play-books** (`agent-backend`, `agent-frontend`, `agent-architect`, `agent-ux-designer`) — each reference the MVP as their scope envelope.
- **`Bounty` entity, `BountyAccessType` enum** — the MVP's central object and its PUBLIC/CLOSED modes.
- **Phase 3 concept** — the delivery phase that shipped the Finance Reconciliation Dashboard + subscription billing, closing the MVP's last open scope item.
- **Financial Non-Negotiables concept** — the 10 rules that govern every ledger-touching branch of the MVP.
- **SUPER_ADMIN / BUSINESS_ADMIN / PARTICIPANT roles** — the RBAC tri-state the MVP assumes.
- **ADR 0008 — TradeSafe for Hunter Payouts** — the current outbound-rail decision under the MVP banner.

Degree 28 makes it the most-connected concept node in the graph — second only to `claude.md` among document/concept-typed nodes.

---
**degree:** 28 • **community:** "Project charter & ADRs" (ID 3) • **source:** `claude.md` (definition) + `md-files/social-bounty-mvp.md` (spec)

> **Architectural note:** treating the MVP as an explicit concept-node makes scope-creep triage a one-hop graph query. When a new proposal arrives, trace it through the graph to this node; if the path is short and through ADRs, it's in scope, if the path is long and through a product-strategy doc, it isn't.
