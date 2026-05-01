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
  Equals,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { OtpChannel } from '@social-bounty/shared';
import { IsValidPhoneE164 } from '../../../common/validators/phone-number.validator';

@ValidatorConstraint({ name: 'exactlyOneIdentifier', async: false })
class ExactlyOneIdentifierConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const dto = args.object as { email?: string; phoneNumber?: string };
    const hasEmail = typeof dto.email === 'string' && dto.email.trim().length > 0;
    const hasPhoneNumber =
      typeof dto.phoneNumber === 'string' && dto.phoneNumber.trim().length > 0;

    return Number(hasEmail) + Number(hasPhoneNumber) === 1;
  }

  defaultMessage() {
    return 'Provide exactly one of email or phoneNumber';
  }
}

export class RequestOtpDto {
  @Validate(ExactlyOneIdentifierConstraint)
  private readonly _identifier!: never;

  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  @IsValidPhoneE164({ region: 'ZA' })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}

export class SwitchOtpChannelDto {
  @Validate(ExactlyOneIdentifierConstraint)
  private readonly _identifier!: never;

  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  @IsValidPhoneE164({ region: 'ZA' })
  phoneNumber?: string;
}

export class VerifyOtpDto {
  @Validate(ExactlyOneIdentifierConstraint)
  private readonly _identifier!: never;

  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  @IsValidPhoneE164({ region: 'ZA' })
  phoneNumber?: string;

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

  // ToS / Privacy Policy acceptance — required. SMS + email are classified
  // as service communications; no separate marketing consent is collected here.
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
