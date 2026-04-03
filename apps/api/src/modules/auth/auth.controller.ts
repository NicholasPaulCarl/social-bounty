import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public, CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';
import {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.validators';
import { AuthenticatedUser } from './jwt.strategy';

const REFRESH_COOKIE_NAME = 'sb_refresh_token';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
  ) {}

  @Post('signup')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(@Body() dto: SignupDto) {
    if (!(await this.settingsService.isSignupEnabled())) {
      throw new BadRequestException('Signups are currently disabled');
    }
    return this.authService.signup(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.interests,
    );
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    setRefreshCookie(res, result.refreshToken);
    // Return everything except the refresh token (it's in the cookie now)
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    return { message: 'Logged out successfully.' };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.resendVerification(user.sub);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }
    const result = await this.authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    // Return only the access token and expiry (refresh token stays in cookie)
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }
}
