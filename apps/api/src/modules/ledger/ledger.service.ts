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

// The Financial Kill Switch is a DB row — never an env var.
// A stale `FINANCIAL_KILL_SWITCH` env var was removed 2026-04-15 (orphan
// sweep C2): it was declared and seeded but read by nobody, which meant
// operators flipping it believed payments were halted when they weren't.
// Toggle via LedgerService.setKillSwitch / the Finance admin dashboard.
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

    // Fast-path idempotency pre-check (ADR 0005). Safe to run against either
    // the outer client or the caller's tx — it's a pure read. We cannot do
    // this check *after* a failed insert inside the same tx: Postgres marks
    // the transaction as aborted (SQLSTATE 25P02) and rejects all subsequent
    // queries, which historically manifested as a crashloop in ClearanceService.
    const idempotencyClient = existingTx ?? this.prisma;
    const existing = await idempotencyClient.ledgerTransactionGroup.findUnique({
      where: {
        referenceId_actionType: {
          referenceId: input.referenceId,
          actionType: input.actionType,
        },
      },
    });
    if (existing) {
      return { transactionGroupId: existing.id, idempotent: true };
    }

    const run = async (tx: TxClient) => this.runInTx(tx, input);
    if (existingTx) {
      // Caller owns the tx. If a concurrent writer races us between the
      // pre-check above and the create below, we'll throw P2002 and the
      // caller's whole tx will be aborted — which is the correct outcome:
      // they must decide how to handle a lost race, we can't do it for them.
      return run(existingTx);
    }
    try {
      return await this.prisma.$transaction(run);
    } catch (err) {
      // We own the tx. If a concurrent writer won the race between the
      // pre-check and our create, the tx is rolled back and the P2002 has
      // surfaced here — re-read with the outer client (tx is gone) and
      // return idempotent.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const raced = await this.prisma.ledgerTransactionGroup.findUnique({
          where: {
            referenceId_actionType: {
              referenceId: input.referenceId,
              actionType: input.actionType,
            },
          },
        });
        if (raced) return { transactionGroupId: raced.id, idempotent: true };
      }
      throw err;
    }
  }

  private async runInTx(
    tx: TxClient,
    input: PostTransactionGroupInput,
  ): Promise<PostTransactionGroupResult> {
    // Create the group header. If another writer snuck in between our
    // caller's pre-check and this create, P2002 will bubble up; recovery
    // (re-read + return idempotent) happens in postTransactionGroup AFTER
    // the tx has rolled back.
    const group = await tx.ledgerTransactionGroup.create({
      data: {
        referenceId: input.referenceId,
        actionType: input.actionType,
        description: input.description,
      },
    });
    const groupId = group.id;

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
