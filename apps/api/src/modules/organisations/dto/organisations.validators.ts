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
import { BadRequestException } from '@nestjs/common';
import { FIELD_LIMITS, BRAND_PROFILE_LIMITS } from '@social-bounty/shared';

// Safely parse a JSON string that arrives as a multipart form field. Returns
// the value unchanged if it's not a string. Throws BadRequestException on
// malformed JSON instead of crashing the process.
function parseJsonField(fieldName: string) {
  return ({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(`Invalid JSON in ${fieldName}`);
    }
  };
}

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.BRAND_NAME_MAX)
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
  @Transform(parseJsonField('socialLinks'))
  @IsObject()
  socialLinks?: object;

  @IsOptional()
  @Transform(parseJsonField('targetInterests'))
  @IsArray()
  @IsString({ each: true })
  targetInterests?: string[];
}

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.BRAND_NAME_MAX)
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
  @Transform(parseJsonField('socialLinks'))
  @IsObject()
  socialLinks?: object;

  @IsOptional()
  @Transform(parseJsonField('targetInterests'))
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
