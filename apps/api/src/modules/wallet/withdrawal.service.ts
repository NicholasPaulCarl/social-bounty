import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  WithdrawalStatus,
  UserRole,
  PAGINATION_DEFAULTS,
  WITHDRAWAL_LIMITS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from './wallet.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { RequestWithdrawalDto } from './dto/wallet.validators';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    // Validate max pending withdrawals
    const pendingCount = await this.prisma.withdrawal.count({
      where: {
        userId,
        status: {
          in: [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING],
        },
      },
    });

    if (pendingCount >= WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER) {
      throw new BadRequestException(
        `Maximum ${WITHDRAWAL_LIMITS.MAX_PENDING_PER_USER} pending withdrawals allowed`,
      );
    }

    // Get wallet to verify balance
    const wallet = await this.walletService.getOrCreateWallet(userId);

    if (wallet.balance.lessThan(dto.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create withdrawal and hold funds in a transaction
    const withdrawal = await this.prisma.$transaction(async (tx) => {
      const created = await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: dto.amount,
          currency: wallet.currency,
          method: dto.method,
          status: WithdrawalStatus.REQUESTED,
          destination: dto.destination as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    // Hold funds outside the creation tx (uses its own tx)
    await this.walletService.holdFunds(userId, dto.amount, withdrawal.id);

    this.auditService.log({
      actorId: userId,
      actorRole: UserRole.PARTICIPANT,
      action: AUDIT_ACTIONS.WITHDRAWAL_REQUEST,
      entityType: ENTITY_TYPES.WITHDRAWAL,
      entityId: withdrawal.id,
      afterState: {
        amount: dto.amount,
        method: dto.method,
      },
    });

    return this.formatWithdrawal(withdrawal);
  }

  async processWithdrawal(id: string, adminId: string) {
    const withdrawal = await this.findOrFail(id);

    if (withdrawal.status !== WithdrawalStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot process withdrawal in ${withdrawal.status} status`,
      );
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.PROCESSING,
        processedAt: new Date(),
      },
    });

    this.auditService.log({
      actorId: adminId,
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.WITHDRAWAL_PROCESS,
      entityType: ENTITY_TYPES.WITHDRAWAL,
      entityId: id,
      beforeState: { status: withdrawal.status },
      afterState: { status: WithdrawalStatus.PROCESSING },
    });

    return this.formatWithdrawal(updated);
  }

  async completeWithdrawal(
    id: string,
    adminId: string,
    proofUrl?: string,
  ) {
    const withdrawal = await this.findOrFail(id);

    if (withdrawal.status !== WithdrawalStatus.PROCESSING) {
      throw new BadRequestException(
        `Cannot complete withdrawal in ${withdrawal.status} status`,
      );
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.COMPLETED,
        proofUrl: proofUrl ?? null,
      },
    });

    await this.walletService.completeWithdrawal(
      withdrawal.userId,
      Number(withdrawal.amount),
      id,
    );

    this.auditService.log({
      actorId: adminId,
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.WITHDRAWAL_COMPLETE,
      entityType: ENTITY_TYPES.WITHDRAWAL,
      entityId: id,
      beforeState: { status: withdrawal.status },
      afterState: { status: WithdrawalStatus.COMPLETED },
    });

    // Send email notification
    const user = await this.prisma.user.findUnique({
      where: { id: withdrawal.userId },
      select: { email: true, firstName: true },
    });
    if (user) {
      this.mailService
        .sendPayoutNotificationEmail(user.email, {
          userName: user.firstName || 'Participant',
          bountyTitle: 'Wallet Withdrawal',
          amount: withdrawal.amount.toString(),
          currency: withdrawal.currency,
        })
        .catch((err) => {
          this.logger.error('Failed to send withdrawal completion email:', err);
        });
    }

    return this.formatWithdrawal(updated);
  }

  async failWithdrawal(id: string, adminId: string, reason: string) {
    const withdrawal = await this.findOrFail(id);

    if (
      withdrawal.status !== WithdrawalStatus.PROCESSING &&
      withdrawal.status !== WithdrawalStatus.REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot fail withdrawal in ${withdrawal.status} status`,
      );
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.FAILED,
        failureReason: reason,
      },
    });

    await this.walletService.releaseFunds(
      withdrawal.userId,
      Number(withdrawal.amount),
      id,
    );

    this.auditService.log({
      actorId: adminId,
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.WITHDRAWAL_FAIL,
      entityType: ENTITY_TYPES.WITHDRAWAL,
      entityId: id,
      beforeState: { status: withdrawal.status },
      afterState: { status: WithdrawalStatus.FAILED, reason },
    });

    // Send email notification
    const user = await this.prisma.user.findUnique({
      where: { id: withdrawal.userId },
      select: { email: true, firstName: true },
    });
    if (user) {
      this.mailService
        .sendPayoutNotificationEmail(user.email, {
          userName: user.firstName || 'Participant',
          bountyTitle: `Withdrawal Failed: ${reason}`,
          amount: withdrawal.amount.toString(),
          currency: withdrawal.currency,
        })
        .catch((err) => {
          this.logger.error('Failed to send withdrawal failure email:', err);
        });
    }

    return this.formatWithdrawal(updated);
  }

  async cancelWithdrawal(id: string, userId: string) {
    const withdrawal = await this.findOrFail(id);

    if (withdrawal.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this withdrawal');
    }

    if (withdrawal.status !== WithdrawalStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot cancel withdrawal in ${withdrawal.status} status`,
      );
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: WithdrawalStatus.CANCELLED },
    });

    await this.walletService.releaseFunds(
      userId,
      Number(withdrawal.amount),
      id,
    );

    this.auditService.log({
      actorId: userId,
      actorRole: UserRole.PARTICIPANT,
      action: AUDIT_ACTIONS.WITHDRAWAL_CANCEL,
      entityType: ENTITY_TYPES.WITHDRAWAL,
      entityId: id,
      beforeState: { status: withdrawal.status },
      afterState: { status: WithdrawalStatus.CANCELLED },
    });

    return this.formatWithdrawal(updated);
  }

  // ── Listing ─────────────────────────────────────────────

  async listUserWithdrawals(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      status?: WithdrawalStatus;
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.WithdrawalWhereInput = { userId };
    if (params.status) where.status = params.status;

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      data: withdrawals.map((w) => this.formatWithdrawal(w)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminListWithdrawals(params: {
    page?: number;
    limit?: number;
    status?: WithdrawalStatus;
    search?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.WithdrawalWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.user = {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      data: withdrawals.map((w) => ({
        ...this.formatWithdrawal(w),
        userId: w.userId,
        userName: `${w.user.firstName ?? ''} ${w.user.lastName ?? ''}`.trim(),
        userEmail: w.user.email,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Helpers ─────────────────────────────────────────────

  private async findOrFail(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  private formatWithdrawal(w: any) {
    return {
      id: w.id,
      amount: w.amount.toString(),
      currency: w.currency,
      method: w.method,
      status: w.status,
      destination: w.destination as Record<string, string>,
      processedAt: w.processedAt?.toISOString() ?? null,
      failureReason: w.failureReason ?? null,
      proofUrl: w.proofUrl ?? null,
      createdAt: w.createdAt.toISOString(),
    };
  }
}
