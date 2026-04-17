import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry {
  value: string;
  type: string;
  updatedAt: Date;
  updatedBy: string | null;
  cachedAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Database-backed settings service with short in-memory cache.
 * Replaces the previous in-memory-only implementation.
 * Seeds default settings on module init if they don't exist.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, CacheEntry>();

  private static readonly DEFAULT_SETTINGS: Array<{
    key: string;
    value: string;
    type: string;
  }> = [
    { key: 'signupsEnabled', value: 'true', type: 'boolean' },
    { key: 'submissionsEnabled', value: 'true', type: 'boolean' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  // ─── Public API (preserves existing surface) ───────────────

  async isSignupEnabled(): Promise<boolean> {
    return this.getBoolean('signupsEnabled', true);
  }

  async isSubmissionEnabled(): Promise<boolean> {
    return this.getBoolean('submissionsEnabled', true);
  }

  async getSettings(): Promise<{
    signupsEnabled: boolean;
    submissionsEnabled: boolean;
    updatedAt: Date;
    updatedById: string | null;
  }> {
    const all = await this.getAllSettings();

    const signupsRow = all.find((s) => s.key === 'signupsEnabled');
    const submissionsRow = all.find((s) => s.key === 'submissionsEnabled');

    // Use the most recent updatedAt across the two core settings
    const dates = [signupsRow?.updatedAt, submissionsRow?.updatedAt].filter(
      Boolean,
    ) as Date[];
    const latestDate =
      dates.length > 0
        ? dates.reduce((a, b) => (a > b ? a : b))
        : new Date();

    // Use the updatedBy from whichever setting was changed most recently
    const latestRow =
      signupsRow && submissionsRow
        ? signupsRow.updatedAt >= submissionsRow.updatedAt
          ? signupsRow
          : submissionsRow
        : signupsRow || submissionsRow;

    return {
      signupsEnabled: signupsRow ? signupsRow.value === 'true' : true,
      submissionsEnabled: submissionsRow
        ? submissionsRow.value === 'true'
        : true,
      updatedAt: latestDate,
      updatedById: latestRow?.updatedBy ?? null,
    };
  }

  async updateSettings(data: {
    signupsEnabled?: boolean;
    submissionsEnabled?: boolean;
    updatedById: string;
  }): Promise<void> {
    const ops: Promise<unknown>[] = [];

    if (data.signupsEnabled !== undefined) {
      ops.push(
        this.setSetting(
          'signupsEnabled',
          String(data.signupsEnabled),
          'boolean',
          data.updatedById,
        ),
      );
    }
    if (data.submissionsEnabled !== undefined) {
      ops.push(
        this.setSetting(
          'submissionsEnabled',
          String(data.submissionsEnabled),
          'boolean',
          data.updatedById,
        ),
      );
    }

    await Promise.all(ops);
  }

  // ─── Generic accessors ─────────────────────────────────────

  async getSetting(
    key: string,
  ): Promise<{ value: string; type: string; updatedAt: Date; updatedBy: string | null } | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return {
        value: cached.value,
        type: cached.type,
        updatedAt: cached.updatedAt,
        updatedBy: cached.updatedBy,
      };
    }

    try {
      const row = await this.prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!row) {
        this.cache.delete(key);
        return null;
      }

      this.cache.set(key, {
        value: row.value,
        type: row.type,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        cachedAt: Date.now(),
      });

      return {
        value: row.value,
        type: row.type,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      };
    } catch (error) {
      this.logger.error(`Failed to read setting "${key}"`, error);
      // Return cached value if available, even if stale
      if (cached) {
        return {
          value: cached.value,
          type: cached.type,
          updatedAt: cached.updatedAt,
          updatedBy: cached.updatedBy,
        };
      }
      return null;
    }
  }

  async setSetting(
    key: string,
    value: string,
    type: string = 'string',
    userId?: string,
  ): Promise<void> {
    try {
      const row = await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value, type, updatedBy: userId ?? null },
        create: { key, value, type, updatedBy: userId ?? null },
      });

      // Invalidate cache immediately so subsequent reads see the new value
      this.cache.set(key, {
        value: row.value,
        type: row.type,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        cachedAt: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Failed to write setting "${key}"`, error);
      throw error;
    }
  }

  async getAllSettings(): Promise<
    Array<{
      key: string;
      value: string;
      type: string;
      updatedAt: Date;
      updatedBy: string | null;
    }>
  > {
    try {
      const rows = await this.prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });

      // Refresh cache for all returned rows
      for (const row of rows) {
        this.cache.set(row.key, {
          value: row.value,
          type: row.type,
          updatedAt: row.updatedAt,
          updatedBy: row.updatedBy,
          cachedAt: Date.now(),
        });
      }

      return rows.map((r) => ({
        key: r.key,
        value: r.value,
        type: r.type,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy,
      }));
    } catch (error) {
      this.logger.error('Failed to read all settings', error);
      return [];
    }
  }

  async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const setting = await this.getSetting(key);
    if (!setting) return defaultValue;
    return setting.value === 'true';
  }

  // ─── Internals ─────────────────────────────────────────────

  private async seedDefaults(): Promise<void> {
    for (const def of SettingsService.DEFAULT_SETTINGS) {
      try {
        const existing = await this.prisma.systemSetting.findUnique({
          where: { key: def.key },
        });
        if (!existing) {
          await this.prisma.systemSetting.create({
            data: { key: def.key, value: def.value, type: def.type },
          });
          this.logger.log(`Seeded default setting: ${def.key}=${def.value}`);
        }
      } catch (error) {
        this.logger.error(`Failed to seed setting "${def.key}"`, error);
      }
    }
  }
}
