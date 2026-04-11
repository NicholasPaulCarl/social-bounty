import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  @IsNotEmpty()
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
}

export class SwitchOrganisationDto {
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;
}

export class LogoutDto {
  // Refresh token now read from httpOnly cookie, body is empty
}

export class RefreshTokenDto {
  // Refresh token now read from httpOnly cookie, body is empty
}
