import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { KybDocumentType, KybStatus } from '@prisma/client';
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  UserRole,
  type KybDocumentResponse,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

/** Per-document hard limits — kept here, not in `constants.ts`, because they
 * are KYB-specific and the brief asked for inline validation. */
export const KYB_DOCUMENT_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  NOTES_MAX: 500,
} as const;

@Injectable()
export class KybDocumentsService {
  private readonly logger = new Logger(KybDocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Upload a KYB evidence document. The multer interceptor at the
   * controller boundary enforces filesize + mimetype at request time;
   * this service performs defence-in-depth validation, RBAC, state
   * gating, and the row write + audit log.
   *
   * State guard: only NOT_STARTED, PENDING, or REJECTED brands can add
   * documents. Once APPROVED, evidence is locked — to refresh it an
   * admin must reject first (which orphans no audit data because
   * documents stay until explicitly deleted).
   *
   * RBAC: BUSINESS_ADMIN of the brand or SUPER_ADMIN.
   */
  async uploadDocument(
    brandId: string,
    file: Express.Multer.File,
    documentType: KybDocumentType,
    user: AuthenticatedUser,
    expiresAt?: Date,
    notes?: string,
  ): Promise<KybDocumentResponse> {
    if (user.role !== UserRole.SUPER_ADMIN && user.brandId !== brandId) {
      throw new ForbiddenException('Not authorized');
    }

    if (!file) {
      throw new BadRequestException('A document file is required');
    }
    if (file.size > KYB_DOCUMENT_LIMITS.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large — max ${KYB_DOCUMENT_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
    const allowed = KYB_DOCUMENT_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`,
      );
    }
    if (notes && notes.length > KYB_DOCUMENT_LIMITS.NOTES_MAX) {
      throw new BadRequestException(
        `Notes too long — max ${KYB_DOCUMENT_LIMITS.NOTES_MAX} chars`,
      );
    }

    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus === KybStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot add KYB documents after approval — admin must reject first',
      );
    }

    const created = await this.prisma.kybDocument.create({
      data: {
        brandId,
        documentType,
        fileName: file.originalname,
        // The interceptor wrote to disk under uploads/kyb/{uuid}.{ext}.
        // We store the on-disk path so the download path can validate +
        // stream — same pattern as `BrandAsset.fileUrl`.
        fileUrl: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: user.sub,
        expiresAt: expiresAt ?? null,
        notes: notes ?? null,
      },
    });

    this.audit.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.KYB_DOCUMENT_UPLOADED,
      entityType: ENTITY_TYPES.BRAND,
      entityId: brandId,
      afterState: {
        documentId: created.id,
        documentType: created.documentType,
        fileName: created.fileName,
        fileSize: created.fileSize,
      },
    });

    return this.serialize(created);
  }

  /**
   * List KYB documents for a brand. RBAC: BUSINESS_ADMIN of the brand or
   * SUPER_ADMIN. Returns all documents regardless of `expiresAt` —
   * filtering "still valid" is a UI decision the frontend can make.
   */
  async listDocuments(
    brandId: string,
    user: AuthenticatedUser,
  ): Promise<KybDocumentResponse[]> {
    if (user.role !== UserRole.SUPER_ADMIN && user.brandId !== brandId) {
      throw new ForbiddenException('Not authorized');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const docs = await this.prisma.kybDocument.findMany({
      where: { brandId },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map((d) => this.serialize(d));
  }

  /**
   * Delete a KYB document. RBAC: only the original uploader OR
   * SUPER_ADMIN. State guard: brand kybStatus must NOT be APPROVED.
   *
   * The on-disk file is best-effort unlinked — if the unlink fails the
   * row is still removed (the orphaned blob is cheaper to clean up later
   * than a row pointing at a missing file).
   */
  async deleteDocument(documentId: string, user: AuthenticatedUser) {
    const doc = await this.prisma.kybDocument.findUnique({
      where: { id: documentId },
      include: { brand: { select: { id: true, kybStatus: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const isUploader = doc.uploadedById === user.sub;
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    if (!isUploader && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only the uploader or SUPER_ADMIN can delete this document',
      );
    }
    if (doc.brand.kybStatus === KybStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot delete KYB documents after approval',
      );
    }

    // Unlink first so the row deletion remains the authoritative "gone"
    // signal even if disk IO is laggy. We tolerate a missing file and
    // log-only on errors — the row delete is what matters.
    try {
      const filePath = path.resolve(doc.fileUrl);
      await fsPromises.unlink(filePath).catch(() => undefined);
    } catch (err) {
      this.logger.warn(
        `Failed to unlink KYB document ${documentId} on delete (continuing): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    await this.prisma.kybDocument.delete({ where: { id: documentId } });

    this.audit.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.KYB_DOCUMENT_DELETED,
      entityType: ENTITY_TYPES.BRAND,
      entityId: doc.brandId,
      beforeState: {
        documentId: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
      },
    });

    return { message: 'Document deleted.' };
  }

  // ─── helpers ────────────────────────────────────────────

  private serialize(doc: {
    id: string;
    documentType: KybDocumentType;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: Date;
    expiresAt: Date | null;
    notes: string | null;
  }): KybDocumentResponse {
    return {
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt.toISOString(),
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
      notes: doc.notes,
    };
  }
}
