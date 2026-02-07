import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/users.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.usersService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
      req.ip,
    );
  }
}
