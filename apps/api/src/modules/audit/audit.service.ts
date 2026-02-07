import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    // Fire-and-forget: don't await to avoid blocking the request
    this.prisma.auditLog
      .create({
        data: {
          actorId: entry.actorId,
          actorRole: entry.actorRole,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          beforeState: (entry.beforeState as Prisma.InputJsonValue) ?? undefined,
          afterState: (entry.afterState as Prisma.InputJsonValue) ?? undefined,
          reason: entry.reason ?? undefined,
          ipAddress: entry.ipAddress ?? undefined,
        },
      })
      .catch((err) => {
        console.error('Failed to write audit log:', err);
      });
  }
}
