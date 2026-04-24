import { Injectable } from '@nestjs/common';
import { LedgerEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CSV exports for the Finance Reconciliation Dashboard.
 *
 * Every row includes `transactionGroupId` and the Stitch `externalReference`
 * where applicable so finance can tie a CSV line back to both the ledger group
 * and the upstream Stitch record. Per Phase 3 scope, these are the primary
 * traceability columns.
 *
 * Values are serialized as:
 *  - bigint cents       → integer string
 *  - Date               → ISO-8601 string
 *  - null / undefined   → empty string
 *
 * CSV quoting: a field is wrapped in double quotes whenever it contains a
 * comma, a double-quote, a CR, or an LF. Embedded double-quotes are escaped
 * to `""` (RFC 4180).
 */
export interface CsvColumn<T> {
  key: string;
  header: string;
  /** Optional value extractor. When omitted, `row[key]` is used. */
  value?: (row: T) => unknown;
}

@Injectable()
export class FinanceExportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hand-rolled RFC 4180 CSV serializer. We deliberately avoid adding a
   * dependency: CSV quoting is simple enough and the surface area is small.
   */
  toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const header = columns.map((c) => this.escapeField(c.header)).join(',');
    const lines = rows.map((row) =>
      columns
        .map((col) => {
          const raw =
            col.value !== undefined
              ? col.value(row)
              : (row as unknown as Record<string, unknown>)[col.key];
          return this.escapeField(this.stringify(raw));
        })
        .join(','),
    );
    // CRLF per RFC 4180 — matters for Excel on Windows.
    return [header, ...lines].join('\r\n') + '\r\n';
  }

  private stringify(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private escapeField(value: string): string {
    if (/[",\r\n]/.test(value)) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  // ---------------------------------------------------------------------------
  // Inbound: TradeSafeTransaction rows (brand funding — ADR 0011).
  // ---------------------------------------------------------------------------
  async inboundCsv(): Promise<string> {
    type InboundRow = {
      id: string;
      bountyId: string | null;
      tradeSafeTransactionId: string;
      totalValueCents: bigint;
      state: string;
      createdAt: Date;
      updatedAt: Date;
      bounty: { id: string; title: string; brandId: string } | null;
    };

    const rows = (await this.prisma.tradeSafeTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        bounty: { select: { id: true, title: true, brandId: true } },
      },
    })) as InboundRow[];

    // Map transaction → ledger group via referenceId=tradeSafeTransactionId,
    // actionType='BOUNTY_FUNDED_VIA_TRADESAFE'. One query, then lookup in-memory.
    const groups = await this.prisma.ledgerTransactionGroup.findMany({
      where: {
        actionType: 'BOUNTY_FUNDED_VIA_TRADESAFE',
        referenceId: { in: rows.map((r) => r.tradeSafeTransactionId) },
      },
      select: { id: true, referenceId: true },
    });
    const groupByRef = new Map(groups.map((g) => [g.referenceId, g.id]));

    return this.toCsv<InboundRow>(rows, [
      { key: 'id', header: 'transactionId' },
      { key: 'bountyId', header: 'bountyId' },
      {
        key: 'bountyTitle',
        header: 'bountyTitle',
        value: (r) => r.bounty?.title ?? '',
      },
      {
        key: 'brandId',
        header: 'brandId',
        value: (r) => r.bounty?.brandId ?? '',
      },
      { key: 'tradeSafeTransactionId', header: 'externalReference' },
      { key: 'totalValueCents', header: 'amountCents' },
      { key: 'state', header: 'state' },
      {
        key: 'transactionGroupId',
        header: 'transactionGroupId',
        value: (r) => groupByRef.get(r.tradeSafeTransactionId) ?? '',
      },
      { key: 'createdAt', header: 'createdAt' },
      { key: 'updatedAt', header: 'updatedAt' },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Reserves: per-bounty reserve balance with drift flag.
  // ---------------------------------------------------------------------------
  async reservesCsv(): Promise<string> {
    const bounties = await this.prisma.bounty.findMany({
      where: { faceValueCents: { not: null } },
      select: {
        id: true,
        title: true,
        brandId: true,
        faceValueCents: true,
        paymentStatus: true,
        status: true,
        endDate: true,
      },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });

    type Row = {
      bountyId: string;
      title: string;
      brandId: string;
      status: string;
      paymentStatus: string;
      endDate: Date | null;
      faceValueCents: bigint;
      reserveBalanceCents: bigint;
      drift: boolean;
      transactionGroupId: string;
    };

    const rows: Row[] = await Promise.all(
      bounties.map(async (b) => {
        const [credit, debit, fundingGroup] = await Promise.all([
          this.prisma.ledgerEntry.aggregate({
            where: { bountyId: b.id, account: 'brand_reserve', type: 'CREDIT' },
            _sum: { amount: true },
          }),
          this.prisma.ledgerEntry.aggregate({
            where: { bountyId: b.id, account: 'brand_reserve', type: 'DEBIT' },
            _sum: { amount: true },
          }),
          this.prisma.ledgerTransactionGroup.findFirst({
            where: { actionType: 'brand_funding', entries: { some: { bountyId: b.id } } },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]);
        const balance = (credit._sum.amount ?? 0n) - (debit._sum.amount ?? 0n);
        const face = b.faceValueCents ?? 0n;
        // drift = live reserve doesn't match expected face value (and not zero,
        // which is the after-payout/after-release state).
        const drift = balance !== face && balance !== 0n;
        return {
          bountyId: b.id,
          title: b.title,
          brandId: b.brandId,
          status: b.status,
          paymentStatus: b.paymentStatus,
          endDate: b.endDate,
          faceValueCents: face,
          reserveBalanceCents: balance,
          drift,
          transactionGroupId: fundingGroup?.id ?? '',
        };
      }),
    );

    return this.toCsv(rows, [
      { key: 'bountyId', header: 'bountyId' },
      { key: 'title', header: 'title' },
      { key: 'brandId', header: 'brandId' },
      { key: 'status', header: 'status' },
      { key: 'paymentStatus', header: 'paymentStatus' },
      { key: 'endDate', header: 'endDate' },
      { key: 'faceValueCents', header: 'faceValueCents' },
      { key: 'reserveBalanceCents', header: 'reserveBalanceCents' },
      { key: 'drift', header: 'drift' },
      { key: 'transactionGroupId', header: 'transactionGroupId' },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Refunds: Refund rows with linked transactionGroup + Stitch reference.
  // ---------------------------------------------------------------------------
  async refundsCsv(): Promise<string> {
    const rows = await this.prisma.refund.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    return this.toCsv(rows, [
      { key: 'id', header: 'refundId' },
      { key: 'bountyId', header: 'bountyId' },
      { key: 'submissionId', header: 'submissionId' },
      { key: 'scenario', header: 'scenario' },
      { key: 'state', header: 'state' },
      { key: 'amountCents', header: 'amountCents' },
      { key: 'reason', header: 'reason' },
      { key: 'requestedByUserId', header: 'requestedByUserId' },
      { key: 'approvedByUserId', header: 'approvedByUserId' },
      { key: 'dualApprovalByUserId', header: 'dualApprovalByUserId' },
      { key: 'kbEntryId', header: 'kbEntryId' },
      // Refund.stitchRefundId column dropped in the 2026-04-24 migration.
      // External refund references now flow via the compensating ledger group
      // (Refund.transactionGroupId) per ADR 0011 refund handling.
      { key: 'transactionGroupId', header: 'transactionGroupId' },
      { key: 'createdAt', header: 'createdAt' },
      { key: 'updatedAt', header: 'updatedAt' },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Ledger: all entries since a given ISO timestamp (bounded).
  // ---------------------------------------------------------------------------
  async ledgerCsv(sinceIso?: string): Promise<string> {
    // Default window: last 30 days. Cap at 50k rows for memory safety.
    const since = sinceIso ? new Date(sinceIso) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    if (isNaN(since.getTime())) {
      throw new Error(`invalid 'since' parameter: ${sinceIso}`);
    }
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      take: 50_000,
    });

    return this.toCsv(entries, [
      { key: 'id', header: 'entryId' },
      { key: 'transactionGroupId', header: 'transactionGroupId' },
      { key: 'referenceId', header: 'referenceId' },
      { key: 'referenceType', header: 'referenceType' },
      { key: 'actionType', header: 'actionType' },
      { key: 'account', header: 'account' },
      {
        key: 'type',
        header: 'type',
        value: (e) => (e.type === LedgerEntryType.CREDIT ? 'CREDIT' : 'DEBIT'),
      },
      { key: 'amount', header: 'amountCents' },
      { key: 'currency', header: 'currency' },
      { key: 'status', header: 'status' },
      { key: 'userId', header: 'userId' },
      { key: 'brandId', header: 'brandId' },
      { key: 'bountyId', header: 'bountyId' },
      { key: 'submissionId', header: 'submissionId' },
      { key: 'externalReference', header: 'externalReference' },
      { key: 'clearanceReleaseAt', header: 'clearanceReleaseAt' },
      { key: 'createdAt', header: 'createdAt' },
    ]);
  }
}
