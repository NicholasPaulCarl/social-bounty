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
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, BountyStatus, RewardType, BRAND_ASSET_LIMITS } from '@social-bounty/shared';
import { BountiesService } from './bounties.service';
import {
  CreateBountyDto,
  UpdateBountyDto,
  UpdateBountyStatusDto,
} from './dto/bounties.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('bounties')
export class BountiesController {
  constructor(private bountiesService: BountiesService) {}

  @Get()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: BountyStatus,
    @Query('category') category?: string,
    @Query('rewardType') rewardType?: RewardType,
    @Query('search') search?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    return this.bountiesService.list(user, {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      category,
      rewardType,
      search,
      organisationId,
    });
  }

  @Get(':id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountiesService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBountyDto,
    @Req() req: Request,
  ) {
    return this.bountiesService.create(user, dto, req.ip);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBountyDto,
    @Req() req: Request,
  ) {
    return this.bountiesService.update(
      id,
      user,
      dto as Record<string, unknown>,
      req.ip,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBountyStatusDto,
    @Req() req: Request,
  ) {
    return this.bountiesService.updateStatus(id, user, dto.status, req.ip);
  }

  @Post(':id/acknowledge-visibility')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async acknowledgeVisibility(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.bountiesService.acknowledgeVisibility(id, user, req.ip);
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.bountiesService.delete(id, user, req.ip);
  }

  @Post(':id/brand-assets')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = path.resolve(process.cwd(), 'uploads', 'brand-assets');
          require('fs').mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const MIME_TO_EXT: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
          };
          const ext = MIME_TO_EXT[file.mimetype] || '.bin';
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: BRAND_ASSET_LIMITS.MAX_FILE_SIZE,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = BRAND_ASSET_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
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
  async uploadBrandAssets(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    return this.bountiesService.uploadBrandAssets(id, user, files, req.ip);
  }

  @Delete(':id/brand-assets/:assetId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async deleteBrandAsset(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.bountiesService.deleteBrandAsset(id, assetId, user, req.ip);
  }
}
