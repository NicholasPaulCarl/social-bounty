import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { Roles } from '../../common/decorators';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * Read-only subscription list for the Finance Admin dashboard.
 *
 * RBAC: SUPER_ADMIN only (per claude.md Hard Rule #2). Lives in the
 * finance-admin module — separate from the participant/brand-facing
 * SubscriptionsController so those routes' RBAC is not conflated with the
 * admin surface.
 *
 * This controller is intentionally a thin wrapper over
 * SubscriptionsService.listAll() — no mutations are exposed.
 */
@Controller('admin/finance/subscriptions')
@Roles(UserRole.SUPER_ADMIN)
export class FinanceAdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptions.listAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
