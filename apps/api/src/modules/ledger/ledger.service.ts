import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  Currency,
  LedgerAccount,
  LedgerEntryStatus,
  LedgerEntryType,
  Prisma,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

const KILL_SWITCH_KEY = 'financial.kill_switch.active';

export interface PostLedgerLeg {
  account: LedgerAccount;
  type: LedgerEntryType;
  amountCents: bigint;
  userId?: string | null;
  brandId?: string | null;
  bountyId?: string | null;
  submissionId?: string | null;
  externalReference?: string | null;
  parentEntryId?: string | null;
  clearanceReleaseAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface PostLedgerAudit {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

export interface PostTransactionGroupInput {
  actionType: string;
  referenceId: string;
  referenceType: string;
  description: string;
  legs: PostLedgerLeg[];
  audit: PostLedgerAudit;
  postedBy: string;
  currency?: Currency;
  // If true, the write bypasses the Kill Switch (Super Admin compensating entries only).
  allowDuringKillSwitch?: boolean;
}

export interface PostTransactionGroupResult {
  transactionGroupId: string;
  idempotent: boolean;
}

export class LedgerImbalanceError extends Error {
  constructor(debitCents: bigint, creditCents: bigint) {
    super(`ledger group unbalanced: debits=${debitCents} credits=${creditCents}`);
    this.name = 'LedgerImbalanceError';
  }
}

export class KillSwitchActiveError extends ForbiddenException {
  constructor() {
    super('financial kill switch is active');
  }
}

type TxClient = Prisma.TransactionClient;

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Post a balanced double-entry transaction group. All legs commit or roll back together.
   *
   * Idempotency: if a group already exists for (referenceId, actionType), returns that
   * existing transactionGroupId with `idempotent: true` and writes no new entries.
   *
   * Financial Non-Negotiables enforced here:
   *  #2 idempotency via UNIQUE(referenceId, actionType) on LedgerTransactionGroup
   *  #3 transaction group integrity via single $transaction
   *  #5 append-only (we only INSERT; REVERSED status is set via compensating entries)
   *  #6 AuditLog written in the same tx
   *  #1 sum(debits) === sum(credits) pre-validation
   */
  async postTransactionGroup(
    input: PostTransactionGroupInput,
    existingTx?: TxClient,
  ): Promise<PostTransactionGroupResult> {
    if (input.legs.length === 0) {
      throw new Error('postTransactionGroup: must have at least one leg');
    }

    // Validate balance (Non-Negotiable #1).
    let debit = 0n;
    let credit = 0n;
    for (const leg of input.legs) {
      if (leg.amountCents <= 0n) {
        throw new Error('postTransactionGroup: leg.amountCents must be positive');
      }
      if (leg.type === LedgerEntryType.DEBIT) debit += leg.amountCents;
      else credit += leg.amountCents;
    }
    if (debit !== credit) {
      throw new LedgerImbalanceError(debit, credit);
    }

    if (!input.allowDuringKillSwitch) {
      const active = await this.isKillSwitchActive(existingTx);
      if (active) throw new KillSwitchActiveError();
    }

    const run = async (tx: TxClient) => this.runInTx(tx, input);
    if (existingTx) return run(existingTx);
    return this.prisma.$transaction(run);
  }

  private async runInTx(
    tx: TxClient,
    input: PostTransactionGroupInput,
  ): Promise<PostTransactionGroupResult> {
    // Header-table idempotency: try to insert, catch P2002, return existing (ADR 0005).
    let groupId: string;
    try {
      const group = await tx.ledgerTransactionGroup.create({
        data: {
          referenceId: input.referenceId,
          actionType: input.actionType,
          description: input.description,
        },
      });
      groupId = group.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await tx.ledgerTransactionGroup.findUnique({
          where: {
            referenceId_actionType: {
              referenceId: input.referenceId,
              actionType: input.actionType,
            },
          },
        });
        if (!existing) throw err;
        return { transactionGroupId: existing.id, idempotent: true };
      }
      throw err;
    }

    // Write audit log in the same transaction (Non-Negotiable #6).
    const audit = await tx.auditLog.create({
      data: {
        actorId: input.audit.actorId,
        actorRole: input.audit.actorRole,
        action: input.audit.action,
        entityType: input.audit.entityType,
        entityId: input.audit.entityId,
        beforeState: (input.audit.beforeState as Prisma.InputJsonValue) ?? undefined,
        afterState: (input.audit.afterState as Prisma.InputJsonValue) ?? undefined,
        reason: input.audit.reason ?? undefined,
      },
    });

    await tx.ledgerTransactionGroup.update({
      where: { id: groupId },
      data: { auditLogId: audit.id },
    });

    const currency = input.currency ?? Currency.ZAR;
    await tx.ledgerEntry.createMany({
      data: input.legs.map((leg) => ({
        transactionGroupId: groupId,
        userId: leg.userId ?? null,
        brandId: leg.brandId ?? null,
        bountyId: leg.bountyId ?? null,
        submissionId: leg.submissionId ?? null,
        account: leg.account,
        type: leg.type,
        amount: leg.amountCents,
        currency,
        status: LedgerEntryStatus.COMPLETED,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        actionType: input.actionType,
        externalReference: leg.externalReference ?? null,
        parentEntryId: leg.parentEntryId ?? null,
        clearanceReleaseAt: leg.clearanceReleaseAt ?? null,
        metadata: (leg.metadata as Prisma.InputJsonValue) ?? undefined,
        postedBy: input.postedBy,
        auditLogId: audit.id,
      })),
    });

    return { transactionGroupId: groupId, idempotent: false };
  }

  async isKillSwitchActive(tx?: TxClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const row = await client.systemSetting.findUnique({ where: { key: KILL_SWITCH_KEY } });
    return row?.value === 'true';
  }

  async setKillSwitch(active: boolean, actor: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key: KILL_SWITCH_KEY },
      update: { value: active ? 'true' : 'false', updatedBy: actor, type: 'boolean' },
      create: {
        key: KILL_SWITCH_KEY,
        value: active ? 'true' : 'false',
        updatedBy: actor,
        type: 'boolean',
      },
    });
  }
}
