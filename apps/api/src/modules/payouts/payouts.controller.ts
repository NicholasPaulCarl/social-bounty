import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PayoutsService } from './payouts.service';

/**
 * Outbound payouts controller (ADR 0011 — TradeSafe unified rail).
 *
 * **Phase 4 deferred (2026-04-24):** the `POST me/beneficiary` endpoint
 * was dropped along with the `stitch_beneficiaries` table in the
 * single-rail Stitch-deletion cutover. Hunter beneficiary management
 * is handled inside TradeSafe via the SELLER user token; no local
 * endpoint needed. Remaining routes return empty / throw until Phase 4
 * wires the real TradeSafe payout tables.
 */
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get('me')
  @Roles(UserRole.PARTICIPANT)
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.payouts.listForUser(user.sub);
  }

  @Post(':payoutId/retry')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('PAYOUT_ADMIN_RETRY', 'Payout')
  async retry(@Param('payoutId') payoutId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payouts.adminRetry(payoutId, user);
  }
}
