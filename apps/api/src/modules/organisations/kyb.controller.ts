import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { KybService } from './kyb.service';

class SubmitKybDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  registeredName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vatNumber?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentsRef?: string;
}

class RejectKybDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}

@Controller('brands/:brandId/kyb')
export class KybController {
  constructor(private readonly kyb: KybService) {}

  @Post()
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('KYB_SUBMIT', 'Brand')
  async submit(
    @Param('brandId') brandId: string,
    @Body() body: SubmitKybDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.submit(brandId, body, user);
  }

  @Post('approve')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('KYB_APPROVE', 'Brand')
  async approve(@Param('brandId') brandId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.kyb.approve(brandId, user);
  }

  @Post('reject')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('KYB_REJECT', 'Brand')
  async reject(
    @Param('brandId') brandId: string,
    @Body() body: RejectKybDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.reject(brandId, body.reason, user);
  }
}
