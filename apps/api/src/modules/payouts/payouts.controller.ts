import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { BeneficiaryService } from './beneficiary.service';
import { PayoutsService } from './payouts.service';

class UpsertBeneficiaryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  accountHolderName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  bankCode!: string;

  @IsString()
  @Matches(/^\d{6,20}$/)
  accountNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  accountType!: string;
}

@Controller('payouts')
export class PayoutsController {
  constructor(
    private readonly beneficiaries: BeneficiaryService,
    private readonly payouts: PayoutsService,
  ) {}

  @Post('me/beneficiary')
  @Roles(UserRole.PARTICIPANT)
  @Audited('BENEFICIARY_UPSERT', 'User')
  async upsertMyBeneficiary(
    @Body() body: UpsertBeneficiaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const b = await this.beneficiaries.upsertForUser(user.sub, body);
    return { id: b.id, stitchBeneficiaryId: b.stitchBeneficiaryId };
  }

  @Post(':payoutId/retry')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('PAYOUT_ADMIN_RETRY', 'StitchPayout')
  async retry(@Param('payoutId') payoutId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payouts.adminRetry(payoutId, user);
  }
}
