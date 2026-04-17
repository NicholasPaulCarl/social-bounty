import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KybStatus } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

export interface KybSubmissionInput {
  registeredName: string;
  registrationNumber: string;
  vatNumber?: string;
  country: string;
  contactEmail: string;
  documentsRef?: string;
}

@Injectable()
export class KybService {
  private readonly logger = new Logger(KybService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(brandId: string, input: KybSubmissionInput, user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.brandId !== brandId) {
      throw new ForbiddenException('Not authorized');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus === KybStatus.APPROVED) {
      throw new BadRequestException('KYB already approved');
    }

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        kybStatus: KybStatus.PENDING,
        kybSubmittedAt: new Date(),
        // Submission payload stored in socialLinks.kyb? No — use a dedicated JSON column if needed.
        // Phase 1 stores the bare minimum on dedicated columns; richer documents live in file uploads.
      },
    });

    this.audit.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: 'KYB_SUBMIT',
      entityType: 'Brand',
      entityId: brandId,
      afterState: {
        kybStatus: updated.kybStatus,
        registeredName: input.registeredName,
        registrationNumber: input.registrationNumber,
        vatNumber: input.vatNumber,
        country: input.country,
        contactEmail: input.contactEmail,
        documentsRef: input.documentsRef,
      },
    });
    this.logger.log(`KYB submitted for brand ${brandId}`);
    return updated;
  }

  async approve(brandId: string, approver: AuthenticatedUser) {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can approve KYB');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus !== KybStatus.PENDING) {
      throw new BadRequestException(`KYB is ${brand.kybStatus}; only PENDING can be approved`);
    }

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: { kybStatus: KybStatus.APPROVED, kybApprovedAt: new Date() },
    });
    this.audit.log({
      actorId: approver.sub,
      actorRole: approver.role as UserRole,
      action: 'KYB_APPROVE',
      entityType: 'Brand',
      entityId: brandId,
      beforeState: { kybStatus: brand.kybStatus },
      afterState: { kybStatus: updated.kybStatus },
    });
    return updated;
  }

  async reject(brandId: string, reason: string, approver: AuthenticatedUser) {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can reject KYB');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: { kybStatus: KybStatus.REJECTED },
    });
    this.audit.log({
      actorId: approver.sub,
      actorRole: approver.role as UserRole,
      action: 'KYB_REJECT',
      entityType: 'Brand',
      entityId: brandId,
      reason,
      beforeState: { kybStatus: brand.kybStatus },
      afterState: { kybStatus: updated.kybStatus },
    });
    return updated;
  }
}
