import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, PROFILE_LIMITS } from '@social-bounty/shared';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpsertSocialLinkDto,
} from './dto/users.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ─── User Profile ──────────────────────────────────────

  @Get('users/me')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('users/me')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  // ─── Profile Picture ──────────────────────────────────

  @Post('users/me/profile-picture')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: PROFILE_LIMITS.PROFILE_PICTURE_MAX_SIZE,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = PROFILE_LIMITS.PROFILE_PICTURE_MIME_TYPES as readonly string[];
        if (!allowed.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('A profile picture file is required');
    }
    return this.usersService.uploadProfilePicture(user.sub, files[0]);
  }

  @Delete('users/me/profile-picture')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async deleteProfilePicture(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteProfilePicture(user.sub);
  }

  // ─── Social Links ─────────────────────────────────────

  @Get('users/me/social-links')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getSocialLinks(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getSocialLinks(user.sub);
  }

  @Post('users/me/social-links')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async upsertSocialLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertSocialLinkDto,
  ) {
    return this.usersService.upsertSocialLink(user.sub, dto);
  }

  @Delete('users/me/social-links/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async deleteSocialLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteSocialLink(user.sub, id);
  }

  // ─── User Search (for messaging) ─────────────────────

  @Get('users/search')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async searchUsers(
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.searchUsersForMessaging(q, limit);
  }

  // ─── Hunter Directory ─────────────────────────────────

  @Get('hunters')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listHunters(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('interest') interest?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.listHunters({ page, limit, interest, search });
  }

  @Get('hunters/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
