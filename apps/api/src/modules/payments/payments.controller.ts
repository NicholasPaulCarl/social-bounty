import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@social-bounty/shared';
import { Roles, CurrentUser, Public, Audited } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PaymentsService } from './payments.service';
import { StitchPaymentsService } from './stitch-payments.service';

class CreateBountyFundingDto {
  @IsString()
  @MaxLength(40)
  payerName!: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;
}

@Controller()
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stitchPayments: StitchPaymentsService,
  ) {}

  // Stitch (canonical — per md-files/payment-gateway.md)
  @Post('bounties/:bountyId/fund')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('BOUNTY_FUND_INIT', 'Bounty')
  async fundBounty(
    @Param('bountyId') bountyId: string,
    @Body() body: CreateBountyFundingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stitchPayments.createBountyFunding(bountyId, user, {
      name: body.payerName,
      email: body.payerEmail,
    });
  }

  // Used by the /business/bounties/funded return page to resolve a bounty from
  // whatever identifier Stitch's redirect carries (bountyId, paymentId,
  // merchantReference), then poll until the webhook has flipped it to PAID.
  @Get('payments/funding-status')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async fundingStatus(
    @Query('bountyId') bountyId: string | undefined,
    @Query('stitchPaymentId') stitchPaymentId: string | undefined,
    @Query('merchantReference') merchantReference: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stitchPayments.resolveFundingStatus(
      { bountyId, stitchPaymentId, merchantReference },
      user,
    );
  }

  // Stripe (legacy — retires in Phase 3 per ADR 0001)
  @Post('bounties/:bountyId/payment-intent')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async createPaymentIntent(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.createPaymentIntent(bountyId, user);
  }

  @Public()
  @Post('webhooks/stripe')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
