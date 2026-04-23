# `ledger.service.ts` (source file)

> Source file for `LedgerService` — the one sanctioned write path for every financial mutation in the platform.

## What it does

`ledger.service.ts` is the file declaring `LedgerService`, the NestJS service that owns every ledger write. The file exports: the `KILL_SWITCH_KEY` constant (`'financial.kill_switch.active'` — note that the Financial Kill Switch is a DB row, never an env var; the comment at the top explicitly calls out the stale `FINANCIAL_KILL_SWITCH` env var removed 2026-04-15 in orphan sweep C2); the `PostLedgerLeg`, `PostLedgerAudit`, `PostTransactionGroupInput`, `PostTransactionGroupResult` interfaces that type every leg of every ledger write; the `LedgerImbalanceError` class thrown when a leg pair doesn't balance; and the `LedgerService` class itself with methods `postTransactionGroup()`, `isKillSwitchActive()`, `setKillSwitch()`, `runInTx()` (internal). The `allowDuringKillSwitch: true` flag — the narrow ADR 0006 compensating-entry escape — is typed on `PostTransactionGroupInput`.

## Why it exists

This file is the single-source-of-truth for the platform's financial integrity. Every concept in Financial Non-Negotiables §4 is encoded here: double-entry (leg-pair balance check in `runInTx`), idempotency (`UNIQUE(referenceId, actionType)` enforced at DB + fast-path pre-check), transaction-group integrity (single `$transaction`), integer minor units (`amountCents: bigint` types on every leg), append-only ledger (no mutation methods — only `postTransactionGroup`), AuditLog integration (mandatory `audit` field), retry-safe (idempotency key is the defence). The KILL_SWITCH_KEY comment documents the lesson learned in orphan sweep C2 (env var was misleading operators — the real switch is the DB row).

## How it connects

- **`.postTransactionGroup()` method** — the single public write entry point.
- **`PrismaService`** — the DB connection.
- **`AuditService`** — injected for audit-log writes inside the ledger transaction.
- **`SystemSetting.financial.kill_switch.active`** — the DB row `isKillSwitchActive()` reads.
- **`BrandFundingHandler`, `RefundsService`, `PayoutsService`, `ApprovalLedgerService`, `FinanceAdminService`, `UpgradeService`, `SubscriptionsService`, `TradeSafeWebhookHandler`** — every financial-mutation service calls into this file.
- **`ReconciliationService`** — reads ledger state and may call `setKillSwitch` on critical findings.
- **`ledger.service.spec.ts`** — the colocated test suite.
- **ADR 0005 — Ledger Idempotency** and **ADR 0006 — Compensating Entries Bypass the Kill Switch** — the two governing ADRs for the contracts encoded in this file.

---
**degree:** 16 • **community:** "Ledger & payment services" (ID 9) • **source:** `apps/api/src/modules/ledger/ledger.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this is one of two nodes in the graph that represent the same file at different granularities — the method-level node (`ledger_service_ledgerservice_posttransactiongroup`, degree 19) and this file-level node. Together they cover the same object from two angles; the method-level article is the deeper dive.
