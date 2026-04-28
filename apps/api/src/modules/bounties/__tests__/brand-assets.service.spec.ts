import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { MailService } from '../../mail/mail.service';
import { BountyStatus, BRAND_ASSET_LIMITS, AUDIT_ACTIONS } from '@social-bounty/shared';
import {
  mockBA,
  mockBA2,
  mockSA,
  mockParticipant,
  baseBountyRecord,
  baseBrandAssetRecord,
  createMockPrisma,
  createMockAuditService,
  createMockMailService,
} from './test-fixtures';

function mockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'files',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    destination: '/uploads/brand-assets',
    filename: 'test-uuid.png',
    path: '/uploads/brand-assets/test-uuid.png',
    buffer: Buffer.from(''),
    stream: null as any,
    ...overrides,
  };
}

describe('BountiesService - Brand Assets', () => {
  let service: BountiesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    auditService = createMockAuditService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
        { provide: MailService, useValue: createMockMailService() },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  describe('uploadBrandAssets', () => {
    it('should upload brand assets to a DRAFT bounty', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(0);

      const files = [mockFile(), mockFile({ originalname: 'banner.jpg', mimetype: 'image/jpeg' })];
      const createdAssets = files.map((f, i) => baseBrandAssetRecord({
        id: `asset-${i}`,
        fileName: f.originalname,
        mimeType: f.mimetype,
        fileSize: f.size,
      }));
      prisma.brandAsset.createManyAndReturn.mockResolvedValue(createdAssets);

      const result = await service.uploadBrandAssets('bounty-1', mockBA, files);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('fileName');
      expect(result[0]).toHaveProperty('mimeType');
      expect(result[0]).toHaveProperty('fileSize');
      expect(result[0]).toHaveProperty('createdAt');
      expect(prisma.brandAsset.createManyAndReturn).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.BRAND_ASSET_UPLOAD,
        }),
      );
    });

    it('should reject upload to non-DRAFT bounty', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.LIVE });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, [mockFile()]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload to PAUSED bounty', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.PAUSED });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, [mockFile()]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload to CLOSED bounty', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.CLOSED });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, [mockFile()]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload exceeding MAX_FILES_PER_BOUNTY', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY - 1); // limit - 1 existing

      // Try to add 2 more (limit - 1 + 2 = limit + 1 > limit)
      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, [mockFile(), mockFile()]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow upload up to exactly MAX_FILES_PER_BOUNTY', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY - 1); // limit - 1 existing

      const file = mockFile();
      prisma.brandAsset.createManyAndReturn.mockResolvedValue([baseBrandAssetRecord()]);

      // Add exactly 1 more (limit - 1 + 1 = limit)
      const result = await service.uploadBrandAssets('bounty-1', mockBA, [file]);

      expect(result).toHaveLength(1);
    });

    it('should reject upload when adding 6 to a fresh bounty (above 5-file cap)', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(0);

      // 6 files at once exceeds the 5-file ceiling
      const sixFiles = Array.from({ length: 6 }, (_, i) =>
        mockFile({ originalname: `file-${i}.png` }),
      );
      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, sixFiles),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept a single file at exactly MAX_FILE_SIZE (20MB)', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(0);
      prisma.brandAsset.createManyAndReturn.mockResolvedValue([baseBrandAssetRecord()]);

      // Multer enforces fileSize at the framework boundary; service-level check
      // doesn't re-validate file bytes. We assert the constant is the new ceiling
      // so the wire contract is locked: 20 * 1024 * 1024 = 20971520 bytes.
      expect(BRAND_ASSET_LIMITS.MAX_FILE_SIZE).toBe(20 * 1024 * 1024);

      const file = mockFile({ size: BRAND_ASSET_LIMITS.MAX_FILE_SIZE });
      const result = await service.uploadBrandAssets('bounty-1', mockBA, [file]);

      expect(result).toHaveLength(1);
    });

    it('should reject upload by BA from different org', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT, brandId: 'org-1' });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.uploadBrandAssets('bounty-1', mockBA2, [mockFile()]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow super admin to upload to any bounty', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.count.mockResolvedValue(0);
      prisma.brandAsset.createManyAndReturn.mockResolvedValue([baseBrandAssetRecord()]);

      const result = await service.uploadBrandAssets('bounty-1', mockSA, [mockFile()]);

      expect(result).toHaveLength(1);
    });

    it('should reject upload for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadBrandAssets('nonexistent', mockBA, [mockFile()]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject upload for deleted bounty', async () => {
      const bounty = baseBountyRecord({ deletedAt: new Date() });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.uploadBrandAssets('bounty-1', mockBA, [mockFile()]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBrandAsset', () => {
    it('should delete a brand asset', async () => {
      const bounty = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.findUnique.mockResolvedValue(baseBrandAssetRecord());
      prisma.brandAsset.delete.mockResolvedValue(baseBrandAssetRecord());

      const result = await service.deleteBrandAsset('bounty-1', 'asset-1', mockBA);

      expect(result).toEqual({ message: 'Brand asset deleted.' });
      expect(prisma.brandAsset.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.BRAND_ASSET_DELETE,
        }),
      );
    });

    it('should reject delete by BA from different org', async () => {
      const bounty = baseBountyRecord({ brandId: 'org-1' });
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      await expect(
        service.deleteBrandAsset('bounty-1', 'asset-1', mockBA2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject delete for non-existent asset', async () => {
      const bounty = baseBountyRecord();
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteBrandAsset('bounty-1', 'nonexistent', mockBA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject delete for asset belonging to different bounty', async () => {
      const bounty = baseBountyRecord();
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.findUnique.mockResolvedValue(
        baseBrandAssetRecord({ bountyId: 'other-bounty' }),
      );

      await expect(
        service.deleteBrandAsset('bounty-1', 'asset-1', mockBA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow super admin to delete any brand asset', async () => {
      const bounty = baseBountyRecord();
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.brandAsset.findUnique.mockResolvedValue(baseBrandAssetRecord());
      prisma.brandAsset.delete.mockResolvedValue(baseBrandAssetRecord());

      const result = await service.deleteBrandAsset('bounty-1', 'asset-1', mockSA);

      expect(result).toEqual({ message: 'Brand asset deleted.' });
    });
  });

  describe('getBrandAssetForDownload', () => {
    it('should return asset for participant on LIVE bounty', async () => {
      const asset = {
        ...baseBrandAssetRecord(),
        bounty: { brandId: 'org-1', status: BountyStatus.LIVE, deletedAt: null },
      };
      prisma.brandAsset.findUnique.mockResolvedValue(asset);

      const result = await service.getBrandAssetForDownload('asset-1', mockParticipant);

      expect(result).toEqual(asset);
    });

    it('should reject participant download on non-LIVE bounty', async () => {
      const asset = {
        ...baseBrandAssetRecord(),
        bounty: { brandId: 'org-1', status: BountyStatus.DRAFT, deletedAt: null },
      };
      prisma.brandAsset.findUnique.mockResolvedValue(asset);

      await expect(
        service.getBrandAssetForDownload('asset-1', mockParticipant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject BA download from different org', async () => {
      const asset = {
        ...baseBrandAssetRecord(),
        bounty: { brandId: 'org-1', status: BountyStatus.DRAFT, deletedAt: null },
      };
      prisma.brandAsset.findUnique.mockResolvedValue(asset);

      await expect(
        service.getBrandAssetForDownload('asset-1', mockBA2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow super admin to download any asset', async () => {
      const asset = {
        ...baseBrandAssetRecord(),
        bounty: { brandId: 'org-1', status: BountyStatus.DRAFT, deletedAt: null },
      };
      prisma.brandAsset.findUnique.mockResolvedValue(asset);

      const result = await service.getBrandAssetForDownload('asset-1', mockSA);

      expect(result).toEqual(asset);
    });

    it('should reject download for non-existent asset', async () => {
      prisma.brandAsset.findUnique.mockResolvedValue(null);

      await expect(
        service.getBrandAssetForDownload('nonexistent', mockBA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject download for deleted bounty', async () => {
      const asset = {
        ...baseBrandAssetRecord(),
        bounty: { brandId: 'org-1', status: BountyStatus.LIVE, deletedAt: new Date() },
      };
      prisma.brandAsset.findUnique.mockResolvedValue(asset);

      await expect(
        service.getBrandAssetForDownload('asset-1', mockBA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById includes brandAssets', () => {
    it('should include brandAssets in bounty detail response', async () => {
      const assets = [baseBrandAssetRecord()];
      const bounty = {
        ...baseBountyRecord({ status: BountyStatus.LIVE }),
        brand: { id: 'org-1', name: 'Test Org', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'User' },
        rewards: [],
        brandAssets: assets,
        _count: { submissions: 0 },
      };
      prisma.bounty.findUnique.mockResolvedValue(bounty);

      const result = await service.findById('bounty-1', mockParticipant);

      expect(result.brandAssets).toBeDefined();
      expect(result.brandAssets).toHaveLength(1);
      expect(result.brandAssets[0]).toHaveProperty('id', 'asset-1');
      expect(result.brandAssets[0]).toHaveProperty('fileName', 'logo.png');
      expect(result.brandAssets[0]).toHaveProperty('mimeType', 'image/png');
      expect(result.brandAssets[0]).toHaveProperty('fileSize', 1024);
      expect(result.brandAssets[0]).toHaveProperty('createdAt');
    });
  });
});
