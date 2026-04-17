import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { CurrentUser, Roles } from '../../common/decorators';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

interface RequestWithIp {
  ip?: string;
}

/**
 * Finance Admin subscription routes.
 *
 * RBAC: SUPER_ADMIN only (per claude.md Hard Rule #2). Lives in the
 * finance-admin module — separate from the participant/brand-facing
 * SubscriptionsController so those routes' RBAC is not conflated with the
 * admin surface.
 *
 * GET /admin/finance/subscriptions — list
 * POST /admin/subscriptions/:id/cancel — admin-triggered cancel
 */
@Controller()
@Roles(UserRole.SUPER_ADMIN)
export class FinanceAdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('admin/finance/subscriptions')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptions.listAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * SUPER_ADMIN-triggered subscription cancel.
   *
   * Body `{ immediate?: boolean }`:
   *   - false / omitted → scheduled cancel (cancelAtPeriodEnd=true).
   *   - true            → drop to FREE now (tier=FREE, CANCELLED).
   *
   * The service writes the AuditLog entry with actorId=admin.sub. Non-Negotiable
   * #9 is enforced inside the service: planSnapshots on Bounty/Submission are
   * never touched by this call.
   */
  @Post('admin/subscriptions/:id/cancel')
  async cancelById(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: RequestWithIp,
    @Body() body?: { immediate?: boolean },
  ) {
    return this.subscriptions.cancelById(
      id,
      {
        actorId: admin.sub,
        actorRole: admin.role as UserRole,
        ipAddress: req?.ip ?? null,
      },
      { immediate: body?.immediate === true },
    );
  }
}
