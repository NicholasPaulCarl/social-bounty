import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import {
  UserRole,
  BountyApplicationStatus,
} from '@social-bounty/shared';
import { BountyAccessService } from './bounty-access.service';
import {
  ApplyToBountyDto,
  ReviewApplicationDto,
  CreateInvitationsDto,
} from './dto/bounty-access.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller()
export class BountyAccessController {
  constructor(private bountyAccessService: BountyAccessService) {}

  // ── Applications ───────────────────────────────────────

  @Post('bounties/:bountyId/apply')
  @Roles(UserRole.PARTICIPANT)
  async applyToBounty(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyToBountyDto,
  ) {
    return this.bountyAccessService.applyToBounty(user.sub, bountyId, dto);
  }

  @Delete('bounties/:bountyId/my-application')
  @Roles(UserRole.PARTICIPANT)
  async withdrawApplication(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.withdrawApplication(user.sub, bountyId);
  }

  @Get('bounties/:bountyId/applications')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listApplications(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: BountyApplicationStatus,
  ) {
    return this.bountyAccessService.listApplications(bountyId, user, {
      page,
      limit,
      status,
    });
  }

  @Post('bounties/:bountyId/applications/:id/approve')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async approveApplication(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.reviewApplication(id, user, {
      status: 'APPROVED',
    });
  }

  @Post('bounties/:bountyId/applications/:id/reject')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async rejectApplication(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.bountyAccessService.reviewApplication(id, user, {
      status: 'REJECTED',
      reviewNote: dto.reviewNote,
    });
  }

  // ── Invitations (admin) ────────────────────────────────

  @Post('bounties/:bountyId/invitations')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async createInvitations(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationsDto,
  ) {
    return this.bountyAccessService.createInvitations(
      bountyId,
      user,
      dto.invitations,
    );
  }

  @Get('bounties/:bountyId/invitations')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listInvitations(
    @Param('bountyId') bountyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.listInvitations(bountyId, user);
  }

  @Delete('bounties/:bountyId/invitations/:id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async revokeInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.revokeInvitation(id, user);
  }

  // ── Invitations (participant) ──────────────────────────

  @Get('invitations/my')
  @Roles(UserRole.PARTICIPANT)
  async getMyInvitations(@CurrentUser() user: AuthenticatedUser) {
    return this.bountyAccessService.getMyInvitations(user.sub);
  }

  @Post('invitations/:id/accept')
  @Roles(UserRole.PARTICIPANT)
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.acceptInvitation(id, user.sub);
  }

  @Post('invitations/:id/decline')
  @Roles(UserRole.PARTICIPANT)
  async declineInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bountyAccessService.declineInvitation(id, user.sub);
  }
}
