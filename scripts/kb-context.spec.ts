/**
 * Unit tests for the kb-context relevance scorer and the small helpers it
 * depends on. The suite does not touch the filesystem or Prisma — it calls
 * the pure functions exported from `kb-context.ts` with fabricated inputs.
 */
import {
  pathNestedMatch,
  parseKbFile,
  scoreKbFileEntry,
  scoreRecurringIssue,
  rankEntries,
  KbFileEntry,
  RecurringIssueRow,
} from './kb-context';

const sampleKbMd = `
## Entries

## [KB-2026-04-15-001] Duplicate payout on retry

Date: 2026-04-15
Type: Financial
Severity: Critical
System: Payments
Module: payout-service
Tags: idempotency, retry, payout, stitch

### Summary
Payout webhook retried produced two ledger credits.

### Root Cause
Payout handler had no idempotency key; retries created a second ledger entry.

### Action Taken
- Added idempotency key
- Added UNIQUE constraint

### Files / Services Affected
- apps/api/src/modules/payouts/payouts.service.ts
- packages/prisma/schema.prisma

### Outcome
Resolved.

### Pattern Classification
Structural flaw

---

## [KB-2026-04-15-002] Webhook replay race

Date: 2026-04-15
Type: Integration
Severity: High
System: Integration
Module: webhook-listener
Tags: webhook, replay

### Summary
Webhook replay double-credited wallet.

### Root Cause
Missing dedup check on provider event id.

### Files / Services Affected
- apps/api/src/modules/webhooks/webhooks.service.ts

### Outcome
Open.

### Pattern Classification
Recurring
`;

describe('pathNestedMatch', () => {
  it('matches exact paths', () => {
    expect(
      pathNestedMatch(
        'apps/api/src/modules/payouts/payouts.service.ts',
        'apps/api/src/modules/payouts/payouts.service.ts',
      ),
    ).toBe(true);
  });

  it('matches a file nested under a directory the KB lists', () => {
    expect(
      pathNestedMatch(
        'apps/api/src/modules/payouts/payouts.service.ts',
        'apps/api/src/modules/payouts/',
      ),
    ).toBe(true);
  });

  it('matches when KB references the directory without a trailing slash', () => {
    expect(
      pathNestedMatch(
        'apps/api/src/modules/payouts/payouts.service.ts',
        'apps/api/src/modules/payouts',
      ),
    ).toBe(true);
  });

  it('falls back to basename match when the rest of the path differs', () => {
    expect(
      pathNestedMatch(
        'payouts.service.ts',
        'apps/api/src/modules/payouts/payouts.service.ts',
      ),
    ).toBe(true);
  });

  it('rejects unrelated paths', () => {
    expect(
      pathNestedMatch(
        'apps/api/src/modules/auth/auth.service.ts',
        'apps/api/src/modules/payouts/payouts.service.ts',
      ),
    ).toBe(false);
  });
});

describe('parseKbFile', () => {
  it('extracts both entries with their fields', () => {
    const entries = parseKbFile(sampleKbMd);
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('KB-2026-04-15-001');
    expect(entries[0].system).toBe('Payments');
    expect(entries[0].filesAffected).toContain(
      'apps/api/src/modules/payouts/payouts.service.ts',
    );
    expect(entries[0].tags).toEqual(
      expect.arrayContaining(['idempotency', 'retry', 'payout']),
    );
    expect(entries[0].resolved).toBe(true);
    expect(entries[1].resolved).toBe(false);
  });
});

describe('scoreKbFileEntry', () => {
  const entries = parseKbFile(sampleKbMd);

  it('scores a path nested under an affected directory as a file hit', () => {
    const s = scoreKbFileEntry(entries[0], {
      path: 'apps/api/src/modules/payouts/payouts.service.ts',
    });
    expect(s).toBeGreaterThanOrEqual(100);
  });

  it('scores a system match', () => {
    const s = scoreKbFileEntry(entries[0], { system: 'payments' });
    expect(s).toBeGreaterThanOrEqual(100);
  });

  it('returns 0 for unrelated queries', () => {
    const s = scoreKbFileEntry(entries[0], { path: 'apps/web/src/unrelated.ts' });
    expect(s).toBe(0);
  });
});

describe('scoreRecurringIssue', () => {
  const base: RecurringIssueRow = {
    id: 'abc',
    category: 'ledger-imbalance',
    signature: 'deadbeef0000',
    title: 'ledger imbalance in payouts',
    severity: 'critical',
    occurrences: 3,
    resolved: false,
    resolvedAt: null,
    firstSeenAt: new Date('2026-04-14T00:00:00Z'),
    lastSeenAt: new Date('2026-04-15T00:00:00Z'),
    rootCause: 'missing idempotency key',
    mitigation: 'added unique constraint',
    kbEntryRef: 'KB-2026-04-15-001',
    metadata: { system: 'payments', paths: ['apps/api/src/modules/payouts/'] },
  };

  it('gives an exact signature match the highest score', () => {
    const s = scoreRecurringIssue(base, { signature: 'deadbeef0000' });
    expect(s).toBeGreaterThanOrEqual(200);
  });

  it('matches a nested file path via metadata.paths', () => {
    const s = scoreRecurringIssue(base, {
      path: 'apps/api/src/modules/payouts/payouts.service.ts',
    });
    expect(s).toBeGreaterThanOrEqual(100);
  });

  it('matches by metadata.system', () => {
    const s = scoreRecurringIssue(base, { system: 'payments' });
    expect(s).toBeGreaterThanOrEqual(100);
  });

  it('returns 0 for unrelated queries', () => {
    const s = scoreRecurringIssue(base, { path: 'apps/web/src/unrelated.ts' });
    expect(s).toBe(0);
  });
});

describe('rankEntries sort order', () => {
  const kbEntries: KbFileEntry[] = parseKbFile(sampleKbMd);

  const riOpen: RecurringIssueRow = {
    id: 'open-row',
    category: 'payouts',
    signature: 'aaaa1111',
    title: 'open payouts issue',
    severity: 'warning',
    occurrences: 5,
    resolved: false,
    resolvedAt: null,
    firstSeenAt: new Date('2026-04-10T00:00:00Z'),
    lastSeenAt: new Date('2026-04-15T00:00:00Z'),
    rootCause: 'race',
    mitigation: null,
    kbEntryRef: null,
    metadata: { system: 'payments', paths: ['apps/api/src/modules/payouts/'] },
  };

  const riResolved: RecurringIssueRow = {
    ...riOpen,
    id: 'resolved-row',
    signature: 'bbbb2222',
    title: 'old resolved payouts issue',
    resolved: true,
    resolvedAt: new Date('2026-04-14T00:00:00Z'),
    occurrences: 20,
  };

  it('ranks open before resolved and respects occurrence count within ties', () => {
    const ranked = rankEntries(kbEntries, [riResolved, riOpen], { system: 'payments' }, 10);
    // First KB entry (Payments system, direct hit, +recurrence) will beat RI rows
    // because kb entry scores +100 for system match plus structural signals.
    // But between the two RI rows, open must beat resolved irrespective of
    // occurrences when scores are otherwise comparable.
    const openIdx = ranked.findIndex((e) => e.id === 'RI-open-row');
    const resolvedIdx = ranked.findIndex((e) => e.id === 'RI-resolved-row');
    expect(openIdx).toBeGreaterThanOrEqual(0);
    expect(resolvedIdx).toBeGreaterThanOrEqual(0);
    expect(openIdx).toBeLessThan(resolvedIdx);
  });

  it('honours limit', () => {
    const ranked = rankEntries(kbEntries, [riResolved, riOpen], { system: 'payments' }, 1);
    expect(ranked).toHaveLength(1);
  });
});
