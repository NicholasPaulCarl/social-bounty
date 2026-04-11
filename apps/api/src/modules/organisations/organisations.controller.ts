import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { UserRole, BRAND_PROFILE_LIMITS } from '@social-bounty/shared';
import { BrandsService } from './organisations.service';
import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  InviteMemberDto,
} from './dto/organisations.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Post()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  @UseInterceptors(
    FilesInterceptor('logo', 1, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: BRAND_PROFILE_LIMITS.LOGO_MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = BRAND_PROFILE_LIMITS.LOGO_MIME_TYPES as readonly string[];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException(`Invalid file type: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganisationDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.brandsService.create(
      user,
      {
        name: dto.name,
        contactEmail: dto.contactEmail,
        handle: dto.handle,
        bio: dto.bio,
        websiteUrl: dto.websiteUrl,
        socialLinks: dto.socialLinks,
        targetInterests: dto.targetInterests,
      },
      req.ip,
      files?.[0],
    );
  }

  @Get('mine')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.brandsService.listMyOrganisations(user.sub);
  }

  @Get('public')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('interest') interest?: string,
  ) {
    return this.brandsService.listPublic({ page, limit, search, interest });
  }

  @Get('public/:idOrHandle')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getPublicProfile(@Param('idOrHandle') idOrHandle: string) {
    return this.brandsService.findPublicProfile(idOrHandle);
  }

  @Get('check-handle/:handle')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async checkHandle(@Param('handle') handle: string) {
    return this.brandsService.checkHandleAvailability(handle);
  }

  @Get(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.brandsService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('logo', 1, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: BRAND_PROFILE_LIMITS.LOGO_MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = BRAND_PROFILE_LIMITS.LOGO_MIME_TYPES as readonly string[];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException(`Invalid file type: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganisationDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.brandsService.update(id, user, dto, req.ip, files?.[0]);
  }

  @Get(':id/members')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listMembers(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.brandsService.listMembers(id, user, page, limit);
  }

  @Post(':id/members')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    return this.brandsService.inviteMember(id, dto.email, user, req.ip);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.brandsService.removeMember(id, userId, user, req.ip);
  }

  @Post(':id/cover-photo')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: BRAND_PROFILE_LIMITS.COVER_PHOTO_MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = BRAND_PROFILE_LIMITS.COVER_PHOTO_MIME_TYPES as readonly string[];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException(`Invalid file type: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadCoverPhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('A cover photo file is required');
    }
    return this.brandsService.uploadCoverPhoto(id, user, files[0]);
  }
}
