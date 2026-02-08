import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  UserStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  // In-memory store for refresh tokens and reset tokens (use Redis in production)
  private refreshTokens = new Map<string, { userId: string; jti: string }>();
  private resetTokens = new Map<string, { userId: string; expiresAt: Date }>();
  private verificationTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: false,
      },
    });

    // Send verification email
    const verificationToken = uuidv4();
    this.verificationTokens.set(verificationToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400_000), // 24 hours
    });

    this.mailService
      .sendEmailVerification(user.email, verificationToken)
      .catch((err) => {
        console.error('Failed to send verification email:', err);
      });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organisationMemberships: {
          select: { organisationId: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const organisationId =
      user.organisationMemberships.length > 0
        ? user.organisationMemberships[0].organisationId
        : null;

    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      organisationId,
      user.firstName,
      user.lastName,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        organisationId,
      },
    };
  }

  async logout(refreshToken: string) {
    // Invalidate the refresh token
    for (const [key, value] of this.refreshTokens.entries()) {
      if (key === refreshToken) {
        this.refreshTokens.delete(key);
        break;
      }
    }

    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (user) {
      const token = uuidv4();
      this.resetTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000), // 1 hour
      });

      await this.mailService.sendPasswordReset(user.email, token);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetEntry = this.resetTokens.get(token);

    if (!resetEntry || resetEntry.expiresAt < new Date()) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: resetEntry.userId },
      data: { passwordHash },
    });

    this.resetTokens.delete(token);

    const user = await this.prisma.user.findUnique({
      where: { id: resetEntry.userId },
    });

    if (user) {
      this.auditService.log({
        actorId: user.id,
        actorRole: user.role as UserRole,
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        entityType: ENTITY_TYPES.USER,
        entityId: user.id,
      });
    }

    return { message: 'Password has been reset successfully.' };
  }

  async verifyEmail(token: string) {
    const entry = this.verificationTokens.get(token);

    if (!entry || entry.expiresAt < new Date()) {
      this.verificationTokens.delete(token);
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: entry.userId },
      data: { emailVerified: true },
    });

    this.verificationTokens.delete(token);

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const token = uuidv4();
    this.verificationTokens.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400_000), // 24 hours
    });

    await this.mailService.sendEmailVerification(user.email, token);

    return { message: 'Verification email sent.' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const stored = this.refreshTokens.get(refreshToken);
      if (!stored) {
        // Potential token theft -- invalidate all tokens for user
        this.invalidateAllUserTokens(payload.sub);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Invalidate old refresh token
      this.refreshTokens.delete(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          organisationMemberships: {
            select: { organisationId: true },
            take: 1,
          },
        },
      });

      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const organisationId =
        user.organisationMemberships.length > 0
          ? user.organisationMemberships[0].organisationId
          : null;

      return this.generateTokens(
        user.id,
        user.email,
        user.role,
        organisationId,
        user.firstName,
        user.lastName,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(
    userId: string,
    email: string,
    role: string,
    organisationId: string | null,
    firstName?: string,
    lastName?: string,
  ) {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        organisationId,
        firstName: firstName || '',
        lastName: lastName || '',
        type: 'access',
      },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        type: 'refresh',
        jti,
      },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
      },
    );

    this.refreshTokens.set(refreshToken, { userId, jti });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Store a password reset token (used by AdminService for force resets)
   */
  storeResetToken(token: string, userId: string): void {
    this.resetTokens.set(token, {
      userId,
      expiresAt: new Date(Date.now() + 3600_000), // 1 hour
    });
  }

  private invalidateAllUserTokens(userId: string) {
    for (const [key, value] of this.refreshTokens.entries()) {
      if (value.userId === userId) {
        this.refreshTokens.delete(key);
      }
    }
  }
}
