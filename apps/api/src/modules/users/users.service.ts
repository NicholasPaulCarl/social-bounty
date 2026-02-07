import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  UserRole,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisationMemberships: {
          include: {
            organisation: {
              select: { id: true, name: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const membership = user.organisationMemberships[0] || null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      organisation: membership
        ? {
            id: membership.organisation.id,
            name: membership.organisation.name,
            role: membership.role,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string },
  ) {
    const updateData: Record<string, string> = {};
    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.auditService.log({
      actorId: userId,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGE,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      ipAddress,
    });

    return { message: 'Password changed successfully.' };
  }
}
