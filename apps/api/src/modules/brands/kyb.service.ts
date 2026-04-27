import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KybDocumentType, KybOrgType, KybStatus } from '@prisma/client';
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  UserRole,
  KybStatus as SharedKybStatus,
  KybOrgType as SharedKybOrgType,
} from '@social-bounty/shared';
import type {
  AdminKybQueueResponse,
  BrandKybSubmissionView,
  BrandKybAuditLogEntry,
  KybDocumentResponse,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { AuthenticatedUser } from '../auth/jwt.strategy';

/**
 * Submission payload accepted by `KybService.submit`. Wave 1 (R24
 * pre-launch) added `tradeName`, `taxNumber`, and `orgType`. KYB
 * documents live in the dedicated `kyb_documents` table via the
 * documents endpoints — no free-text reference on the submission.
 */
export interface KybSubmissionInput {
  registeredName: string;
  tradeName?: string;
  registrationNumber: string;
  vatNumber?: string;
  taxNumber?: string;
  country: string;
  contactEmail: string;
  /** TradeSafe `tokenCreate` requires this for org parties. */
  orgType: KybOrgType;
}

@Injectable()
export class KybService {
  private readonly logger = new Logger(KybService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tradeSafeGraphQLClient: TradeSafeGraphQLClient,
  ) {}

  /**
   * Submit (or re-submit) the brand's KYB form.
   *
   * State transitions allowed:
   *   - NOT_STARTED → PENDING (first submit)
   *   - REJECTED    → PENDING (resubmit after admin rejection)
   *
   * Anything else (PENDING / APPROVED) is rejected with a
   * `BadRequestException`. Resubmits clear `kybRejectionReason` /
   * `kybRejectedAt` so the form doesn't carry stale rejection text.
   *
   * RBAC: BUSINESS_ADMIN of the brand (matched via `user.brandId`) or
   * SUPER_ADMIN.
   */
  async submit(brandId: string, input: KybSubmissionInput, user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.brandId !== brandId) {
      throw new ForbiddenException('Not authorized');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    // Tightened guard (Wave 1): only NOT_STARTED + REJECTED can transition
    // to PENDING. The previous code only blocked APPROVED, allowing a
    // PENDING brand to "re-submit" indefinitely while still in review —
    // confusing for admins and creating audit-log noise.
    if (
      brand.kybStatus !== KybStatus.NOT_STARTED &&
      brand.kybStatus !== KybStatus.REJECTED
    ) {
      throw new BadRequestException(
        `KYB cannot be submitted from status ${brand.kybStatus}; must be NOT_STARTED or REJECTED`,
      );
    }

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        kybStatus: KybStatus.PENDING,
        kybSubmittedAt: new Date(),
        kybRegisteredName: input.registeredName,
        kybTradeName: input.tradeName ?? null,
        kybRegistrationNumber: input.registrationNumber,
        kybVatNumber: input.vatNumber ?? null,
        kybTaxNumber: input.taxNumber ?? null,
        kybCountry: input.country,
        kybContactEmail: input.contactEmail,
        kybOrgType: input.orgType,
        // Resubmit hygiene: a freshly-PENDING brand should never carry a
        // stale rejection reason / timestamp from a prior cycle.
        kybRejectionReason: null,
        kybRejectedAt: null,
      },
    });

    this.audit.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.KYB_SUBMIT,
      entityType: ENTITY_TYPES.BRAND,
      entityId: brandId,
      beforeState: { kybStatus: brand.kybStatus },
      afterState: {
        kybStatus: updated.kybStatus,
        registeredName: input.registeredName,
        tradeName: input.tradeName ?? null,
        registrationNumber: input.registrationNumber,
        vatNumber: input.vatNumber ?? null,
        taxNumber: input.taxNumber ?? null,
        country: input.country,
        contactEmail: input.contactEmail,
        orgType: input.orgType,
      },
    });
    this.logger.log(`KYB submitted for brand ${brandId}`);
    return updated;
  }

  /**
   * Approve a PENDING KYB submission and (best-effort) mint a TradeSafe
   * party token for the brand.
   *
   * The TradeSafe `tokenCreate` side-effect runs AFTER the local APPROVED
   * write commits; if it fails, the brand stays APPROVED on our side and
   * we record a `BRAND_TRADESAFE_TOKEN_CREATE_FAILED` audit log. Recovery
   * is via a separate admin-only retry action — out of scope for Wave 1
   * (operators can manually populate the column via DB or a future
   * `/admin/brands/:id/kyb/retry-token-mint` endpoint).
   *
   * Mock mode short-circuits to `mock-brand-token-{brandId}` so dev/CI
   * don't need TradeSafe credentials.
   *
   * RBAC: SUPER_ADMIN only.
   */
  async approve(brandId: string, approver: AuthenticatedUser) {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can approve KYB');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus !== KybStatus.PENDING) {
      throw new BadRequestException(
        `KYB is ${brand.kybStatus}; only PENDING can be approved`,
      );
    }

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        kybStatus: KybStatus.APPROVED,
        kybApprovedAt: new Date(),
        // Belt-and-braces: clear any stale rejection state on the row even
        // though the submit path already nulls these. Approving from
        // PENDING via this method should never observe non-null values
        // here, but the explicit clear means a row-level audit (e.g.
        // future state-machine probe) doesn't surface stale data.
        kybRejectionReason: null,
        kybRejectedAt: null,
      },
    });

    this.audit.log({
      actorId: approver.sub,
      actorRole: approver.role as UserRole,
      action: AUDIT_ACTIONS.KYB_APPROVE,
      entityType: ENTITY_TYPES.BRAND,
      entityId: brandId,
      beforeState: { kybStatus: brand.kybStatus },
      afterState: { kybStatus: updated.kybStatus },
    });

    // TradeSafe `tokenCreate` side-effect — see JSDoc above for the failure
    // policy. Wrapped in try/catch so a flaky TradeSafe doesn't undo our
    // approval.
    await this.mintTradeSafeBrandToken(updated, approver).catch((err) => {
      this.logger.error(
        `TradeSafe tokenCreate failed for brand ${brandId} (KYB approval still stands):`,
        err,
      );
      this.audit.log({
        actorId: approver.sub,
        actorRole: approver.role as UserRole,
        action: AUDIT_ACTIONS.BRAND_TRADESAFE_TOKEN_CREATE_FAILED,
        entityType: ENTITY_TYPES.BRAND,
        entityId: brandId,
        reason: err instanceof Error ? err.message : String(err),
        afterState: { kybStatus: updated.kybStatus, tradeSafeTokenId: null },
      });
    });

    return updated;
  }

  /**
   * Reject a KYB submission with a persisted reason.
   *
   * The from-state guard is intentionally loose post-Wave 1: rejecting
   * from PENDING is the common case, but rejecting from APPROVED ("withdraw
   * approval") is a legitimate ops path when KYB documents subsequently
   * fail bank-AVS or expire. Rejecting from NOT_STARTED is meaningless
   * (no submission to reject) and is blocked.
   *
   * RBAC: SUPER_ADMIN only.
   */
  async reject(brandId: string, reason: string, approver: AuthenticatedUser) {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can reject KYB');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus === KybStatus.NOT_STARTED) {
      throw new BadRequestException(
        'Cannot reject KYB that has not been submitted',
      );
    }

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        kybStatus: KybStatus.REJECTED,
        kybRejectionReason: reason,
        kybRejectedAt: new Date(),
      },
    });
    this.audit.log({
      actorId: approver.sub,
      actorRole: approver.role as UserRole,
      action: AUDIT_ACTIONS.KYB_REJECT,
      entityType: ENTITY_TYPES.BRAND,
      entityId: brandId,
      reason,
      beforeState: { kybStatus: brand.kybStatus },
      afterState: { kybStatus: updated.kybStatus, kybRejectionReason: reason },
    });
    return updated;
  }

  /**
   * Paginated SUPER_ADMIN-only review queue. Returns brands awaiting
   * review, oldest-submitted first (the composite index on (kybStatus,
   * kybSubmittedAt) makes this an O(log n) lookup at any size).
   */
  async listPending(
    user: AuthenticatedUser,
    page = 1,
    limit = 25,
  ): Promise<AdminKybQueueResponse> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can list pending KYB');
    }
    const safePage = page > 0 ? Math.floor(page) : 1;
    const safeLimit = limit > 0 ? Math.min(Math.floor(limit), 100) : 25;

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where: { kybStatus: KybStatus.PENDING },
        orderBy: { kybSubmittedAt: 'asc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          _count: { select: { kybDocuments: true } },
        },
      }),
      this.prisma.brand.count({ where: { kybStatus: KybStatus.PENDING } }),
    ]);

    return {
      data: brands.map((b) => ({
        brandId: b.id,
        brandName: b.name,
        brandHandle: b.handle,
        // Prisma's `$Enums.KybStatus` and the shared `KybStatus` enum
        // share string values but TS treats them as nominal — cast at the
        // serialization boundary, same pattern used elsewhere.
        kybStatus: b.kybStatus as SharedKybStatus,
        kybSubmittedAt: b.kybSubmittedAt
          ? b.kybSubmittedAt.toISOString()
          : null,
        registeredName: b.kybRegisteredName,
        registrationNumber: b.kybRegistrationNumber,
        country: b.kybCountry,
        // 2026-04-27 integration fix — orgType wasn't in the original
        // queue mapper but the admin UI wants the badge column.
        orgType: b.kybOrgType as SharedKybOrgType | null,
        documentCount: b._count.kybDocuments,
      })),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Full SUPER_ADMIN review payload — brand identity + submitted KYB
   * fields + uploaded documents + recent KYB-related audit log slice.
   * Three queries (brand+docs, audit slice) parallelised for latency.
   */
  async getReview(
    brandId: string,
    user: AuthenticatedUser,
  ): Promise<BrandKybSubmissionView> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can review KYB');
    }
    const [brand, auditEntries] = await Promise.all([
      this.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          kybDocuments: { orderBy: { uploadedAt: 'desc' } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          entityType: ENTITY_TYPES.BRAND,
          entityId: brandId,
          action: { startsWith: 'kyb.' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    if (!brand) throw new NotFoundException('Brand not found');

    return {
      brandId: brand.id,
      brandName: brand.name,
      brandHandle: brand.handle,
      kybStatus: brand.kybStatus as SharedKybStatus,
      kybSubmittedAt: brand.kybSubmittedAt
        ? brand.kybSubmittedAt.toISOString()
        : null,
      kybApprovedAt: brand.kybApprovedAt
        ? brand.kybApprovedAt.toISOString()
        : null,
      kybRejectedAt: brand.kybRejectedAt
        ? brand.kybRejectedAt.toISOString()
        : null,
      kybRejectionReason: brand.kybRejectionReason,
      registeredName: brand.kybRegisteredName,
      tradeName: brand.kybTradeName,
      registrationNumber: brand.kybRegistrationNumber,
      vatNumber: brand.kybVatNumber,
      taxNumber: brand.kybTaxNumber,
      country: brand.kybCountry,
      contactEmail: brand.kybContactEmail,
      orgType: brand.kybOrgType,
      tradeSafeTokenId: brand.tradeSafeTokenId,
      documents: brand.kybDocuments.map((d) => this.serializeDocument(d)),
      recentAuditLog: auditEntries.map((e) => this.serializeAuditEntry(e)),
    };
  }

  /**
   * SUPER_ADMIN-only retry of the TradeSafe `tokenCreate` mint for a
   * brand that's already KYB-APPROVED but has no `tradeSafeTokenId`. The
   * approve-time mint is best-effort (failures audit-log but don't roll
   * back the approval) — this endpoint is the deliberate, observable
   * recovery path. Returns the freshly-minted token id.
   *
   * State guards:
   *   - SUPER_ADMIN only (mints affect what TradeSafe sees as the BUYER
   *     party for every future bounty funding, so we don't widen this).
   *   - Brand must be APPROVED. If still PENDING/REJECTED/NOT_STARTED,
   *     the right move is the normal approve flow, not retry.
   *   - tradeSafeTokenId must currently be null. A second mint would
   *     create a second TradeSafe party + leave the first orphan; if
   *     the existing token is bad, an admin should reject + resubmit
   *     + re-approve to reset the state.
   *
   * Errors propagate from `mintTradeSafeBrandToken` (the network call)
   * — in mock mode there's no network, so this can only fail on the
   * Prisma update. The caller (controller) translates exceptions into
   * a 5xx; the brand stays APPROVED-without-token regardless, ready
   * for another retry.
   */
  async retryTradeSafeTokenMint(
    brandId: string,
    approver: AuthenticatedUser,
  ): Promise<{ tradeSafeTokenId: string }> {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can retry TradeSafe token mint');
    }
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.kybStatus !== KybStatus.APPROVED) {
      throw new BadRequestException(
        `KYB is ${brand.kybStatus}; retry is only valid after APPROVED`,
      );
    }
    if (brand.tradeSafeTokenId) {
      throw new BadRequestException(
        'Brand already has a TradeSafe token — reject + resubmit + re-approve to reset',
      );
    }

    await this.mintTradeSafeBrandToken(brand, approver);

    // Re-read to surface the freshly-written token id. Cheap second
    // round-trip — preferable to relying on `mintTradeSafeBrandToken`'s
    // internal contract.
    const refreshed = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { tradeSafeTokenId: true },
    });
    return { tradeSafeTokenId: refreshed?.tradeSafeTokenId ?? '' };
  }

  // ─── helpers ────────────────────────────────────────────

  /**
   * Best-effort TradeSafe `tokenCreate` after a KYB approval. Writes the
   * resulting token id to the brand row; failures bubble out so the
   * caller can audit-log them. Mock mode short-circuits before any
   * network call.
   */
  private async mintTradeSafeBrandToken(
    brand: {
      id: string;
      name: string;
      contactEmail: string;
      kybRegisteredName: string | null;
      kybTradeName: string | null;
      kybContactEmail: string | null;
      kybOrgType: KybOrgType | null;
      kybRegistrationNumber: string | null;
      kybTaxNumber: string | null;
    },
    approver: AuthenticatedUser,
  ): Promise<void> {
    let tokenId: string;
    if (this.tradeSafeGraphQLClient.isMockMode()) {
      tokenId = `mock-brand-token-${brand.id}`;
    } else {
      const orgName = brand.kybRegisteredName ?? brand.name;
      const email = brand.kybContactEmail ?? brand.contactEmail;
      const result = await this.tradeSafeGraphQLClient.tokenCreate({
        // TradeSafe's `tokenCreate` requires at least one user-shaped
        // field even when registering an org party — pass placeholders
        // that the org-name fields will dominate.
        givenName: 'Brand',
        familyName: orgName,
        email,
        organizationName: orgName,
        organizationTradeName: brand.kybTradeName ?? undefined,
        organizationType: brand.kybOrgType ?? undefined,
        organizationRegistrationNumber: brand.kybRegistrationNumber ?? undefined,
        organizationTaxNumber: brand.kybTaxNumber ?? undefined,
      });
      tokenId = result.id;
    }

    await this.prisma.brand.update({
      where: { id: brand.id },
      data: { tradeSafeTokenId: tokenId },
    });

    this.audit.log({
      actorId: approver.sub,
      actorRole: approver.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_TRADESAFE_TOKEN_CREATED,
      entityType: ENTITY_TYPES.BRAND,
      entityId: brand.id,
      afterState: { tradeSafeTokenId: tokenId },
    });
  }

  private serializeDocument(doc: {
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

  private serializeAuditEntry(entry: {
    id: string;
    action: string;
    actorId: string;
    actorRole: string;
    reason: string | null;
    createdAt: Date;
    beforeState: unknown;
    afterState: unknown;
  }): BrandKybAuditLogEntry {
    return {
      id: entry.id,
      action: entry.action,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString(),
      beforeState: entry.beforeState as Record<string, unknown> | null,
      afterState: entry.afterState as Record<string, unknown> | null,
    };
  }
}
