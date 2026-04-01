import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  SocialPlatform,
  SocialHandleStatus,
  SOCIAL_HANDLE_CONSTANTS,
  PROFILE_LIMITS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

// Platform-specific handle regex patterns
const HANDLE_PATTERNS: Record<SocialPlatform, RegExp> = {
  [SocialPlatform.X]: /^[a-zA-Z0-9_]{1,15}$/,
  [SocialPlatform.INSTAGRAM]: /^[a-zA-Z0-9_.]{1,30}$/,
  [SocialPlatform.FACEBOOK]: /^[a-zA-Z0-9.]{5,50}$/,
  [SocialPlatform.TIKTOK]: /^[a-zA-Z0-9_.]{1,24}$/,
};

@Injectable()
export class SocialHandlesService {
  private readonly logger = new Logger(SocialHandlesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private normalizeHandle(handle: string): string {
    return handle.toLowerCase().replace(/^@/, '');
  }

  private buildProfileUrl(
    platform: SocialPlatform,
    normalizedHandle: string,
  ): string {
    return SOCIAL_HANDLE_CONSTANTS.PROFILE_URL_TEMPLATES[platform].replace(
      '{handle}',
      normalizedHandle,
    );
  }

  private validateHandleFormat(
    platform: SocialPlatform,
    normalizedHandle: string,
  ): void {
    const pattern = HANDLE_PATTERNS[platform];
    if (!pattern.test(normalizedHandle)) {
      throw new BadRequestException(
        `Invalid handle format for ${platform}. Handle must match: ${pattern.source}`,
      );
    }

    const maxLen =
      SOCIAL_HANDLE_CONSTANTS.MAX_LENGTH[platform];
    if (normalizedHandle.length > maxLen) {
      throw new BadRequestException(
        `Handle for ${platform} must not exceed ${maxLen} characters`,
      );
    }
  }

  async addHandle(userId: string, platform: SocialPlatform, handle: string) {
    const normalizedHandle = this.normalizeHandle(handle);
    this.validateHandleFormat(platform, normalizedHandle);

    // Check if user already has a handle for this platform
    const existing = await this.prisma.userSocialHandle.findUnique({
      where: { userId_platform: { userId, platform } },
    });

    if (existing) {
      throw new ConflictException(
        `You already have a ${platform} handle registered`,
      );
    }

    // Check if this handle is already claimed by another user
    const claimed = await this.prisma.userSocialHandle.findUnique({
      where: {
        platform_normalizedHandle: { platform, normalizedHandle },
      },
    });

    if (claimed) {
      throw new ConflictException(
        `This ${platform} handle is already registered by another user`,
      );
    }

    const profileUrl = this.buildProfileUrl(platform, normalizedHandle);

    const socialHandle = await this.prisma.userSocialHandle.create({
      data: {
        userId,
        platform,
        handle: normalizedHandle,
        normalizedHandle,
        profileUrl,
        status: SocialHandleStatus.PENDING_VALIDATION,
      },
    });

    // Fire async validation
    this.validateHandle(socialHandle.id).catch((err) => {
      this.logger.error(
        `Failed to validate handle ${socialHandle.id}: ${err.message}`,
      );
    });

    return this.formatResponse(socialHandle);
  }

  async validateHandle(handleId: string): Promise<void> {
    const handle = await this.prisma.userSocialHandle.findUnique({
      where: { id: handleId },
    });

    if (!handle) return;

    const profileUrl = this.buildProfileUrl(
      handle.platform as unknown as SocialPlatform,
      handle.normalizedHandle,
    );

    try {
      const response = await fetch(profileUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok || response.status === 405) {
        // 405 = method not allowed but page exists
        await this.prisma.userSocialHandle.update({
          where: { id: handleId },
          data: {
            status: SocialHandleStatus.VERIFIED,
            lastValidatedAt: new Date(),
            validationError: null,
          },
        });
      } else {
        await this.prisma.userSocialHandle.update({
          where: { id: handleId },
          data: {
            status: SocialHandleStatus.FAILED_VALIDATION,
            lastValidatedAt: new Date(),
            validationError: `HTTP ${response.status}`,
          },
        });
      }
    } catch (err: any) {
      await this.prisma.userSocialHandle.update({
        where: { id: handleId },
        data: {
          status: SocialHandleStatus.FAILED_VALIDATION,
          lastValidatedAt: new Date(),
          validationError: err.message || 'Validation request failed',
        },
      });
    }
  }

  async listMyHandles(userId: string) {
    const handles = await this.prisma.userSocialHandle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return handles.map((h) => this.formatResponse(h));
  }

  async removeHandle(userId: string, handleId: string) {
    const handle = await this.prisma.userSocialHandle.findUnique({
      where: { id: handleId },
    });

    if (!handle) {
      throw new NotFoundException('Social handle not found');
    }

    if (handle.userId !== userId) {
      throw new NotFoundException('Social handle not found');
    }

    await this.prisma.userSocialHandle.delete({
      where: { id: handleId },
    });

    return { message: 'Social handle removed successfully' };
  }

  async lookupByHandle(
    platform: SocialPlatform,
    normalizedHandle: string,
  ): Promise<string | null> {
    const handle = await this.prisma.userSocialHandle.findUnique({
      where: {
        platform_normalizedHandle: { platform, normalizedHandle },
      },
      select: { userId: true },
    });

    return handle?.userId ?? null;
  }

  async getUserHandles(userId: string) {
    const handles = await this.prisma.userSocialHandle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return handles.map((h) => this.formatResponse(h));
  }

  private formatResponse(handle: any) {
    return {
      id: handle.id,
      platform: handle.platform,
      handle: handle.handle,
      normalizedHandle: handle.normalizedHandle,
      profileUrl: handle.profileUrl,
      profileImageUrl: handle.profileImageUrl,
      displayName: handle.displayName,
      followerCount: handle.followerCount,
      status: handle.status,
      lastValidatedAt: handle.lastValidatedAt?.toISOString() ?? null,
    };
  }
}
