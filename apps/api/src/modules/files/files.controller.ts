import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Roles, CurrentUser } from '../../common/decorators';
import { buildContentDisposition } from '../../common/utils/content-disposition';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BountiesService } from '../bounties/bounties.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

function resolveAndValidatePath(fileUrl: string): string {
  const resolved = path.resolve(fileUrl);
  if (!resolved.startsWith(UPLOADS_ROOT)) {
    throw new BadRequestException('Invalid file path');
  }
  return resolved;
}

@Controller('files')
export class FilesController {
  constructor(
    private prisma: PrismaService,
    private bountiesService: BountiesService,
  ) {}

  // Specific route must come BEFORE the parameterized :id route
  @Get('brand-assets/:id/download')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async downloadBrandAsset(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const asset = await this.bountiesService.getBrandAssetForDownload(id, user);

    const filePath = resolveAndValidatePath(asset.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader(
      'Content-Disposition',
      buildContentDisposition('attachment', asset.fileName),
    );
    fs.createReadStream(filePath).pipe(res);
  }

  @Get(':id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            userId: true,
            bounty: {
              select: { brandId: true },
            },
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // RBAC
    if (user.role === UserRole.PARTICIPANT) {
      if (file.submission.userId !== user.sub) {
        throw new ForbiddenException('Not authorized');
      }
    } else if (user.role === UserRole.BUSINESS_ADMIN) {
      if (file.submission.bounty.brandId !== user.brandId) {
        throw new ForbiddenException('Not authorized');
      }
    }

    const filePath = resolveAndValidatePath(file.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      buildContentDisposition('inline', file.fileName),
    );
    fs.createReadStream(filePath).pipe(res);
  }
}
