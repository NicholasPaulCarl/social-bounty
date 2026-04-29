# Legal Documents — Social Bounty (Pty) Ltd

Markdown copies of the 11 first-draft legal documents that govern use of Social Bounty. Intended for offline review, attorney redline passes, and version-controlled diffing outside the Next.js render layer.

**Authoritative copies** live as rendered pages under [`apps/web/src/app/(marketing)/legal/`](../../apps/web/src/app/(marketing)/legal/) and serve at `/legal/*` on the production site. The markdown files here are generated from those pages and kept in sync at commit time.

## Status

> **Working drafts.** Every document is a first draft pending formal review by an admitted South African attorney before production launch. They reflect current platform practice as at 2026-04-24 but are not yet the binding final versions.

- **Version:** 1.0
- **Effective date:** 2026-04-24
- **Jurisdiction:** South Africa, Gauteng Division of the High Court
- **Entity:** Social Bounty (Pty) Ltd · CIPC 2026/301053/07 · Not currently VAT-registered

## Documents

### POPIA & Data

| Document | Purpose |
|---|---|
| [Privacy Policy](./privacy-policy.md) | What personal information we collect under POPIA, why, retention, cross-border transfer, your rights. |
| [Cookie Policy](./cookie-policy.md) | Cookies we use, categories, and controls. |
| [PAIA Manual](./paia-manual.md) | Statutory right to request records under the Promotion of Access to Information Act. |
| [Information Officer & Data Subject Rights](./information-officer.md) | How to exercise POPIA access, correction, deletion, and objection rights. |

### Commercial

| Document | Purpose |
|---|---|
| [Terms of Service](./terms-of-service.md) | The master agreement — bounties, fees (43.5% total), licences, liability, governing law. |
| [Payout & Escrow Terms](./escrow-terms.md) | TradeSafe-as-AGENT custody model, fund flow, payment methods, refunds. |

### Consumer

| Document | Purpose |
|---|---|
| [Consumer Rights Notice](./consumer-rights.md) | Plain-English summary of your rights under the Consumer Protection Act. |
| [Complaints & Dispute Resolution](./complaints.md) | Internal complaint process, SLAs, NCC and IR escalation paths. |

### Platform Rules

| Document | Purpose |
|---|---|
| [Acceptable Use Policy](./acceptable-use.md) | Prohibited content and behaviour, enforcement ladder. |
| [Disclaimer](./disclaimer.md) | Limits of our facilitator role, no-FAIS / no-NCA / no-employment carve-outs. |
| [IP & Copyright Takedown Policy](./ip-policy.md) | ECTA §77 takedown notice procedure and counter-notice. |

## How to use these drafts

**For attorneys.** Redline each `.md` file directly. GitHub renders markdown with auto-generated tables of contents; GitHub pull request reviews give you clause-level comments. The TSX pages under `apps/web/src/app/(marketing)/legal/` will need the same changes applied when the redline is accepted — they're the rendered copies users actually see.

**For anyone editing entity facts.** Every fact that varies by entity (name, registration number, address, emails, officer, partners, regulator URLs) comes from the single source of truth at [`apps/web/src/content/legal/entity.ts`](../../apps/web/src/content/legal/entity.ts). Update that file, re-run the TSX → markdown conversion, commit both.

**For founders.** The [post-incorporation compliance checklist](../compliance/post-incorporation-checklist.md) tracks the external registrations these documents assume are in place (SARS Public Officer, CIPC Beneficial Ownership, IR Information Officer registration, PAIA Manual IR filing, B-BBEE EME affidavit).

## Open items flagged for attorney review

These appear inline in each draft but collect them here too so nothing falls through:

- **AI-training opt-out position** (Terms §7.3) — currently drafted as opt-out by default.
- **Cooling-off carve-out** (Terms §6, Consumer Rights §9) — ECTA §44(3)(b) "service commenced with consumer's consent" exception applied to bounty flows.
- **Arbitration framed as voluntary** (Terms §17, Complaints §6) — to preserve CPA §52 right to approach the NCC.
- **Liability cap calibration** (Terms §18.3) — ZAR 10,000 or 12-month fees, whichever greater.
- **Retention window inconsistency** — Terms cites 5y (Tax Administration Act §29); Privacy Policy cites 7y. Pick one.
- **Auto-refund mechanic under CPA** — whether §§55–57 "quality of service" implied warranty affects the 2-failure threshold for auto-refund (ADR 0010).
- **`abuse@socialbounty.cash` mailbox** referenced in Acceptable Use Policy §6 — not yet provisioned.
- **Complaints SLAs** (14-day commercial, 7-day auto-refund review) — confirm deliverable at launch headcount.
- **`penalty of perjury`** phrasing in IP Policy §4 — US-flavoured; SA practice uses "declaration made knowing it to be false".
- **CGSO membership** — currently declared "not a member"; confirm posture before publication.
- **Deputy Information Officer** — none appointed yet; IR guidance may require one as headcount grows.

## Related references

- [`CLAUDE.md`](../../CLAUDE.md) — project charter and financial non-negotiables (see "Legal document wiki" entry).
- [`docs/adr/0011-tradesafe-unified-rail.md`](../adr/0011-tradesafe-unified-rail.md) — the architectural decision that motivated the custody-language rewrite.
- [`docs/adr/0010-auto-refund-on-visibility-failure.md`](../adr/0010-auto-refund-on-visibility-failure.md) — auto-refund rationale referenced in Terms and Privacy.
- [`docs/adr/0006-compensating-entries-bypass-kill-switch.md`](../adr/0006-compensating-entries-bypass-kill-switch.md) — platform right-to-reverse referenced in Terms.
- [`md-files/payment-gateway.md`](../../md-files/payment-gateway.md) — canonical payment spec.
- [`docs/compliance/post-incorporation-checklist.md`](../compliance/post-incorporation-checklist.md) — external registration deadlines.

---

*Social Bounty (Pty) Ltd · CIPC 2026/301053/07 · [legal@socialbounty.cash](mailto:legal@socialbounty.cash)*
