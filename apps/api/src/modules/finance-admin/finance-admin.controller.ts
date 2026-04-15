import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LedgerAccount, LedgerEntryType } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { FinanceAdminService } from './finance-admin.service';

class KillSwitchDto {
  @IsBoolean()
  active!: boolean;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}

class OverrideLegDto {
  @IsEnum(LedgerAccount)
  account!: LedgerAccount;

  @IsEnum(LedgerEntryType)
  type!: LedgerEntryType;

  @IsString()
  amountCents!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  bountyId?: string;
}

class DevSeedPayableDto {
  @IsUUID()
  userId!: string;

  // amounts passed as string to avoid JS number precision loss; parsed to bigint.
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  faceValueCents!: string;
}

class OverrideDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @ValidateNested({ each: true })
  @Type(() => OverrideLegDto)
  legs!: OverrideLegDto[];
}

@Controller('admin/finance')
@Roles(UserRole.SUPER_ADMIN)
export class FinanceAdminController {
  constructor(private readonly svc: FinanceAdminService) {}

  @Get('overview')
  async overview() {
    return this.svc.overview();
  }

  @Get('inbound')
  async inbound(@Query('limit') limit?: string) {
    return this.svc.inboundList(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('reserves')
  async reserves() {
    return this.svc.reserves();
  }

  @Get('earnings-payouts')
  async earningsPayouts() {
    return this.svc.earningsPayouts();
  }

  @Get('refunds')
  async refunds() {
    return this.svc.listRefunds();
  }

  @Get('exceptions')
  async exceptions() {
    return this.svc.listExceptions();
  }

  @Get('audit-trail')
  async auditTrail(@Query('limit') limit?: string) {
    return this.svc.auditTrail(limit ? parseInt(limit, 10) : undefined);
  }

  @Post('kill-switch')
  @Audited('KILL_SWITCH_TOGGLE', 'System')
  async toggleKillSwitch(
    @Body() body: KillSwitchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.toggleKillSwitch(body.active, body.reason, user);
  }

  /**
   * DEV-ONLY. Seeds a fully-cleared hunter_net_payable position for a user so
   * the payout pipeline can be smoke-tested without brand-funding + approval.
   * Gated to PAYMENTS_PROVIDER != 'stitch_live' in the service.
   */
  @Post('dev/seed-payable')
  @Audited('DEV_SEED_PAYABLE', 'User')
  async devSeedPayable(
    @Body() body: DevSeedPayableDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.devSeedPayable(
      { userId: body.userId, faceValueCents: BigInt(body.faceValueCents) },
      user,
    );
  }

  @Post('overrides')
  @Audited('FINANCIAL_OVERRIDE', 'LedgerEntry')
  async override(
    @Body() body: OverrideDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.postOverride(
      {
        reason: body.reason,
        description: body.description,
        legs: body.legs.map((l) => ({
          account: l.account as LedgerAccount,
          type: l.type as LedgerEntryType,
          amountCents: BigInt(l.amountCents),
          userId: l.userId,
          brandId: l.brandId,
          bountyId: l.bountyId,
        })),
      },
      user,
    );
  }
}
