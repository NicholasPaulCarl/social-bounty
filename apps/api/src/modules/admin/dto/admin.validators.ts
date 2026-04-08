import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  UserStatus,
  OrgStatus,
  BountyStatus,
  SubmissionStatus,
  FIELD_LIMITS,
} from '@social-bounty/shared';

export class AdminUpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.ADMIN_REASON_MAX)
  reason!: string;
}

export class AdminCreateOrgDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.ORG_NAME_MAX)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  logo?: string | null;

  @IsUUID()
  @IsNotEmpty()
  ownerUserId!: string;
}

export class AdminUpdateOrgStatusDto {
  @IsEnum(OrgStatus)
  status!: OrgStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.ADMIN_REASON_MAX)
  reason!: string;
}

export class AdminOverrideBountyDto {
  @IsEnum(BountyStatus)
  status!: BountyStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.REASON_MAX)
  reason!: string;
}

export class AdminOverrideSubmissionDto {
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.REASON_MAX)
  reason!: string;
}

export class AdminUpdateSettingsDto {
  @IsOptional()
  signupsEnabled?: boolean;

  @IsOptional()
  submissionsEnabled?: boolean;
}
