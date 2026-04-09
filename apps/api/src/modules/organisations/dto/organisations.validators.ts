import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsUrl,
  IsObject,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FIELD_LIMITS, BRAND_PROFILE_LIMITS } from '@social-bounty/shared';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.ORG_NAME_MAX)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MinLength(BRAND_PROFILE_LIMITS.HANDLE_MIN)
  @MaxLength(BRAND_PROFILE_LIMITS.HANDLE_MAX)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Handle can only contain letters, numbers, underscores, and hyphens',
  })
  handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(BRAND_PROFILE_LIMITS.BIO_MAX)
  bio?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsObject()
  socialLinks?: object;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsArray()
  @IsString({ each: true })
  targetInterests?: string[];
}

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.ORG_NAME_MAX)
  name?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(BRAND_PROFILE_LIMITS.HANDLE_MIN)
  @MaxLength(BRAND_PROFILE_LIMITS.HANDLE_MAX)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Handle can only contain letters, numbers, underscores, and hyphens',
  })
  handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(BRAND_PROFILE_LIMITS.BIO_MAX)
  bio?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsObject()
  socialLinks?: object;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsArray()
  @IsString({ each: true })
  targetInterests?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value === 'true';
    return value;
  })
  @IsBoolean()
  messagingEnabled?: boolean;
}

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
