import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  UserRole,
  PAGINATION_DEFAULTS,
  SocialChannel,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brandMemberships: {
          include: {
            brand: {
              select: { id: true, name: true },
            },
          },
          take: 1,
        },
        socialLinks: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const membership = user.brandMemberships[0] || null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      bio: user.bio ?? null,
      profilePictureUrl: user.profilePictureUrl ?? null,
      interests: Array.isArray(user.interests) ? user.interests as string[] : [],
      socialLinks: user.socialLinks.map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        handle: link.handle,
        followerCount: link.followerCount,
        postCount: link.postCount,
        isVerified: link.isVerified,
        verifiedAt: link.verifiedAt ? link.verifiedAt.toISOString() : null,
      })),
      organisation: membership
        ? {
            id: membership.brand.id,
            name: membership.brand.name,
            role: membership.role,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      interests?: string[];
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.bio !== undefined) updateData.bio = data.bio.trim();
    if (data.interests !== undefined) updateData.interests = data.interests;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      bio: user.bio ?? null,
      profilePictureUrl: user.profilePictureUrl ?? null,
      interests: Array.isArray(user.interests) ? user.interests as string[] : [],
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  // ─── Social Links ────────────────────────────────────────

  async getSocialLinks(userId: string) {
    const links = await this.prisma.socialLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return links.map((link) => ({
      id: link.id,
      platform: link.platform,
      url: link.url,
      handle: link.handle,
      followerCount: link.followerCount,
      postCount: link.postCount,
      isVerified: link.isVerified,
      verifiedAt: link.verifiedAt ? link.verifiedAt.toISOString() : null,
    }));
  }

  async upsertSocialLink(
    userId: string,
    dto: {
      platform: SocialChannel;
      url: string;
      handle?: string;
      followerCount?: number;
      postCount?: number;
    },
  ) {
    // Validate URL is accessible via HEAD request
    let isVerified = false;
    try {
      const response = await fetch(dto.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      isVerified = response.ok;
    } catch {
      isVerified = false;
    }

    const link = await this.prisma.socialLink.upsert({
      where: {
        userId_platform: {
          userId,
          platform: dto.platform,
        },
      },
      update: {
        url: dto.url,
        handle: dto.handle ?? null,
        followerCount: dto.followerCount ?? null,
        postCount: dto.postCount ?? null,
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
      create: {
        userId,
        platform: dto.platform,
        url: dto.url,
        handle: dto.handle ?? null,
        followerCount: dto.followerCount ?? null,
        postCount: dto.postCount ?? null,
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    return {
      id: link.id,
      platform: link.platform,
      url: link.url,
      handle: link.handle,
      followerCount: link.followerCount,
      postCount: link.postCount,
      isVerified: link.isVerified,
      verifiedAt: link.verifiedAt ? link.verifiedAt.toISOString() : null,
    };
  }

  async deleteSocialLink(userId: string, linkId: string) {
    const link = await this.prisma.socialLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Social link not found');
    }

    if (link.userId !== userId) {
      throw new ForbiddenException('You do not own this social link');
    }

    await this.prisma.socialLink.delete({
      where: { id: linkId },
    });

    return { message: 'Social link deleted successfully.' };
  }

  // ─── Public Hunter Profile ───────────────────────────────

  async getPublicProfile(hunterId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: hunterId,
        role: UserRole.PARTICIPANT,
      },
      include: {
        socialLinks: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Hunter not found');
    }

    const [totalSubmissions, approvedSubmissions] = await Promise.all([
      this.prisma.submission.count({
        where: { userId: user.id },
      }),
      this.prisma.submission.count({
        where: { userId: user.id, status: 'APPROVED' },
      }),
    ]);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio ?? null,
      profilePictureUrl: user.profilePictureUrl ?? null,
      interests: Array.isArray(user.interests) ? user.interests as string[] : [],
      socialLinks: user.socialLinks.map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        handle: link.handle,
        followerCount: link.followerCount,
        postCount: link.postCount,
        isVerified: link.isVerified,
        verifiedAt: link.verifiedAt ? link.verifiedAt.toISOString() : null,
      })),
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalSubmissions,
        approvedSubmissions,
        completedBounties: approvedSubmissions,
      },
    };
  }

  // ─── User Search (for messaging) ─────────────────────────

  async searchUsersForMessaging(query: string, limit?: number) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const take = Math.min(limit || 10, 20);
    const searchTerm = query.trim();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePictureUrl: true,
      },
      take,
      orderBy: { firstName: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      profilePictureUrl: u.profilePictureUrl,
    }));
  }

  // ─── Hunter Directory ────────────────────────────────────

  async listHunters(params: {
    page?: number;
    limit?: number;
    interest?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page) || PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(params.limit) || PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      role: UserRole.PARTICIPANT,
    };

    if (params.interest) {
      where.interests = {
        array_contains: [params.interest],
      };
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          socialLinks: {
            select: {
              platform: true,
              followerCount: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio ?? null,
      profilePictureUrl: user.profilePictureUrl ?? null,
      interests: Array.isArray(user.interests) ? user.interests as string[] : [],
      socialLinks: user.socialLinks.map((link) => ({
        platform: link.platform,
        followerCount: link.followerCount,
      })),
      createdAt: user.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Profile Picture ────────────────────────────────────

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const filePath = `/uploads/${file.filename}`;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: filePath },
    });

    return { profilePictureUrl: user.profilePictureUrl };
  }

  async deleteProfilePicture(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const oldUrl = user.profilePictureUrl;

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: null },
    });

    // Delete file from disk asynchronously; don't fail if missing
    if (oldUrl) {
      const filePath = path.resolve(process.cwd(), oldUrl.replace(/^\//, ''));
      fs.unlink(filePath, () => {
        // Intentionally ignore errors (file may already be gone)
      });
    }

    return { message: 'Profile picture removed.' };
  }
}
