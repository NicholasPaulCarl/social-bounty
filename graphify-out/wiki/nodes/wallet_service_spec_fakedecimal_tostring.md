# `FakeDecimal.toString()` (wallet-service.spec.ts)

> Test-fixture stand-in for `Prisma.Decimal` used across all WalletService unit tests.

## What it does

`FakeDecimal.toString()` is a method on the `FakeDecimal` class defined inside `jest.mock('@prisma/client', ...)` at the top of `wallet-service.spec.ts`. `FakeDecimal` mimics the subset of the `Prisma.Decimal` API that WalletService touches — `add`, `sub`, `abs`, `lessThan`, `toString`, `toNumber` — implemented over a plain `_value: number` field. `toString()` returns `String(this._value)`, which matches the real `Prisma.Decimal`'s string-ification behaviour closely enough for the assertions WalletService test-matrix relies on (rendering amounts in error messages, comparing expected strings in `.toBe(...)` matchers).

## Why it exists

`Prisma.Decimal` is a native, install-time generated class; instantiating it in a jest environment that mocks `@prisma/client` would otherwise throw. The pattern of inlining a `FakeDecimal` is the convention adopted across `wallet-service.spec.ts` and `withdrawal-service.spec.ts` — the two places where wallet arithmetic touches ledger balances. The degree of 46 reflects how many individual test cases assert on formatted-decimal output: balance-after-deposit, balance-after-withdrawal, insufficient-funds error messages, audit-log `afterState` snapshots. Matches the 2026-04-15 pattern for jest-unblock under TS 6.0 (commit `a1527ff`): test files must be self-sufficient and not depend on generated Prisma client shape.

## How it connects

- **`FakeDecimal` (class)** — the enclosing class; `toString()` is one of its six methods, co-mocked alongside `add`, `sub`, `abs`, `lessThan`, `toNumber`.
- **`WalletService` tests** — every `expect(err.message).toContain('...')` assertion that embeds a balance calls through `toString()` during error construction.
- **`WithdrawalService.toString()` sibling** — the same pattern duplicated in `withdrawal-service.spec.ts` (degree 3); deliberate duplication because the mocks are per-file-scoped.
- **`@prisma/client` mock factory** — the `jest.mock()` factory that constructs `FakeDecimal`; jest's hoisting means the class must be defined inside the factory.
- **`WalletTxType`, `WithdrawalStatus`, `PayoutMethod`, `Currency` (shared enums)** — the typed enums the spec imports alongside, which are safe to mock through `@social-bounty/shared`.

Most of the 46-degree fan-out is inward — individual test cases asserting on formatted-decimal output.

---
**degree:** 46 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this node ranking this high is a graph-topology quirk — it's a test-fixture helper, not production code — but the count does surface a real observation: the wallet unit-test surface is unusually dense. If the `Prisma.Decimal` API ever stabilises into a drop-in `decimal.js` package, consolidating both specs' `FakeDecimal` definitions into a shared test-helper would reduce the maintenance cost here.
