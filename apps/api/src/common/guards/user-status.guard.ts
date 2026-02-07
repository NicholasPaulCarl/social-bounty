import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { UserStatus } from '@social-bounty/shared';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class UserStatusGuard implements CanActivate {
  private statusCache = new Map<string, { status: UserStatus; cachedAt: number }>();
  private readonly CACHE_TTL = 60_000; // 60 seconds

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let JwtAuthGuard handle this
    }

    const status = await this.getUserStatus(user.sub);

    if (status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    return true;
  }

  private async getUserStatus(userId: string): Promise<UserStatus> {
    const cached = this.statusCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.cachedAt < this.CACHE_TTL) {
      return cached.status;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    const status = (user?.status as UserStatus) ?? UserStatus.ACTIVE;
    this.statusCache.set(userId, { status, cachedAt: now });

    return status;
  }
}
