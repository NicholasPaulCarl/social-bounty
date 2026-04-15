import { Injectable, Logger } from '@nestjs/common';
import {
  JobRunStatus,
  LedgerAccount,
  LedgerEntryStatus,
  LedgerEntryType,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';

@Injectable()
export class ClearanceService {
  private readonly logger = new Logger(ClearanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Finds hunter_net_payable entries whose clearanceReleaseAt has passed and that
   * have not yet been released, and posts hunter_net_payable → hunter_available
   * for each one.
   *
   * Idempotent via action=clearance_released, referenceId=<hunterNetPayableLegId>.
   * If called twice concurrently, the UNIQUE(referenceId, actionType) constraint
   * on LedgerTransactionGroup stops the second from double-crediting.
   */
  async releaseEligible(batchSize = 200): Promise<{ released: number; skipped: number }> {
    const jobRun = await this.prisma.jobRun.create({
      data: { jobName: 'clearance-release', status: JobRunStatus.STARTED },
    });

    let released = 0;
    let skipped = 0;
    try {
      const now = new Date();
      const candidates = await this.prisma.ledgerEntry.findMany({
        where: {
          account: LedgerAccount.hunter_net_payable,
          type: LedgerEntryType.CREDIT,
          status: LedgerEntryStatus.COMPLETED,
          clearanceReleaseAt: { lte: now },
        },
        take: batchSize,
        orderBy: { clearanceReleaseAt: 'asc' },
      });

      for (const entry of candidates) {
        try {
          const res = await this.ledger.postTransactionGroup({
            actionType: 'clearance_released',
            referenceId: entry.id,
            referenceType: 'LedgerEntry',
            description: `Clearance released for hunter ${entry.userId} (entry ${entry.id})`,
            postedBy: 'clearance-job',
            currency: entry.currency,
            legs: [
              {
                account: LedgerAccount.hunter_net_payable,
                type: LedgerEntryType.DEBIT,
                amountCents: entry.amount,
                userId: entry.userId ?? undefined,
                submissionId: entry.submissionId ?? undefined,
                parentEntryId: entry.id,
              },
              {
                account: LedgerAccount.hunter_available,
                type: LedgerEntryType.CREDIT,
                amountCents: entry.amount,
                userId: entry.userId ?? undefined,
                submissionId: entry.submissionId ?? undefined,
              },
            ],
            audit: {
              actorId: 'clearance-job',
              actorRole: UserRole.SUPER_ADMIN,
              action: 'CLEARANCE_RELEASED',
              entityType: 'LedgerEntry',
              entityId: entry.id,
            },
          });
          if (res.idempotent) skipped += 1;
          else released += 1;
        } catch (err) {
          this.logger.error(
            `clearance release failed for entry ${entry.id}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: JobRunStatus.SUCCEEDED,
          finishedAt: new Date(),
          itemsSeen: candidates.length,
          itemsOk: released,
          itemsFailed: candidates.length - released - skipped,
          details: { released, skipped },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: { status: JobRunStatus.FAILED, finishedAt: new Date(), error: message },
      });
      throw err;
    }
    return { released, skipped };
  }
}
