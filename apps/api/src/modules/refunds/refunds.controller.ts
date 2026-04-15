import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { RefundsService } from './refunds.service';

class RequestRefundDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}

class ApproveRefundDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

class RequestRefundAfterPayoutDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  kbEntryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  dualApproverId!: string;
}

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @Post('bounties/:bountyId/before-approval')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('REFUND_REQUEST_BEFORE_APPROVAL', 'Bounty')
  async requestBefore(
    @Param('bountyId') bountyId: string,
    @Body() body: RequestRefundDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.refunds.requestBeforeApproval(bountyId, body.reason, user);
  }

  @Post(':refundId/approve-before')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('REFUND_APPROVE_BEFORE', 'Refund')
  async approveBefore(
    @Param('refundId') refundId: string,
    @Body() body: ApproveRefundDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.refunds.approveBeforeApproval(refundId, user, body.note);
  }

  @Post('submissions/:submissionId/after-approval')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('REFUND_REQUEST_AFTER_APPROVAL', 'Submission')
  async requestAfterApproval(
    @Param('submissionId') submissionId: string,
    @Body() body: RequestRefundDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.refunds.requestAfterApproval(submissionId, body.reason, user);
  }

  @Post('submissions/:submissionId/after-payout')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('REFUND_REQUEST_AFTER_PAYOUT', 'Submission')
  async requestAfterPayout(
    @Param('submissionId') submissionId: string,
    @Body() body: RequestRefundAfterPayoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.refunds.requestAfterPayout(
      submissionId,
      body.reason,
      body.kbEntryId,
      body.dualApproverId,
      user,
    );
  }
}
