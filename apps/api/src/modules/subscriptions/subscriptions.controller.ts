import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { SubscriptionsService } from './subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

interface RequestWithIp {
  ip?: string;
}

@Controller('subscription')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getSubscription(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  @Post('subscribe')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async subscribe(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.subscribe(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  @Post('cancel')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithIp,
    @Body() body?: { immediate?: boolean },
  ) {
    return this.subscriptionsService.cancel(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
      {
        immediate: body?.immediate === true,
        actorId: user.sub,
        actorRole: user.role as UserRole,
        ipAddress: req?.ip ?? null,
      },
    );
  }

  @Post('reactivate')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async reactivate(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.reactivate(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  @Get('payments')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async getPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionsService.getPaymentHistory(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
      { page, limit },
    );
  }
}
