import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly config: ConfigService,
  ) {}

  /**
   * Resolve the SYSTEM_ACTOR_ID — required because AuditLog.actorId has
   * a FK to users.id. Previously this passed the string 'clearance-job' which
   * would fail the FK constraint (mirrors the brand-funding bug).
   */
  private systemActorId(): string {
    const id = this.config.get<string>('SYSTEM_ACTOR_ID', '');
    if (!id) {
      throw new Error(
        'SYSTEM_ACTOR_ID is not set; scheduled clearance cannot write AuditLog rows',
      );
    }
    return id;
  }

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

      const actorId = this.systemActorId();
      for (const entry of candidates) {
        try {
          const res = await this.ledger.postTransactionGroup({
            actionType: 'clearance_released',
            referenceId: entry.id,
            referenceType: 'LedgerEntry',
            description: `Clearance released for hunter ${entry.userId} (entry ${entry.id})`,
            postedBy: actorId,
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
              actorId,
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
