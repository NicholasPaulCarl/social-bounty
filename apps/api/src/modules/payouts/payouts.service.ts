import {
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JobRunStatus,
  LedgerAccount,
  LedgerEntryType,
  StitchPayoutStatus,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { StitchClient } from '../stitch/stitch.client';
import { WalletProjectionService } from '../wallet/wallet-projection.service';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly minPayoutCents: bigint;
  private readonly speed: 'INSTANT' | 'DEFAULT';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly stitch: StitchClient,
    private readonly projection: WalletProjectionService,
    private readonly config: ConfigService,
  ) {
    const raw = this.config.get<string>('STITCH_MIN_PAYOUT_CENTS', '2000');
    this.minPayoutCents = BigInt(raw);
    this.speed = (this.config.get<string>('STITCH_PAYOUT_SPEED', 'DEFAULT') as
      | 'INSTANT'
      | 'DEFAULT');
  }

  /**
   * Resolve the STITCH_SYSTEM_ACTOR_ID — required because AuditLog.actorId has
   * a FK to users.id. Previously this passed 'payout-job' which would fail the
   * FK constraint (mirrors the brand-funding bug).
   */
  private systemActorId(): string {
    const id = this.config.get<string>('STITCH_SYSTEM_ACTOR_ID', '');
    if (!id) {
      throw new Error(
        'STITCH_SYSTEM_ACTOR_ID is not set; payout jobs cannot write AuditLog rows',
      );
    }
    return id;
  }

  /**
   * Enumerates hunters with spare available balance, creates a StitchPayout row,
   * posts hunter_available → payout_in_transit, and calls Stitch. Payout settlement
   * (and the corresponding ledger move to hunter_paid) arrives via webhook.
   */
  async runBatch(batchSize = 100): Promise<{ initiated: number; skipped: number; failed: number }> {
    const jobRun = await this.prisma.jobRun.create({
      data: { jobName: 'payout-execution', status: JobRunStatus.STARTED },
    });

    let initiated = 0;
    let skipped = 0;
    let failed = 0;

    try {
      // Find hunters with a StitchBeneficiary and no in-flight payout.
      const eligibleBeneficiaries = await this.prisma.stitchBeneficiary.findMany({
        where: {
          isActive: true,
          user: {
            stitchPayouts: {
              none: {
                status: {
                  in: [
                    StitchPayoutStatus.CREATED,
                    StitchPayoutStatus.INITIATED,
                    StitchPayoutStatus.RETRY_PENDING,
                  ],
                },
              },
            },
          },
        },
        take: batchSize,
      });

      for (const bene of eligibleBeneficiaries) {
        const available = await this.projection.availableCents(bene.userId);
        if (available < this.minPayoutCents) {
          skipped += 1;
          continue;
        }

        try {
          await this.initiatePayout(bene.userId, bene.id, available);
          initiated += 1;
        } catch (err) {
          failed += 1;
          this.logger.error(
            `payout initiation failed for ${bene.userId}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: JobRunStatus.SUCCEEDED,
          finishedAt: new Date(),
          itemsSeen: eligibleBeneficiaries.length,
          itemsOk: initiated,
          itemsFailed: failed,
          details: { initiated, skipped, failed },
        },
      });
    } catch (err) {
      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: JobRunStatus.FAILED,
          finishedAt: new Date(),
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
    return { initiated, skipped, failed };
  }

  async initiatePayout(userId: string, beneficiaryId: string, amountCents: bigint) {
    // Stitch merchantReference + our Idempotency-Key: alphanumeric only.
    const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const userSlug = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const idempotencyKey = `payout${userSlug}${stamp}`;
    const merchantReference = `payout${userSlug}${stamp}`.slice(0, 50);

    const payout = await this.prisma.stitchPayout.create({
      data: {
        userId,
        beneficiaryId,
        merchantReference,
        amountCents,
        speed: this.speed,
        status: StitchPayoutStatus.CREATED,
        idempotencyKey,
      },
    });

    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: 'payout_initiated',
      referenceId: payout.id,
      referenceType: 'StitchPayout',
      description: `Payout initiated: hunter ${userId}`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.hunter_available,
          type: LedgerEntryType.DEBIT,
          amountCents,
          userId,
        },
        {
          account: LedgerAccount.payout_in_transit,
          type: LedgerEntryType.CREDIT,
          amountCents,
          userId,
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'PAYOUT_INITIATED',
        entityType: 'StitchPayout',
        entityId: payout.id,
        afterState: { amountCents: amountCents.toString() },
      },
    });

    try {
      const stitchResult = await this.stitch.createPayout(
        { amountCents, beneficiaryId: payout.beneficiaryId, merchantReference, speed: this.speed },
        idempotencyKey,
      );
      await this.prisma.stitchPayout.update({
        where: { id: payout.id },
        data: {
          stitchPayoutId: stitchResult.id,
          status: StitchPayoutStatus.INITIATED,
          lastAttemptAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    } catch (err) {
      await this.prisma.stitchPayout.update({
        where: { id: payout.id },
        data: {
          status: StitchPayoutStatus.FAILED,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          lastError: err instanceof Error ? err.message : String(err),
          nextRetryAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // Compensating entry so balance returns to hunter_available.
      await this.ledger.postTransactionGroup({
        actionType: 'stitch_payout_failed',
        referenceId: payout.id, // use internal id since no stitchPayoutId yet
        referenceType: 'StitchPayout',
        description: `Payout dispatch failed: ${err instanceof Error ? err.message : 'unknown'}`,
        postedBy: actorId,
        legs: [
          {
            account: LedgerAccount.payout_in_transit,
            type: LedgerEntryType.DEBIT,
            amountCents,
            userId,
          },
          {
            account: LedgerAccount.hunter_available,
            type: LedgerEntryType.CREDIT,
            amountCents,
            userId,
          },
        ],
        audit: {
          actorId,
          actorRole: UserRole.SUPER_ADMIN,
          action: 'PAYOUT_DISPATCH_FAILED',
          entityType: 'StitchPayout',
          entityId: payout.id,
        },
      });
      throw err;
    }
  }

  async retryBatch(batchSize = 50): Promise<{ retried: number }> {
    const now = new Date();
    const candidates = await this.prisma.stitchPayout.findMany({
      where: {
        status: StitchPayoutStatus.FAILED,
        attempts: { lt: 3 },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      take: batchSize,
    });
    let retried = 0;
    for (const p of candidates) {
      try {
        const result = await this.stitch.createPayout(
          {
            amountCents: p.amountCents,
            beneficiaryId: p.beneficiaryId,
            merchantReference: p.merchantReference,
            speed: (p.speed as 'INSTANT' | 'DEFAULT') ?? 'DEFAULT',
          },
          p.idempotencyKey,
        );
        await this.prisma.stitchPayout.update({
          where: { id: p.id },
          data: {
            stitchPayoutId: result.id,
            status: StitchPayoutStatus.INITIATED,
            attempts: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        });
        retried += 1;
      } catch (err) {
        const attempts = p.attempts + 1;
        await this.prisma.stitchPayout.update({
          where: { id: p.id },
          data: {
            attempts,
            lastAttemptAt: new Date(),
            lastError: err instanceof Error ? err.message : String(err),
            status: attempts >= 3 ? StitchPayoutStatus.RETRY_PENDING : StitchPayoutStatus.FAILED,
            nextRetryAt: attempts >= 3 ? null : new Date(Date.now() + 2 ** attempts * 60 * 60 * 1000),
          },
        });
      }
    }
    return { retried };
  }

  async onPayoutSettled(stitchPayoutId: string): Promise<void> {
    const payout = await this.prisma.stitchPayout.findUnique({
      where: { stitchPayoutId },
    });
    if (!payout) {
      this.logger.warn(`payout.settled for unknown stitchPayoutId=${stitchPayoutId}`);
      return;
    }
    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: 'stitch_payout_settled',
      referenceId: stitchPayoutId,
      referenceType: 'StitchPayout',
      description: `Payout settled: ${payout.id}`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.payout_in_transit,
          type: LedgerEntryType.DEBIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: stitchPayoutId,
        },
        {
          account: LedgerAccount.hunter_paid,
          type: LedgerEntryType.CREDIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: stitchPayoutId,
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'PAYOUT_SETTLED',
        entityType: 'StitchPayout',
        entityId: payout.id,
      },
    });
    await this.prisma.stitchPayout.update({
      where: { id: payout.id },
      data: { status: StitchPayoutStatus.SETTLED },
    });
  }

  async onPayoutFailed(stitchPayoutId: string, reason: string): Promise<void> {
    const payout = await this.prisma.stitchPayout.findUnique({
      where: { stitchPayoutId },
    });
    if (!payout) {
      this.logger.warn(`payout.failed for unknown stitchPayoutId=${stitchPayoutId}`);
      return;
    }
    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: 'stitch_payout_failed',
      referenceId: stitchPayoutId,
      referenceType: 'StitchPayout',
      description: `Payout failed: ${reason}`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.payout_in_transit,
          type: LedgerEntryType.DEBIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: stitchPayoutId,
        },
        {
          account: LedgerAccount.hunter_available,
          type: LedgerEntryType.CREDIT,
          amountCents: payout.amountCents,
          userId: payout.userId,
          externalReference: stitchPayoutId,
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'PAYOUT_FAILED',
        entityType: 'StitchPayout',
        entityId: payout.id,
        reason,
      },
    });
    const attempts = payout.attempts + 1;
    await this.prisma.stitchPayout.update({
      where: { id: payout.id },
      data: {
        status: attempts >= 3 ? StitchPayoutStatus.RETRY_PENDING : StitchPayoutStatus.FAILED,
        attempts,
        lastAttemptAt: new Date(),
        lastError: reason,
        nextRetryAt: attempts >= 3 ? null : new Date(Date.now() + 2 ** attempts * 60 * 60 * 1000),
      },
    });
  }

  /**
   * List this hunter's StitchPayout rows, newest first. Returns a shape safe
   * to hand back over HTTP: bigint cents → string.
   */
  async listForUser(userId: string) {
    const rows = await this.prisma.stitchPayout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        lastAttemptAt: true,
        stitchPayoutId: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      amountCents: r.amountCents.toString(),
      currency: r.currency,
      status: r.status,
      attempts: r.attempts,
      lastError: r.lastError,
      createdAt: r.createdAt.toISOString(),
      lastAttemptAt: r.lastAttemptAt ? r.lastAttemptAt.toISOString() : null,
      stitchPayoutId: r.stitchPayoutId,
    }));
  }

  async adminRetry(payoutId: string, actor: { role: string; sub: string }) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can retry payouts');
    }
    const payout = await this.prisma.stitchPayout.findUnique({ where: { id: payoutId } });
    if (!payout) return { retried: false };
    // Reset the retry clock + count and let the retry batch pick it up.
    await this.prisma.stitchPayout.update({
      where: { id: payoutId },
      data: { status: StitchPayoutStatus.FAILED, attempts: 0, nextRetryAt: new Date() },
    });
    return { retried: true };
  }
}
