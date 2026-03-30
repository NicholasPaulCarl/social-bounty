import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, WalletTxType, WithdrawalStatus } from '@social-bounty/shared';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';
import {
  RequestWithdrawalDto,
  AdminAdjustWalletDto,
  AdminCompleteWithdrawalDto,
  AdminFailWithdrawalDto,
} from './dto/wallet.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class WalletController {
  constructor(
    private walletService: WalletService,
    private withdrawalService: WithdrawalService,
  ) {}

  // ── User Routes ─────────────────────────────────────────

  @Get('wallet')
  @Roles(UserRole.PARTICIPANT)
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getDashboard(user.sub);
  }

  @Get('wallet/transactions')
  @Roles(UserRole.PARTICIPANT)
  async getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: WalletTxType,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.walletService.getTransactions(user.sub, {
      page,
      limit,
      type,
      sortOrder,
    });
  }

  @Post('wallet/withdraw')
  @Roles(UserRole.PARTICIPANT)
  async requestWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.withdrawalService.requestWithdrawal(user.sub, dto);
  }

  @Get('wallet/withdrawals')
  @Roles(UserRole.PARTICIPANT)
  async listMyWithdrawals(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: WithdrawalStatus,
  ) {
    return this.withdrawalService.listUserWithdrawals(user.sub, {
      page,
      limit,
      status,
    });
  }

  @Patch('wallet/withdrawals/:id/cancel')
  @Roles(UserRole.PARTICIPANT)
  async cancelWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.withdrawalService.cancelWithdrawal(id, user.sub);
  }

  // ── Admin Routes ────────────────────────────────────────

  @Get('admin/wallets')
  @Roles(UserRole.SUPER_ADMIN)
  async adminListWallets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.walletService.adminListWallets({ page, limit, search });
  }

  @Get('admin/wallets/:userId')
  @Roles(UserRole.SUPER_ADMIN)
  async adminGetWallet(@Param('userId') userId: string) {
    return this.walletService.adminGetWallet(userId);
  }

  @Post('admin/wallets/:userId/adjust')
  @Roles(UserRole.SUPER_ADMIN)
  async adminAdjustWallet(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminAdjustWalletDto,
  ) {
    return this.walletService.adminAdjust(
      user.sub,
      userId,
      dto.amount,
      dto.reason,
    );
  }

  @Get('admin/withdrawals')
  @Roles(UserRole.SUPER_ADMIN)
  async adminListWithdrawals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: WithdrawalStatus,
    @Query('search') search?: string,
  ) {
    return this.withdrawalService.adminListWithdrawals({
      page,
      limit,
      status,
      search,
    });
  }

  @Patch('admin/withdrawals/:id/process')
  @Roles(UserRole.SUPER_ADMIN)
  async processWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.withdrawalService.processWithdrawal(id, user.sub);
  }

  @Patch('admin/withdrawals/:id/complete')
  @Roles(UserRole.SUPER_ADMIN)
  async completeWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminCompleteWithdrawalDto,
  ) {
    return this.withdrawalService.completeWithdrawal(
      id,
      user.sub,
      dto.proofUrl,
    );
  }

  @Patch('admin/withdrawals/:id/fail')
  @Roles(UserRole.SUPER_ADMIN)
  async failWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminFailWithdrawalDto,
  ) {
    return this.withdrawalService.failWithdrawal(id, user.sub, dto.reason);
  }
}
