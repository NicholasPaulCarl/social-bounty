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
import { UserRole } from '@social-bounty/shared';
import { OrganisationsService } from './organisations.service';
import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  InviteMemberDto,
} from './dto/organisations.validators';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('organisations')
export class OrganisationsController {
  constructor(private organisationsService: OrganisationsService) {}

  @Post()
  @Roles(UserRole.PARTICIPANT)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganisationDto,
    @Req() req: Request,
  ) {
    return this.organisationsService.create(
      user,
      dto.name,
      dto.contactEmail,
      req.ip,
    );
  }

  @Get(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganisationDto,
    @Req() req: Request,
  ) {
    return this.organisationsService.update(id, user, dto, req.ip);
  }

  @Get(':id/members')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listMembers(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.organisationsService.listMembers(id, user, page, limit);
  }

  @Post(':id/members')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    return this.organisationsService.inviteMember(id, dto.email, user, req.ip);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.organisationsService.removeMember(id, userId, user, req.ip);
  }
}
