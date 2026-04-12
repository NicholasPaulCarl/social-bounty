import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles, CurrentUser } from '../../common/decorators';
import {
  UserRole,
  UserStatus,
  BrandStatus,
  SubmissionStatus,
  PayoutStatus,
} from '@social-bounty/shared';
import { AdminService } from './admin.service';
import {
  AdminUpdateUserStatusDto,
  AdminCreateOrgDto,
  AdminUpdateBrandStatusDto,
  AdminOverrideBountyDto,
  AdminOverrideSubmissionDto,
  AdminUpdateSettingsDto,
} from './dto/admin.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('admin')
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Users ──────────────────────────

  @Get('users')
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({
      page, limit, sortBy, sortOrder, role, status, search,
    });
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminUpdateUserStatusDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateUserStatus(
      id, actor, dto.status, dto.reason, req.ip,
    );
  }

  // ── Organisations ──────────────────

  @Get('brands')
  async listBrands(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: BrandStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listBrands({
      page, limit, sortBy, sortOrder, status, search,
    });
  }

  @Get('brands/:id')
  async getBrandDetail(@Param('id') id: string) {
    return this.adminService.getBrandDetail(id);
  }

  @Post('brands')
  async createBrand(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminCreateOrgDto,
    @Req() req: Request,
  ) {
    return this.adminService.createBrand(actor, dto, req.ip);
  }

  @Patch('brands/:id/status')
  async updateBrandStatus(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminUpdateBrandStatusDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateBrandStatus(
      id, actor, dto.status, dto.reason, req.ip,
    );
  }

  // ── Submissions ──────────────────────

  @Get('submissions')
  async listSubmissions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: SubmissionStatus,
    @Query('payoutStatus') payoutStatus?: PayoutStatus,
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listSubmissions({
      page, limit, sortBy, sortOrder, status, payoutStatus, userId, brandId, search,
    });
  }

  // ── Overrides ──────────────────────

  @Patch('bounties/:id/override')
  async overrideBounty(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminOverrideBountyDto,
    @Req() req: Request,
  ) {
    return this.adminService.overrideBounty(
      id, actor, dto.status, dto.reason, req.ip,
    );
  }

  @Patch('submissions/:id/override')
  async overrideSubmission(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminOverrideSubmissionDto,
    @Req() req: Request,
  ) {
    return this.adminService.overrideSubmission(
      id, actor, dto.status, dto.reason, req.ip,
    );
  }

  // ── Audit Logs ─────────────────────

  @Get('audit-logs')
  async listAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.listAuditLogs({
      page, limit, sortBy, sortOrder,
      actorId, action, entityType, entityId,
      startDate, endDate,
    });
  }

  @Get('audit-logs/:id')
  async getAuditLog(@Param('id') id: string) {
    return this.adminService.getAuditLog(id);
  }

  // ── Dashboard ──────────────────────

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Settings ──────────────────────

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  async updateSettings(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminUpdateSettingsDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateSettings(actor, dto, req.ip);
  }

  // ── Recent Errors ────────────────

  @Get('recent-errors')
  async getRecentErrors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRecentErrors({ page, limit, startDate, endDate });
  }

  // ── System Health ──────────────────

  @Get('system-health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
