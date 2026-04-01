import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, SocialPlatform } from '@social-bounty/shared';
import { SocialHandlesService } from './social-handles.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { PROFILE_LIMITS } from '@social-bounty/shared';

class AddSocialHandleDto {
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @IsString()
  @MaxLength(PROFILE_LIMITS.HANDLE_MAX)
  handle!: string;
}

@Controller()
export class SocialHandlesController {
  constructor(private socialHandlesService: SocialHandlesService) {}

  @Get('profile/social-handles')
  @Roles(UserRole.PARTICIPANT)
  async listMyHandles(@CurrentUser() user: AuthenticatedUser) {
    return this.socialHandlesService.listMyHandles(user.sub);
  }

  @Post('profile/social-handles')
  @Roles(UserRole.PARTICIPANT)
  async addHandle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddSocialHandleDto,
  ) {
    return this.socialHandlesService.addHandle(
      user.sub,
      dto.platform,
      dto.handle,
    );
  }

  @Delete('profile/social-handles/:id')
  @Roles(UserRole.PARTICIPANT)
  async removeHandle(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialHandlesService.removeHandle(user.sub, id);
  }

  @Get('users/:userId/social-handles')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getUserHandles(@Param('userId') userId: string) {
    return this.socialHandlesService.getUserHandles(userId);
  }
}
