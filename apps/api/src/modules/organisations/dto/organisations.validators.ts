import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FIELD_LIMITS } from '@social-bounty/shared';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(FIELD_LIMITS.ORG_NAME_MAX)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;
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
}

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
