import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEnum,
  Length,
  MinLength,
  ValidateIf,
  ValidateNested,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OtpChannel } from '@social-bounty/shared';
import { IsValidPhoneE164 } from '../../../common/validators/phone-number.validator';

export class MarketingConsentDto {
  @IsBoolean()
  email!: boolean;

  @IsBoolean()
  sms!: boolean;
}

export class RequestOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}

export class SwitchOtpChannelDto {
  @IsEmail()
  email!: string;
}

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class SignupWithOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsBoolean()
  registerAsBrand?: boolean;

  @ValidateIf((o) => o.registerAsBrand === true)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  brandName?: string;

  @ValidateIf((o) => o.registerAsBrand === true)
  @IsEmail()
  @IsNotEmpty()
  brandContactEmail?: string;

  @IsString()
  @IsValidPhoneE164({ region: 'ZA' })
  contactNumber!: string;

  // POPIA §69 + Brevo carrier requirement: explicit, channel-separated consent.
  // Object must be present; individual booleans may be false.
  @ValidateNested()
  @Type(() => MarketingConsentDto)
  marketingConsent!: MarketingConsentDto;

  // ToS / Privacy Policy acceptance — required.
  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms of Service and Privacy Policy to create an account.' })
  termsAccepted!: true;
}

export class SwitchBrandDto {
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;
}

export class RequestEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail!: string;
}

export class VerifyEmailChangeDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class LogoutDto {
  // Refresh token now read from httpOnly cookie, body is empty
}

export class RefreshTokenDto {
  // Refresh token now read from httpOnly cookie, body is empty
}
