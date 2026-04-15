import { Injectable } from '@nestjs/common';
import { LedgerAccount, LedgerEntryStatus, LedgerEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Computes hunter wallet balances from the LedgerEntry table — the future
 * source of truth per ADR 0002. For Phase 1 this runs alongside the legacy
 * Wallet cached balance; reconciliation compares the two. Phase 2 swaps the
 * primary read path over once the approval writer populates `hunter_pending`
 * and `hunter_available`.
 */
@Injectable()
export class WalletProjectionService {
  constructor(private readonly prisma: PrismaService) {}

  async availableCents(userId: string): Promise<bigint> {
    return this.netBalance(userId, LedgerAccount.hunter_available);
  }

  async pendingCents(userId: string): Promise<bigint> {
    const [pending, clearing, netPayable] = await Promise.all([
      this.netBalance(userId, LedgerAccount.hunter_pending),
      this.netBalance(userId, LedgerAccount.hunter_clearing),
      this.netBalance(userId, LedgerAccount.hunter_net_payable),
    ]);
    return pending + clearing + netPayable;
  }

  async paidCents(userId: string): Promise<bigint> {
    return this.netBalance(userId, LedgerAccount.hunter_paid);
  }

  async snapshot(userId: string) {
    const [available, pending, paid] = await Promise.all([
      this.availableCents(userId),
      this.pendingCents(userId),
      this.paidCents(userId),
    ]);
    return { availableCents: available, pendingCents: pending, paidCents: paid };
  }

  private async netBalance(userId: string, account: LedgerAccount): Promise<bigint> {
    const [credits, debits] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: {
          userId,
          account,
          status: LedgerEntryStatus.COMPLETED,
          type: LedgerEntryType.CREDIT,
        },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          userId,
          account,
          status: LedgerEntryStatus.COMPLETED,
          type: LedgerEntryType.DEBIT,
        },
        _sum: { amount: true },
      }),
    ]);
    return (credits._sum.amount ?? 0n) - (debits._sum.amount ?? 0n);
  }
}
