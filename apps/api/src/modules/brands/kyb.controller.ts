import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { KybDocumentType, KybOrgType } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { Audited, CurrentUser, Roles } from '../../common/decorators';
import { buildContentDisposition } from '../../common/utils/content-disposition';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { KybService } from './kyb.service';
import { KYB_DOCUMENT_LIMITS, KybDocumentsService } from './kyb-documents.service';

const KYB_DOCUMENT_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const kybUploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = path.resolve(process.cwd(), 'uploads', 'kyb');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = KYB_DOCUMENT_MIME_TO_EXT[file.mimetype] ?? '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

class SubmitKybDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  registeredName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vatNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxNumber?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country!: string;

  @IsEmail()
  contactEmail!: string;

  @IsEnum(KybOrgType)
  orgType!: KybOrgType;
}

class RejectKybDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}

class UploadKybDocumentDto {
  @IsEnum(KybDocumentType)
  documentType!: KybDocumentType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * Controller for the brand-side KYB capture surface and the
 * SUPER_ADMIN review surface. Routes:
 *
 *   POST   /brands/:brandId/kyb                         brand admin / SA
 *   POST   /brands/:brandId/kyb/approve                 SA only
 *   POST   /brands/:brandId/kyb/reject                  SA only
 *   POST   /brands/:brandId/kyb/documents               brand admin / SA
 *   GET    /brands/:brandId/kyb/documents               brand admin / SA
 *   DELETE /brands/:brandId/kyb/documents/:documentId   uploader / SA
 *   GET    /admin/brands/kyb                            SA only — review queue
 *   GET    /admin/brands/:brandId/kyb/review            SA only — full view
 *
 * The brand-side and admin-review routes coexist on this single
 * controller because they share the same `KybService` and live in the
 * same conceptual domain. Splitting them into two controllers buys no
 * isolation while doubling the wiring surface.
 */
@Controller()
export class KybController {
  constructor(
    private readonly kyb: KybService,
    private readonly documents: KybDocumentsService,
  ) {}

  // ─── Brand-side submission flow ──────────────────────────

  @Post('brands/:brandId/kyb')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('KYB_SUBMIT', 'Brand')
  async submit(
    @Param('brandId') brandId: string,
    @Body() body: SubmitKybDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.submit(brandId, body, user);
  }

  @Post('brands/:brandId/kyb/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('KYB_APPROVE', 'Brand')
  async approve(
    @Param('brandId') brandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.approve(brandId, user);
  }

  @Post('brands/:brandId/kyb/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('KYB_REJECT', 'Brand')
  async reject(
    @Param('brandId') brandId: string,
    @Body() body: RejectKybDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.reject(brandId, body.reason, user);
  }

  // ─── KYB documents ───────────────────────────────────────

  @Post('brands/:brandId/kyb/documents')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('KYB_DOCUMENT_UPLOADED', 'Brand')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: kybUploadStorage,
      limits: { fileSize: KYB_DOCUMENT_LIMITS.MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = KYB_DOCUMENT_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
        if (!allowed.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @Param('brandId') brandId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadKybDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required');
    }
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.documents.uploadDocument(
      brandId,
      file,
      body.documentType,
      user,
      expiresAt,
      body.notes,
    );
  }

  @Get('brands/:brandId/kyb/documents')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async listDocuments(
    @Param('brandId') brandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documents.listDocuments(brandId, user);
  }

  /**
   * Stream a KYB document file from disk. RBAC matches list/upload — same
   * brand membership or SUPER_ADMIN. The serializer hands this URL back
   * as `KybDocumentResponse.fileUrl`, so frontend `window.open(doc.fileUrl)`
   * lands here directly. Path-traversal guarded server-side via
   * `path.resolve` + the `getDocumentForDownload` brandId-mismatch check.
   */
  @Get('brands/:brandId/kyb/documents/:documentId/download')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async downloadDocument(
    @Param('brandId') brandId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const doc = await this.documents.getDocumentForDownload(
      brandId,
      documentId,
      user,
    );
    const filePath = path.resolve(doc.diskPath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    res.setHeader('Content-Type', doc.mimeType);
    // `inline` instead of `attachment` so PDFs / images render in the
    // browser tab the admin opens for review (no forced download).
    // RFC 5987/6266 helper handles UTF-8 + header-injection defence
    // (see `apps/api/src/common/utils/content-disposition.ts`).
    res.setHeader(
      'Content-Disposition',
      buildContentDisposition('inline', doc.fileName),
    );
    fs.createReadStream(filePath).pipe(res);
  }

  @Delete('brands/:brandId/kyb/documents/:documentId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Audited('KYB_DOCUMENT_DELETED', 'Brand')
  async deleteDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documents.deleteDocument(documentId, user);
  }

  // ─── Admin review surface (SUPER_ADMIN only) ─────────────

  @Get('admin/brands/kyb')
  @Roles(UserRole.SUPER_ADMIN)
  async listPending(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.kyb.listPending(user, page, limit);
  }

  @Get('admin/brands/:brandId/kyb/review')
  @Roles(UserRole.SUPER_ADMIN)
  async getReview(
    @Param('brandId') brandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.getReview(brandId, user);
  }

  /**
   * Recovery endpoint for the rare APPROVED-but-tokenCreate-failed case.
   * The approve flow's TradeSafe mint is best-effort (failures audit-log
   * `BRAND_TRADESAFE_TOKEN_CREATE_FAILED` but don't roll back approval),
   * so without this an operator would have to either (a) hand-edit the
   * Brand row in the DB or (b) reject + resubmit + re-approve to retry
   * — both worse than a proper retry endpoint.
   *
   * State guards live in the service: APPROVED-only, and only when
   * `tradeSafeTokenId` is null. SUPER_ADMIN only.
   */
  @Post('admin/brands/:brandId/kyb/retry-token-mint')
  @Roles(UserRole.SUPER_ADMIN)
  @Audited('BRAND_TRADESAFE_TOKEN_CREATED', 'Brand')
  async retryTokenMint(
    @Param('brandId') brandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kyb.retryTradeSafeTokenMint(brandId, user);
  }
}
