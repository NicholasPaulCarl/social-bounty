import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  WalletTxType,
  Currency,
  UserRole,
  PAGINATION_DEFAULTS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ── Core Wallet ─────────────────────────────────────────

  async getOrCreateWallet(userId: string, currency: Currency = Currency.ZAR) {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, currency },
      update: {},
    });
  }

  async creditWallet(
    userId: string,
    amount: number,
    description: string,
    referenceType: string,
    referenceId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx, userId);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const creditAmount = new Prisma.Decimal(amount);
      const balanceAfter = balanceBefore.add(creditAmount);

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.CREDIT,
          amount: creditAmount,
          description,
          referenceType,
          referenceId,
          balanceBefore,
          balanceAfter,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: creditAmount },
          totalEarned: { increment: creditAmount },
        },
      });

      return transaction;
    });
  }

  async holdFunds(userId: string, amount: number, withdrawalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx, userId);
      const holdAmount = new Prisma.Decimal(amount);

      if (wallet.balance.lessThan(holdAmount)) {
        throw new BadRequestException('Insufficient balance');
      }

      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore.sub(holdAmount);

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.HOLD,
          amount: holdAmount,
          description: `Funds held for withdrawal ${withdrawalId}`,
          referenceType: 'WITHDRAWAL',
          referenceId: withdrawalId,
          balanceBefore,
          balanceAfter,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: holdAmount },
          pendingBalance: { increment: holdAmount },
        },
      });

      return transaction;
    });
  }

  async releaseFunds(userId: string, amount: number, withdrawalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx, userId);
      const releaseAmount = new Prisma.Decimal(amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore.add(releaseAmount);

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.RELEASE,
          amount: releaseAmount,
          description: `Funds released from withdrawal ${withdrawalId}`,
          referenceType: 'WITHDRAWAL',
          referenceId: withdrawalId,
          balanceBefore,
          balanceAfter,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: releaseAmount },
          pendingBalance: { decrement: releaseAmount },
        },
      });

      return transaction;
    });
  }

  async completeWithdrawal(
    userId: string,
    amount: number,
    withdrawalId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx, userId);
      const debitAmount = new Prisma.Decimal(amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore; // balance unchanged, funds already held

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.DEBIT,
          amount: debitAmount,
          description: `Withdrawal ${withdrawalId} completed`,
          referenceType: 'WITHDRAWAL',
          referenceId: withdrawalId,
          balanceBefore,
          balanceAfter,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { decrement: debitAmount },
          totalWithdrawn: { increment: debitAmount },
        },
      });

      return transaction;
    });
  }

  // ── Queries ─────────────────────────────────────────────

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const available = new Prisma.Decimal(wallet.balance);
    const pending = new Prisma.Decimal(wallet.pendingBalance);

    return {
      available: available.toString(),
      pending: pending.toString(),
      total: available.add(pending).toString(),
      totalEarned: wallet.totalEarned.toString(),
      totalWithdrawn: wallet.totalWithdrawn.toString(),
      currency: wallet.currency,
    };
  }

  async getTransactions(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      type?: WalletTxType;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const wallet = await this.getOrCreateWallet(userId);
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
    };
    if (params.type) where.type = params.type;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: params.sortOrder || 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboard(userId: string) {
    const [balance, wallet] = await Promise.all([
      this.getBalance(userId),
      this.getOrCreateWallet(userId),
    ]);

    const recentTransactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      balance,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  // ── Admin ───────────────────────────────────────────────

  async adminAdjust(
    adminId: string,
    userId: string,
    amount: number,
    reason: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx, userId);
      const adjustAmount = new Prisma.Decimal(amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore.add(adjustAmount);

      if (balanceAfter.lessThan(0)) {
        throw new BadRequestException(
          'Adjustment would result in negative balance',
        );
      }

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.CORRECTION,
          amount: adjustAmount.abs(),
          description: reason,
          referenceType: 'CORRECTION',
          referenceId: `admin-${adminId}`,
          balanceBefore,
          balanceAfter,
        },
      });

      const updateData: Prisma.WalletUpdateInput = {
        balance: balanceAfter,
      };
      if (amount > 0) {
        updateData.totalEarned = { increment: adjustAmount };
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: updateData,
      });

      return transaction;
    });

    this.auditService.log({
      actorId: adminId,
      actorRole: UserRole.SUPER_ADMIN,
      action: AUDIT_ACTIONS.WALLET_ADJUST,
      entityType: ENTITY_TYPES.WALLET,
      entityId: userId,
      afterState: { amount, reason },
    });

    return result;
  }

  async adminListWallets(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.WalletWhereInput = {};
    if (params.search) {
      where.user = {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
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
      this.prisma.wallet.count({ where }),
    ]);

    return {
      data: wallets.map((w) => ({
        userId: w.userId,
        userName: `${w.user.firstName ?? ''} ${w.user.lastName ?? ''}`.trim(),
        userEmail: w.user.email,
        balance: w.balance.toString(),
        pendingBalance: w.pendingBalance.toString(),
        totalEarned: w.totalEarned.toString(),
        totalWithdrawn: w.totalWithdrawn.toString(),
        currency: w.currency,
        createdAt: w.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        transactions: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return {
      userId: wallet.userId,
      userName:
        `${wallet.user.firstName ?? ''} ${wallet.user.lastName ?? ''}`.trim(),
      userEmail: wallet.user.email,
      balance: wallet.balance.toString(),
      pendingBalance: wallet.pendingBalance.toString(),
      totalEarned: wallet.totalEarned.toString(),
      totalWithdrawn: wallet.totalWithdrawn.toString(),
      currency: wallet.currency,
      createdAt: wallet.createdAt.toISOString(),
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  // ── Helpers ─────────────────────────────────────────────

  private async ensureWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: Currency = Currency.ZAR,
  ) {
    return tx.wallet.upsert({
      where: { userId },
      create: { userId, currency },
      update: {},
    });
  }
}
