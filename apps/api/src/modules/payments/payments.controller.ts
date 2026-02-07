import {
  Controller,
  Post,
  Param,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@social-bounty/shared';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

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
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available');
    }
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
