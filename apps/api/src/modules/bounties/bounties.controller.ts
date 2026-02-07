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
} from '@nestjs/common';
import { Request } from 'express';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, BountyStatus, RewardType } from '@social-bounty/shared';
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

  @Delete(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.bountiesService.delete(id, user, req.ip);
  }
}
