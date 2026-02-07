import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

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
              select: { organisationId: true },
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
      if (file.submission.bounty.organisationId !== user.organisationId) {
        throw new ForbiddenException('Not authorized');
      }
    }

    const filePath = path.resolve(file.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.fileName}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  }
}
