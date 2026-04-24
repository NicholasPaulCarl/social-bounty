import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@social-bounty/shared';
import { Roles, CurrentUser, Audited } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { TradeSafePaymentsService } from '../tradesafe/tradesafe-payments.service';

class CreateBountyFundingDto {
  @IsString()
  @MaxLength(40)
  payerName!: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;
}

/**
 * Brand bounty-funding API (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch and Stripe endpoints removed. Two routes remain,
 * both mirrored from the pre-cutover contract so the front-end redirect
 * flow is unchanged:
 *
 *   - POST bounties/:bountyId/fund      → hosted-checkout URL
 *   - GET  payments/funding-status      → poll endpoint for the return page
 */
@Controller()
export class PaymentsController {
  constructor(private tradeSafePayments: TradeSafePaymentsService) {}

  @Post('bounties/:bountyId/fund')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('BOUNTY_FUND_INIT', 'Bounty')
  async fundBounty(
    @Param('bountyId') bountyId: string,
    @Body() body: CreateBountyFundingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tradeSafePayments.createBountyFunding(bountyId, user, {
      name: body.payerName,
      email: body.payerEmail,
    });
  }

  @Get('payments/funding-status')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async fundingStatus(
    @Query('bountyId') bountyId: string | undefined,
    @Query('tradeSafeTransactionId') tradeSafeTransactionId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tradeSafePayments.resolveFundingStatus(
      { bountyId, tradeSafeTransactionId },
      user,
    );
  }
}
