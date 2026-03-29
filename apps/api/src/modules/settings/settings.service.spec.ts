import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    systemSetting: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
      create: jest.Mock;
    };
  };

  const now = new Date('2025-06-01');

  const makeRow = (key: string, value: string) => ({
    key,
    value,
    type: 'boolean',
    updatedAt: now,
    updatedBy: null,
  });

  beforeEach(async () => {
    prisma = {
      systemSetting: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    // Clear the in-memory cache between tests
    (service as any).cache.clear();
    jest.clearAllMocks();
  });

  // ── isSignupEnabled ──────────────────────────────────────

  describe('isSignupEnabled', () => {
    it('should return true when DB value is "true"', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(
        makeRow('signupsEnabled', 'true'),
      );

      const result = await service.isSignupEnabled();

      expect(result).toBe(true);
    });

    it('should return false when DB value is "false"', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(
        makeRow('signupsEnabled', 'false'),
      );

      const result = await service.isSignupEnabled();

      expect(result).toBe(false);
    });
  });

  // ── isSubmissionEnabled ──────────────────────────────────

  describe('isSubmissionEnabled', () => {
    it('should return true when DB value is "true"', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(
        makeRow('submissionsEnabled', 'true'),
      );

      const result = await service.isSubmissionEnabled();

      expect(result).toBe(true);
    });
  });

  // ── getSettings ──────────────────────────────────────────

  describe('getSettings', () => {
    it('should return both settings from DB', async () => {
      prisma.systemSetting.findMany.mockResolvedValue([
        makeRow('signupsEnabled', 'false'),
        makeRow('submissionsEnabled', 'true'),
      ]);

      const result = await service.getSettings();

      expect(result.signupsEnabled).toBe(false);
      expect(result.submissionsEnabled).toBe(true);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should default to true when a key is missing from DB', async () => {
      prisma.systemSetting.findMany.mockResolvedValue([]);

      const result = await service.getSettings();

      expect(result.signupsEnabled).toBe(true);
      expect(result.submissionsEnabled).toBe(true);
    });
  });

  // ── updateSettings ───────────────────────────────────────

  describe('updateSettings', () => {
    it('should upsert each provided setting', async () => {
      prisma.systemSetting.upsert.mockResolvedValue(
        makeRow('signupsEnabled', 'false'),
      );

      await service.updateSettings({
        signupsEnabled: false,
        updatedById: 'admin-1',
      });

      expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'signupsEnabled' },
          update: expect.objectContaining({ value: 'false', updatedBy: 'admin-1' }),
          create: expect.objectContaining({ key: 'signupsEnabled', value: 'false' }),
        }),
      );
    });

    it('should upsert both settings when both are supplied', async () => {
      prisma.systemSetting.upsert.mockResolvedValue(
        makeRow('signupsEnabled', 'true'),
      );

      await service.updateSettings({
        signupsEnabled: true,
        submissionsEnabled: false,
        updatedById: 'admin-1',
      });

      expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(2);
    });
  });

  // ── getBoolean ───────────────────────────────────────────

  describe('getBoolean', () => {
    it('should return the default value when key is not found', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(null);

      const result = await service.getBoolean('unknownKey', false);

      expect(result).toBe(false);
    });
  });

  // ── cache ────────────────────────────────────────────────

  describe('cache', () => {
    it('should only call the DB once for repeated reads within TTL', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(
        makeRow('signupsEnabled', 'true'),
      );

      await service.isSignupEnabled();
      await service.isSignupEnabled();
      await service.isSignupEnabled();

      // findUnique should only have been called once; subsequent reads use cache
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
