import { Controller, Get, Post, Query } from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { SubscriptionsService } from './subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('subscription')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getSubscription(
      user.sub,
      user.role as UserRole,
      user.organisationId ?? undefined,
    );
  }

  @Post('subscribe')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async subscribe(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.subscribe(
      user.sub,
      user.role as UserRole,
      user.organisationId ?? undefined,
    );
  }

  @Post('cancel')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.cancel(
      user.sub,
      user.role as UserRole,
      user.organisationId ?? undefined,
    );
  }

  @Post('reactivate')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async reactivate(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.reactivate(
      user.sub,
      user.role as UserRole,
      user.organisationId ?? undefined,
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
      user.organisationId ?? undefined,
      { page, limit },
    );
  }
}
