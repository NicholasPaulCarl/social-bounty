import {
  Controller,
  Get,
  Post,
  Patch,
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
import { Request } from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, SubmissionStatus, PayoutStatus, FILE_UPLOAD_LIMITS } from '@social-bounty/shared';
import { SubmissionsService } from './submissions.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  ReviewSubmissionDto,
  UpdatePayoutDto,
} from './dto/submissions.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class SubmissionsController {
  constructor(
    private submissionsService: SubmissionsService,
    private settingsService: SettingsService,
  ) {}

  @Post('bounties/:bountyId/submissions')
  @Roles(UserRole.PARTICIPANT)
  async create(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubmissionDto,
    @Req() req: Request,
  ) {
    if (!(await this.settingsService.isSubmissionEnabled())) {
      throw new BadRequestException('Submissions are currently disabled');
    }
    return this.submissionsService.create(bountyId, user, dto, req.ip);
  }

  @Get('submissions/me')
  @Roles(UserRole.PARTICIPANT)
  async listMySubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: SubmissionStatus,
    @Query('payoutStatus') payoutStatus?: PayoutStatus,
    @Query('bountyId') bountyId?: string,
  ) {
    return this.submissionsService.listMySubmissions(user, {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      payoutStatus,
      bountyId,
    });
  }

  @Get('bounties/:bountyId/submissions')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listForBounty(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: SubmissionStatus,
    @Query('payoutStatus') payoutStatus?: PayoutStatus,
  ) {
    return this.submissionsService.listForBounty(bountyId, user, {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      payoutStatus,
    });
  }

  @Get('submissions/queue')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getReviewQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Query('orgId') orgId?: string,
    @Query('status') status?: SubmissionStatus,
    @Query('bountyId') bountyId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.submissionsService.getReviewQueue(user, {
      orgId,
      status,
      bountyId,
      page,
      limit,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'asc',
    });
  }

  @Get('submissions/me/earnings')
  @Roles(UserRole.PARTICIPANT)
  async getMyEarnings(@CurrentUser() user: AuthenticatedUser) {
    return this.submissionsService.getMyEarnings(user.sub);
  }

  @Get('submissions/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.submissionsService.findById(id, user);
  }

  @Patch('submissions/:id')
  @Roles(UserRole.PARTICIPANT)
  async updateSubmission(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSubmissionDto,
    @Req() req: Request,
  ) {
    return this.submissionsService.updateSubmission(id, user, dto, req.ip);
  }

  @Patch('submissions/:id/review')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async review(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: Request,
  ) {
    return this.submissionsService.review(
      id,
      user,
      dto.status,
      dto.reviewerNote,
      req.ip,
    );
  }

  @Patch('submissions/:id/payout')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async updatePayout(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePayoutDto,
    @Req() req: Request,
  ) {
    return this.submissionsService.updatePayout(
      id,
      user,
      dto.payoutStatus,
      dto.note,
      req.ip,
    );
  }

  @Post('submissions/:id/files')
  @Roles(UserRole.PARTICIPANT)
  @UseInterceptors(
    FilesInterceptor('files', FILE_UPLOAD_LIMITS.MAX_FILES_PER_SUBMISSION, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = FILE_UPLOAD_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
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
  async uploadFiles(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    return this.submissionsService.uploadFiles(id, user, files);
  }
}
