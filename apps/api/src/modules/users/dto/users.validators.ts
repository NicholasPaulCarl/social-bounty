import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  FIELD_LIMITS,
  PASSWORD_RULES,
  PROFILE_LIMITS,
  SocialChannel,
} from '@social-bounty/shared';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.FIRST_NAME_MAX)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.LAST_NAME_MAX)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_LIMITS.BIO_MAX)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(PASSWORD_RULES.MIN_LENGTH)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  newPassword!: string;
}

export class UpsertSocialLinkDto {
  @IsEnum(SocialChannel)
  platform!: SocialChannel;

  @IsString()
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_LIMITS.HANDLE_MAX)
  handle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  followerCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  postCount?: number;
}
