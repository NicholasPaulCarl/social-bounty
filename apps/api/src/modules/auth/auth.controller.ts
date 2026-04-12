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
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
} from './dto/auth.validators';

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

  @Post('request-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtpAndLogin(dto.email, dto.otp);
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('signup')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(
    @Body() dto: SignupWithOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!(await this.settingsService.isSignupEnabled())) {
      throw new BadRequestException('Signups are currently disabled');
    }
    const result = await this.authService.signupWithOtp(
      dto.email,
      dto.otp,
      dto.firstName,
      dto.lastName,
      dto.interests,
      dto.registerAsBrand,
      dto.brandName,
      dto.brandContactEmail,
    );
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
