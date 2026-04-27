import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { KybDocumentType, KybStatus } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { KybDocumentsService } from './kyb-documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('KybDocumentsService', () => {
  const brandId = 'brand-1';

  const businessAdmin: AuthenticatedUser = {
    sub: 'user-1',
    email: 'admin@brand.test',
    role: UserRole.BUSINESS_ADMIN,
    brandId,
  } as AuthenticatedUser;

  const otherBrandAdmin: AuthenticatedUser = {
    sub: 'user-2',
    email: 'admin@other.test',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'brand-other',
  } as AuthenticatedUser;

  const superAdmin: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'sa@platform.test',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  } as unknown as AuthenticatedUser;

  function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'CIPC_14_3.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 50_000,
      destination: '/tmp/uploads/kyb',
      filename: 'abc.pdf',
      path: '/tmp/uploads/kyb/abc.pdf',
      buffer: Buffer.from(''),
      stream: undefined as unknown as Express.Multer.File['stream'],
      ...overrides,
    } as Express.Multer.File;
  }

  function buildService(opts: {
    brand?: { kybStatus: KybStatus } | null;
    document?: {
      id: string;
      uploadedById: string;
      brandId: string;
      fileUrl: string;
      fileName: string;
      documentType: KybDocumentType;
      brand: { id: string; kybStatus: KybStatus };
    } | null;
    createResult?: Record<string, unknown>;
  } = {}) {
    const prisma = {
      brand: {
        findUnique: jest.fn().mockResolvedValue(
          opts.brand === null
            ? null
            : opts.brand ?? { kybStatus: KybStatus.NOT_STARTED },
        ),
      },
      kybDocument: {
        create: jest.fn().mockResolvedValue(
          opts.createResult ?? {
            id: 'doc-1',
            documentType: 'COR_14_3' as KybDocumentType,
            fileName: 'CIPC_14_3.pdf',
            fileUrl: '/tmp/uploads/kyb/abc.pdf',
            mimeType: 'application/pdf',
            fileSize: 50_000,
            uploadedAt: new Date('2026-04-26T00:00:00Z'),
            expiresAt: null,
            notes: null,
          },
        ),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(opts.document ?? null),
        delete: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;
    const audit = { log: jest.fn() } as unknown as AuditService;
    const svc = new KybDocumentsService(prisma, audit);
    return { svc, prisma, audit };
  }

  // ─── upload ──────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('happy path — creates the row and writes audit log', async () => {
      const { svc, prisma, audit } = buildService();
      const file = makeFile();
      const result = await svc.uploadDocument(
        brandId,
        file,
        'COR_14_3' as KybDocumentType,
        businessAdmin,
      );

      expect(prisma.kybDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brandId,
            documentType: 'COR_14_3',
            fileName: 'CIPC_14_3.pdf',
            mimeType: 'application/pdf',
            uploadedById: 'user-1',
          }),
        }),
      );
      expect(result.documentType).toBe('COR_14_3');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyb.document_uploaded' }),
      );
    });

    it('RBAC — BUSINESS_ADMIN of another brand cannot upload', async () => {
      const { svc, prisma } = buildService();
      await expect(
        svc.uploadDocument(
          brandId,
          makeFile(),
          'COR_14_3' as KybDocumentType,
          otherBrandAdmin,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.kybDocument.create).not.toHaveBeenCalled();
    });

    it('SUPER_ADMIN can upload on any brand', async () => {
      const { svc, prisma } = buildService();
      await svc.uploadDocument(
        brandId,
        makeFile(),
        'COR_14_3' as KybDocumentType,
        superAdmin,
      );
      expect(prisma.kybDocument.create).toHaveBeenCalled();
    });

    it('rejects oversized file (> 10MB)', async () => {
      const { svc } = buildService();
      const big = makeFile({ size: 11 * 1024 * 1024 });
      await expect(
        svc.uploadDocument(
          brandId,
          big,
          'COR_14_3' as KybDocumentType,
          businessAdmin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects disallowed mime type', async () => {
      const { svc } = buildService();
      const evil = makeFile({ mimetype: 'application/x-msdownload' });
      await expect(
        svc.uploadDocument(
          brandId,
          evil,
          'COR_14_3' as KybDocumentType,
          businessAdmin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when notes exceed 500 chars', async () => {
      const { svc } = buildService();
      await expect(
        svc.uploadDocument(
          brandId,
          makeFile(),
          'COR_14_3' as KybDocumentType,
          businessAdmin,
          undefined,
          'X'.repeat(501),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('state-guard — APPROVED brand cannot accept new documents', async () => {
      const { svc } = buildService({
        brand: { kybStatus: KybStatus.APPROVED },
      });
      await expect(
        svc.uploadDocument(
          brandId,
          makeFile(),
          'COR_14_3' as KybDocumentType,
          businessAdmin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('NotFoundException when brand missing', async () => {
      const { svc } = buildService({ brand: null });
      await expect(
        svc.uploadDocument(
          brandId,
          makeFile(),
          'COR_14_3' as KybDocumentType,
          businessAdmin,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when no file provided', async () => {
      const { svc } = buildService();
      await expect(
        svc.uploadDocument(
          brandId,
          undefined as unknown as Express.Multer.File,
          'COR_14_3' as KybDocumentType,
          businessAdmin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── list ────────────────────────────────────────────────

  describe('listDocuments', () => {
    it('returns the brand documents in newest-first order', async () => {
      const { svc, prisma } = buildService();
      (prisma.kybDocument.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'doc-1',
          documentType: 'COR_14_3',
          fileName: 'a.pdf',
          fileUrl: '/x/a.pdf',
          mimeType: 'application/pdf',
          fileSize: 100,
          uploadedAt: new Date('2026-04-26T01:00:00Z'),
          expiresAt: null,
          notes: 'cover note',
        },
      ]);
      const result = await svc.listDocuments(brandId, businessAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('a.pdf');
      const call = (prisma.kybDocument.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ uploadedAt: 'desc' });
    });

    it('RBAC — BUSINESS_ADMIN of another brand cannot list', async () => {
      const { svc } = buildService();
      await expect(
        svc.listDocuments(brandId, otherBrandAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFoundException when brand missing', async () => {
      const { svc } = buildService({ brand: null });
      await expect(
        svc.listDocuments(brandId, businessAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── delete ──────────────────────────────────────────────

  describe('deleteDocument', () => {
    const ownDoc = {
      id: 'doc-1',
      uploadedById: 'user-1',
      brandId,
      fileUrl: '/tmp/uploads/kyb/abc.pdf',
      fileName: 'a.pdf',
      documentType: 'COR_14_3' as KybDocumentType,
      brand: { id: brandId, kybStatus: KybStatus.PENDING },
    };

    const someoneElsesDoc = {
      ...ownDoc,
      id: 'doc-2',
      uploadedById: 'user-99',
    };

    it('uploader can delete their own document', async () => {
      const { svc, prisma, audit } = buildService({ document: ownDoc });
      await svc.deleteDocument('doc-1', businessAdmin);
      expect(prisma.kybDocument.delete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyb.document_deleted' }),
      );
    });

    it('SUPER_ADMIN can delete any document', async () => {
      const { svc, prisma } = buildService({ document: someoneElsesDoc });
      await svc.deleteDocument('doc-2', superAdmin);
      expect(prisma.kybDocument.delete).toHaveBeenCalled();
    });

    it('non-uploader BUSINESS_ADMIN cannot delete', async () => {
      const { svc, prisma } = buildService({ document: someoneElsesDoc });
      await expect(
        svc.deleteDocument('doc-2', businessAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.kybDocument.delete).not.toHaveBeenCalled();
    });

    it('state-guard — APPROVED brand blocks deletion', async () => {
      const { svc } = buildService({
        document: {
          ...ownDoc,
          brand: { id: brandId, kybStatus: KybStatus.APPROVED },
        },
      });
      await expect(
        svc.deleteDocument('doc-1', businessAdmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('NotFoundException when document missing', async () => {
      const { svc } = buildService({ document: null });
      await expect(
        svc.deleteDocument('missing', businessAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
