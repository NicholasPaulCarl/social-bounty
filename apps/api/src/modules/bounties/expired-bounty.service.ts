import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  JobRunStatus,
  LedgerAccount,
  LedgerEntryType,
  SubmissionStatus,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

/**
 * Expired-bounty release job (payment-gateway.md §13).
 *
 * Daily: for every LIVE bounty whose endDate has passed with zero APPROVED
 * submissions, move the face-value reserve back to `brand_refundable` so the
 * brand can be refunded or re-allocate. Funds released here stop counting as
 * hunter-claimable — the bounty is effectively closed from a payment POV.
 *
 * Idempotency (Non-Negotiable #2): one ledger group per bounty keyed by
 *   (referenceId = bountyId, actionType = 'bounty_expired_release').
 * A second call returns the existing group with `idempotent: true`.
 *
 * Recipe:
 *   DEBIT  brand_reserve      by faceValueCents  (tagged with brandId, bountyId)
 *   CREDIT brand_refundable   by faceValueCents  (tagged with brandId, bountyId)
 */
@Injectable()
export class ExpiredBountyService {
  private readonly logger = new Logger(ExpiredBountyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * AuditLog.actorId FKs to users.id, so we must pass a real system-actor user,
   * not a string like 'expired-bounty-job' (same pattern as ClearanceService).
   */
  private systemActorId(): string {
    const id = this.config.get<string>('SYSTEM_ACTOR_ID', '');
    if (!id) {
      throw new Error(
        'SYSTEM_ACTOR_ID is not set; expired-bounty release cannot write AuditLog rows',
      );
    }
    return id;
  }

  async releaseEligible(
    batchSize = 200,
  ): Promise<{ released: number; skipped: number; ineligible: number }> {
    const jobRun = await this.prisma.jobRun.create({
      data: { jobName: 'expired-bounty-release', status: JobRunStatus.STARTED },
    });

    let released = 0;
    let skipped = 0;
    let ineligible = 0;

    try {
      const now = new Date();
      // Candidate set: LIVE bounties past endDate with a face value. We include
      // bounties with approved submissions in this first query and filter them
      // out afterwards so the job can log ineligibility in the JobRun details.
      const candidates = await this.prisma.bounty.findMany({
        where: {
          status: BountyStatus.LIVE,
          endDate: { lt: now },
          faceValueCents: { not: null },
          deletedAt: null,
        },
        select: {
          id: true,
          brandId: true,
          faceValueCents: true,
          _count: {
            select: {
              submissions: { where: { status: SubmissionStatus.APPROVED } },
            },
          },
        },
        take: batchSize,
        orderBy: { endDate: 'asc' },
      });

      const actorId = this.systemActorId();

      for (const bounty of candidates) {
        // Skip bounties with any approved submission — their reserve is already
        // being worked down by the payout pipeline. We only release truly
        // unallocated reserve.
        if (bounty._count.submissions > 0) {
          ineligible += 1;
          continue;
        }
        if (bounty.faceValueCents === null) {
          ineligible += 1;
          continue;
        }

        try {
          const result = await this.ledger.postTransactionGroup({
            actionType: 'bounty_expired_release',
            referenceId: bounty.id,
            referenceType: 'Bounty',
            description: `Expired-bounty release for ${bounty.id}`,
            postedBy: actorId,
            legs: [
              {
                account: LedgerAccount.brand_reserve,
                type: LedgerEntryType.DEBIT,
                amountCents: bounty.faceValueCents,
                brandId: bounty.brandId,
                bountyId: bounty.id,
              },
              {
                account: LedgerAccount.brand_refundable,
                type: LedgerEntryType.CREDIT,
                amountCents: bounty.faceValueCents,
                brandId: bounty.brandId,
                bountyId: bounty.id,
              },
            ],
            audit: {
              actorId,
              actorRole: UserRole.SUPER_ADMIN,
              action: 'BOUNTY_EXPIRED_RELEASE',
              entityType: 'Bounty',
              entityId: bounty.id,
              reason: 'Bounty endDate passed with no approved submissions',
              afterState: {
                bountyId: bounty.id,
                brandId: bounty.brandId,
                releasedCents: bounty.faceValueCents.toString(),
              },
            },
          });
          if (result.idempotent) skipped += 1;
          else released += 1;
        } catch (err) {
          this.logger.error(
            `expired-bounty release failed for ${bounty.id}: ${err instanceof Error ? err.message : err}`,
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
          itemsFailed: candidates.length - released - skipped - ineligible,
          details: { released, skipped, ineligible },
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

    return { released, skipped, ineligible };
  }
}
