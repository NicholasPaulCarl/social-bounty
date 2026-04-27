import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { KybOrgType, KybStatus } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { KybService, KybSubmissionInput } from './kyb.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('KybService', () => {
  const brandId = 'brand-1';
  // The Prisma Brand row with KYB fields. Typed as Record<string, unknown>
  // so individual tests can override individual columns to non-null without
  // TypeScript inferring `null` as the canonical type from `baseBrand`.
  const baseBrand: Record<string, unknown> = {
    id: brandId,
    name: 'Acme Corp',
    handle: 'acme',
    contactEmail: 'contact@acme.test',
    kybStatus: KybStatus.NOT_STARTED,
    kybSubmittedAt: null,
    kybApprovedAt: null,
    kybRejectedAt: null,
    kybRejectionReason: null,
    kybRegisteredName: null,
    kybTradeName: null,
    kybRegistrationNumber: null,
    kybVatNumber: null,
    kybTaxNumber: null,
    kybCountry: null,
    kybContactEmail: null,
    kybOrgType: null,
    tradeSafeTokenId: null,
  };

  const businessAdmin: AuthenticatedUser = {
    sub: 'user-1',
    email: 'admin@acme.test',
    role: UserRole.BUSINESS_ADMIN,
    brandId,
  } as AuthenticatedUser;

  const otherBrandAdmin: AuthenticatedUser = {
    sub: 'user-2',
    email: 'admin@otherbrand.test',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'brand-other',
  } as AuthenticatedUser;

  const superAdmin: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'sa@platform.test',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  } as unknown as AuthenticatedUser;

  const validInput: KybSubmissionInput = {
    registeredName: 'Acme Corporation (Pty) Ltd',
    tradeName: 'Acme',
    registrationNumber: '2026/000001/07',
    vatNumber: '4123456789',
    taxNumber: '0123456789',
    country: 'ZA',
    contactEmail: 'kyb@acme.test',
    orgType: KybOrgType.PRIVATE,
  };

  function buildService(opts: {
    initialBrand?: Record<string, unknown> | null;
    isMockMode?: boolean;
    tokenCreateResult?: { id: string };
    tokenCreateThrows?: Error;
    pendingBrands?: Array<Record<string, unknown>>;
    pendingTotal?: number;
    auditEntries?: unknown[];
    reviewBrandDocs?: unknown[];
  } = {}) {
    const initialBrand =
      opts.initialBrand === null
        ? null
        : { ...baseBrand, ...opts.initialBrand };

    const updateMock = jest.fn().mockImplementation((args: any) => {
      // Mirror the input on update so the service's "use the updated row"
      // flow gets sensible data back.
      return Promise.resolve({
        ...(initialBrand ?? baseBrand),
        ...args.data,
      });
    });

    const prisma = {
      brand: {
        findUnique: jest.fn().mockResolvedValue(initialBrand),
        findMany: jest.fn().mockResolvedValue(opts.pendingBrands ?? []),
        count: jest.fn().mockResolvedValue(opts.pendingTotal ?? 0),
        update: updateMock,
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue(opts.auditEntries ?? []),
      },
      kybDocument: {
        findMany: jest.fn().mockResolvedValue(opts.reviewBrandDocs ?? []),
      },
    } as unknown as PrismaService;

    const audit = { log: jest.fn() } as unknown as AuditService;

    const tokenCreateMock = opts.tokenCreateThrows
      ? jest.fn().mockRejectedValue(opts.tokenCreateThrows)
      : jest
          .fn()
          .mockResolvedValue(opts.tokenCreateResult ?? { id: 'tradesafe-token-real' });
    const graphql = {
      isMockMode: jest.fn().mockReturnValue(opts.isMockMode ?? true),
      tokenCreate: tokenCreateMock,
    } as unknown as TradeSafeGraphQLClient;

    const svc = new KybService(prisma, audit, graphql);
    return { svc, prisma, audit, graphql, tokenCreateMock };
  }

  // ─── submit ──────────────────────────────────────────────

  describe('submit', () => {
    it('NOT_STARTED → PENDING with persisted form payload', async () => {
      const { svc, prisma, audit } = buildService();
      await svc.submit(brandId, validInput, businessAdmin);

      expect(prisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: brandId },
          data: expect.objectContaining({
            kybStatus: KybStatus.PENDING,
            kybRegisteredName: validInput.registeredName,
            kybTradeName: validInput.tradeName,
            kybRegistrationNumber: validInput.registrationNumber,
            kybVatNumber: validInput.vatNumber,
            kybTaxNumber: validInput.taxNumber,
            kybCountry: validInput.country,
            kybContactEmail: validInput.contactEmail,
            kybOrgType: validInput.orgType,
            kybRejectionReason: null,
            kybRejectedAt: null,
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyb.submit' }),
      );
    });

    it('REJECTED → PENDING resubmit clears prior rejectionReason + rejectedAt', async () => {
      const { svc, prisma } = buildService({
        initialBrand: {
          kybStatus: KybStatus.REJECTED,
          kybRejectionReason: 'Bank letter expired',
          kybRejectedAt: new Date('2026-04-20T00:00:00Z'),
        },
      });
      await svc.submit(brandId, validInput, businessAdmin);

      const call = (prisma.brand.update as jest.Mock).mock.calls[0][0];
      expect(call.data.kybStatus).toBe(KybStatus.PENDING);
      expect(call.data.kybRejectionReason).toBeNull();
      expect(call.data.kybRejectedAt).toBeNull();
    });

    it('blocks resubmit while already PENDING', async () => {
      const { svc } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
      });
      await expect(
        svc.submit(brandId, validInput, businessAdmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('blocks resubmit when already APPROVED', async () => {
      const { svc } = buildService({
        initialBrand: { kybStatus: KybStatus.APPROVED },
      });
      await expect(
        svc.submit(brandId, validInput, businessAdmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when brand missing', async () => {
      const { svc } = buildService({ initialBrand: null });
      await expect(
        svc.submit(brandId, validInput, businessAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('RBAC — BUSINESS_ADMIN of another brand cannot submit', async () => {
      const { svc, prisma } = buildService();
      await expect(
        svc.submit(brandId, validInput, otherBrandAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      // Authorization fails before any read.
      expect(prisma.brand.findUnique).not.toHaveBeenCalled();
    });

    it('SUPER_ADMIN can submit on behalf of any brand', async () => {
      const { svc, prisma } = buildService();
      await svc.submit(brandId, validInput, superAdmin);
      expect(prisma.brand.update).toHaveBeenCalled();
    });
  });

  // ─── approve ─────────────────────────────────────────────

  describe('approve', () => {
    it('PENDING → APPROVED + clears stale rejection columns', async () => {
      const { svc, prisma } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
      });
      await svc.approve(brandId, superAdmin);

      // Initial state-flip update.
      const firstCall = (prisma.brand.update as jest.Mock).mock.calls[0][0];
      expect(firstCall.data.kybStatus).toBe(KybStatus.APPROVED);
      expect(firstCall.data.kybRejectionReason).toBeNull();
      expect(firstCall.data.kybRejectedAt).toBeNull();
    });

    it('rejects approve from non-PENDING states', async () => {
      const { svc } = buildService({
        initialBrand: { kybStatus: KybStatus.NOT_STARTED },
      });
      await expect(
        svc.approve(brandId, superAdmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('only SUPER_ADMIN can approve', async () => {
      const { svc } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
      });
      await expect(
        svc.approve(brandId, businessAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('mock mode → synthesizes mock-brand-token-{brandId} and skips GraphQL', async () => {
      const { svc, prisma, tokenCreateMock, audit } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
        isMockMode: true,
      });
      await svc.approve(brandId, superAdmin);

      expect(tokenCreateMock).not.toHaveBeenCalled();
      // Second update writes the synthesized token.
      const tokenUpdateCall = (prisma.brand.update as jest.Mock).mock.calls[1][0];
      expect(tokenUpdateCall.data.tradeSafeTokenId).toBe(`mock-brand-token-${brandId}`);

      const auditCalls = (audit.log as jest.Mock).mock.calls.map(
        (c) => c[0].action,
      );
      expect(auditCalls).toContain('kyb.approve');
      expect(auditCalls).toContain('brand.tradesafe_token_created');
    });

    it('live mode → calls TradeSafe.tokenCreate once with org fields', async () => {
      const { svc, tokenCreateMock, prisma } = buildService({
        initialBrand: {
          kybStatus: KybStatus.PENDING,
          kybRegisteredName: 'Acme Corporation (Pty) Ltd',
          kybTradeName: 'Acme',
          kybContactEmail: 'kyb@acme.test',
          kybOrgType: KybOrgType.PRIVATE,
          kybRegistrationNumber: '2026/000001/07',
          kybTaxNumber: '0123456789',
        },
        isMockMode: false,
        tokenCreateResult: { id: 'real-tradesafe-token-123' },
      });

      await svc.approve(brandId, superAdmin);

      expect(tokenCreateMock).toHaveBeenCalledTimes(1);
      const tokenInput = tokenCreateMock.mock.calls[0][0];
      expect(tokenInput.organizationName).toBe('Acme Corporation (Pty) Ltd');
      expect(tokenInput.organizationTradeName).toBe('Acme');
      expect(tokenInput.organizationType).toBe('PRIVATE');
      expect(tokenInput.organizationRegistrationNumber).toBe('2026/000001/07');
      expect(tokenInput.organizationTaxNumber).toBe('0123456789');
      expect(tokenInput.email).toBe('kyb@acme.test');

      const tokenUpdateCall = (prisma.brand.update as jest.Mock).mock.calls[1][0];
      expect(tokenUpdateCall.data.tradeSafeTokenId).toBe('real-tradesafe-token-123');
    });

    it('TradeSafe failure → brand stays APPROVED, FAILED audit log written', async () => {
      const { svc, prisma, audit } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
        isMockMode: false,
        tokenCreateThrows: new Error('TradeSafe 503'),
      });
      await svc.approve(brandId, superAdmin);

      // Only one update — the APPROVED state-flip; the token-write update
      // never happens because tokenCreate threw.
      expect(prisma.brand.update).toHaveBeenCalledTimes(1);
      const firstCall = (prisma.brand.update as jest.Mock).mock.calls[0][0];
      expect(firstCall.data.kybStatus).toBe(KybStatus.APPROVED);

      const auditActions = (audit.log as jest.Mock).mock.calls.map(
        (c) => c[0].action,
      );
      expect(auditActions).toContain('kyb.approve');
      expect(auditActions).toContain('brand.tradesafe_token_create_failed');
      expect(auditActions).not.toContain('brand.tradesafe_token_created');

      const failedEntry = (audit.log as jest.Mock).mock.calls.find(
        (c) => c[0].action === 'brand.tradesafe_token_create_failed',
      )?.[0];
      expect(failedEntry?.reason).toBe('TradeSafe 503');
    });

    it('falls back to brand.name + brand.contactEmail when KYB-specific fields are null', async () => {
      const { svc, tokenCreateMock } = buildService({
        initialBrand: {
          kybStatus: KybStatus.PENDING,
          name: 'Fallback Co',
          contactEmail: 'fallback@example.test',
          kybRegisteredName: null,
          kybContactEmail: null,
        },
        isMockMode: false,
      });
      await svc.approve(brandId, superAdmin);
      const input = tokenCreateMock.mock.calls[0][0];
      expect(input.organizationName).toBe('Fallback Co');
      expect(input.email).toBe('fallback@example.test');
    });
  });

  // ─── reject ──────────────────────────────────────────────

  describe('reject', () => {
    it('persists rejectionReason + rejectedAt and writes KYB_REJECT audit log', async () => {
      const { svc, prisma, audit } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
      });
      const reason = 'Bank confirmation letter expired';
      await svc.reject(brandId, reason, superAdmin);

      const call = (prisma.brand.update as jest.Mock).mock.calls[0][0];
      expect(call.data.kybStatus).toBe(KybStatus.REJECTED);
      expect(call.data.kybRejectionReason).toBe(reason);
      expect(call.data.kybRejectedAt).toBeInstanceOf(Date);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyb.reject', reason }),
      );
    });

    it('allows withdraw-approval (APPROVED → REJECTED)', async () => {
      const { svc, prisma } = buildService({
        initialBrand: { kybStatus: KybStatus.APPROVED },
      });
      await svc.reject(brandId, 'Failed AVS post-approval', superAdmin);
      const call = (prisma.brand.update as jest.Mock).mock.calls[0][0];
      expect(call.data.kybStatus).toBe(KybStatus.REJECTED);
    });

    it('blocks reject from NOT_STARTED', async () => {
      const { svc } = buildService();
      await expect(
        svc.reject(brandId, 'Random reason', superAdmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('only SUPER_ADMIN can reject', async () => {
      const { svc } = buildService({
        initialBrand: { kybStatus: KybStatus.PENDING },
      });
      await expect(
        svc.reject(brandId, 'Random', businessAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ─── listPending ─────────────────────────────────────────

  describe('listPending', () => {
    it('SUPER_ADMIN — returns paginated PENDING brands oldest-first', async () => {
      const { svc, prisma } = buildService({
        pendingBrands: [
          {
            id: 'b-1',
            name: 'Older Brand',
            handle: 'older',
            kybStatus: KybStatus.PENDING,
            kybSubmittedAt: new Date('2026-04-01T00:00:00Z'),
            kybRegisteredName: 'Older Brand Pty',
            kybRegistrationNumber: '2026/0001/07',
            kybCountry: 'ZA',
            _count: { kybDocuments: 3 },
          },
          {
            id: 'b-2',
            name: 'Newer Brand',
            handle: 'newer',
            kybStatus: KybStatus.PENDING,
            kybSubmittedAt: new Date('2026-04-15T00:00:00Z'),
            kybRegisteredName: 'Newer Brand Pty',
            kybRegistrationNumber: '2026/0002/07',
            kybCountry: 'ZA',
            _count: { kybDocuments: 1 },
          },
        ],
        pendingTotal: 2,
      });

      const result = await svc.listPending(superAdmin, 1, 25);

      expect(prisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { kybStatus: KybStatus.PENDING },
          orderBy: { kybSubmittedAt: 'asc' },
          skip: 0,
          take: 25,
        }),
      );
      expect(result.data).toHaveLength(2);
      expect(result.data[0].brandId).toBe('b-1');
      expect(result.data[0].documentCount).toBe(3);
      expect(result.meta).toEqual({
        page: 1,
        limit: 25,
        total: 2,
        totalPages: 1,
      });
    });

    it('clamps invalid pagination inputs', async () => {
      const { svc, prisma } = buildService({ pendingBrands: [], pendingTotal: 0 });
      await svc.listPending(superAdmin, 0, 0);
      const call = (prisma.brand.findMany as jest.Mock).mock.calls[0][0];
      // page=0 -> safePage=1 -> skip=0; limit=0 -> safeLimit=25 -> take=25
      expect(call.skip).toBe(0);
      expect(call.take).toBe(25);
    });

    it('caps limit at 100', async () => {
      const { svc, prisma } = buildService({ pendingBrands: [], pendingTotal: 0 });
      await svc.listPending(superAdmin, 1, 9999);
      const call = (prisma.brand.findMany as jest.Mock).mock.calls[0][0];
      expect(call.take).toBe(100);
    });

    it('only SUPER_ADMIN can listPending', async () => {
      const { svc } = buildService();
      await expect(
        svc.listPending(businessAdmin, 1, 25),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ─── getReview ───────────────────────────────────────────

  describe('getReview', () => {
    it('returns full submission view including documents + audit slice', async () => {
      const { svc, prisma } = buildService({
        initialBrand: null, // overridden below via include
      });
      // The findUnique used by getReview includes kybDocuments, so the
      // returned shape is brand row + nested array. Re-mock for this case.
      (prisma.brand.findUnique as jest.Mock).mockResolvedValueOnce({
        ...baseBrand,
        kybStatus: KybStatus.PENDING,
        kybSubmittedAt: new Date('2026-04-25T00:00:00Z'),
        kybRegisteredName: 'Acme',
        kybTradeName: 'Acme Trading',
        kybOrgType: KybOrgType.PRIVATE,
        kybCountry: 'ZA',
        tradeSafeTokenId: null,
        kybDocuments: [
          {
            id: 'doc-1',
            documentType: 'COR_14_3',
            fileName: 'CIPC_14_3.pdf',
            fileUrl: '/uploads/kyb/abc.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
            uploadedAt: new Date('2026-04-26T10:00:00Z'),
            expiresAt: null,
            notes: null,
          },
        ],
      });
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'audit-1',
          action: 'kyb.submit',
          actorId: 'user-1',
          actorRole: 'BUSINESS_ADMIN',
          reason: null,
          createdAt: new Date('2026-04-25T00:00:00Z'),
          beforeState: null,
          afterState: { kybStatus: 'PENDING' },
        },
      ]);

      const view = await svc.getReview(brandId, superAdmin);

      expect(view.brandId).toBe(brandId);
      expect(view.kybStatus).toBe('PENDING');
      expect(view.registeredName).toBe('Acme');
      expect(view.documents).toHaveLength(1);
      expect(view.documents[0].fileName).toBe('CIPC_14_3.pdf');
      expect(view.recentAuditLog).toHaveLength(1);
      expect(view.recentAuditLog[0].action).toBe('kyb.submit');

      // Audit log query is filtered to KYB-related events.
      const auditCall = (prisma.auditLog.findMany as jest.Mock).mock.calls[0][0];
      expect(auditCall.where).toMatchObject({
        entityType: 'Brand',
        entityId: brandId,
        action: { startsWith: 'kyb.' },
      });
      expect(auditCall.take).toBe(50);
    });

    it('only SUPER_ADMIN can review', async () => {
      const { svc } = buildService();
      await expect(
        svc.getReview(brandId, businessAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFoundException when brand missing', async () => {
      const { svc, prisma } = buildService();
      (prisma.brand.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        svc.getReview('missing', superAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
