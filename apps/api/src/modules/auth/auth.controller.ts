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
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';
import { AuthenticatedUser } from './jwt.strategy';
import {
  RequestOtpDto,
  VerifyOtpDto,
  SignupWithOtpDto,
  SwitchBrandDto,
  SwitchOtpChannelDto,
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
} from './dto/auth.validators';

const REFRESH_COOKIE_NAME = 'sb_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const LEGACY_REFRESH_COOKIE_PATHS = ['/', REFRESH_COOKIE_PATH] as const;

function refreshCookieOptions(path: (typeof LEGACY_REFRESH_COOKIE_PATHS)[number]) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path,
  };
}

function clearRefreshCookiePaths(res: Response) {
  for (const path of LEGACY_REFRESH_COOKIE_PATHS) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(path));
  }
}

function setRefreshCookie(res: Response, token: string) {
  // Keep the refresh token scoped to auth endpoints while clearing any
  // short-lived root-path variant that may have been set on preview deployments.
  clearRefreshCookiePaths(res);
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions(REFRESH_COOKIE_PATH),
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: Response) {
  clearRefreshCookiePaths(res);
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
  ) {}

  @Post('request-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.authService.requestOtp(
      { email: dto.email, phoneNumber: dto.phoneNumber },
      dto.channel,
      req.ip,
    );
  }

  @Post('switch-otp-channel')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async switchOtpChannel(@Body() dto: SwitchOtpChannelDto, @Req() req: Request) {
    return this.authService.switchOtpChannel(
      { email: dto.email, phoneNumber: dto.phoneNumber },
      req.ip,
    );
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtpAndLogin(
      { email: dto.email, phoneNumber: dto.phoneNumber },
      dto.otp,
      req.ip,
    );
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('signup')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(
    @Body() dto: SignupWithOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!(await this.settingsService.isSignupEnabled())) {
      throw new BadRequestException('Signups are currently disabled');
    }
    const result = await this.authService.signupWithOtp({
      email: dto.email,
      otp: dto.otp,
      firstName: dto.firstName,
      lastName: dto.lastName,
      contactNumber: dto.contactNumber,
      interests: dto.interests,
      registerAsBrand: dto.registerAsBrand,
      brandName: dto.brandName,
      brandContactEmail: dto.brandContactEmail,
      termsAccepted: dto.termsAccepted,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('switch-brand')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async switchBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchBrandDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchBrand(user.sub, dto.brandId);
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('request-email-change')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.authService.requestEmailChange(user.sub, dto.newEmail);
  }

  @Post('verify-email-change')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyEmailChangeDto,
  ) {
    return this.authService.verifyEmailChange(user.sub, dto.otp);
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
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }
}
