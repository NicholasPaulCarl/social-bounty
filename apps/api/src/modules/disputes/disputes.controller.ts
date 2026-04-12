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
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, DisputeStatus, DisputeCategory, DISPUTE_EVIDENCE_LIMITS } from '@social-bounty/shared';
import { DisputesService } from './disputes.service';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  SendMessageDto,
  ResolveDisputeDto,
  AssignDisputeDto,
  TransitionDisputeDto,
  EscalateDisputeDto,
  WithdrawDisputeDto,
} from './dto/disputes.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  // ── Participant / Business Admin endpoints ────────────

  @Post('disputes')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.create(user, dto, req.ip);
  }

  @Get('disputes/me')
  @Roles(UserRole.PARTICIPANT)
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DisputeStatus,
    @Query('category') category?: DisputeCategory,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.disputesService.listMine(user, {
      page,
      limit,
      status,
      category,
      sortBy,
      sortOrder,
    });
  }

  @Get('disputes/organisation')
  @Roles(UserRole.BUSINESS_ADMIN)
  async listForBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DisputeStatus,
    @Query('category') category?: DisputeCategory,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.disputesService.listForBrand(user, {
      page,
      limit,
      status,
      category,
      sortBy,
      sortOrder,
    });
  }

  @Get('disputes/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.findById(id, user);
  }

  @Patch('disputes/:id')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDisputeDto,
  ) {
    return this.disputesService.update(id, user, dto);
  }

  @Post('disputes/:id/submit')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async submitDraft(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.disputesService.submitDraft(id, user, req.ip);
  }

  @Post('disputes/:id/messages')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ) {
    return this.disputesService.sendMessage(id, user, dto, req.ip);
  }

  @Post('disputes/:id/escalate')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async escalate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EscalateDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.escalate(id, user, dto, req.ip);
  }

  @Post('disputes/:id/withdraw')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async withdraw(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WithdrawDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.withdraw(id, user, dto, req.ip);
  }

  @Post('disputes/:id/evidence')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', DISPUTE_EVIDENCE_LIMITS.MAX_FILES_PER_DISPUTE, {
      storage: diskStorage({
        destination: path.resolve(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: DISPUTE_EVIDENCE_LIMITS.MAX_FILE_SIZE,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = DISPUTE_EVIDENCE_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
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
  async uploadEvidence(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('descriptions') descriptions: string[] | string,
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    // Normalize descriptions: may come as single string or array
    const descs = Array.isArray(descriptions)
      ? descriptions
      : descriptions
        ? [descriptions]
        : [];
    return this.disputesService.uploadEvidence(id, user, files, descs, req.ip);
  }

  // ── Admin endpoints ───────────────────────────────────

  @Get('admin/disputes')
  @Roles(UserRole.SUPER_ADMIN)
  async listAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DisputeStatus,
    @Query('category') category?: DisputeCategory,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('openedByUserId') openedByUserId?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.disputesService.listAll({
      page,
      limit,
      status,
      category,
      assignedToUserId,
      openedByUserId,
      brandId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('admin/disputes/stats')
  @Roles(UserRole.SUPER_ADMIN)
  async getStats() {
    return this.disputesService.getStats();
  }

  @Patch('admin/disputes/:id/transition')
  @Roles(UserRole.SUPER_ADMIN)
  async transition(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TransitionDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.transition(id, user, dto, req.ip);
  }

  @Patch('admin/disputes/:id/assign')
  @Roles(UserRole.SUPER_ADMIN)
  async assign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.assign(id, user, dto, req.ip);
  }

  @Patch('admin/disputes/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN)
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResolveDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputesService.resolve(id, user, dto, req.ip);
  }
}
