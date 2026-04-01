import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConversationContext, INBOX_CONSTANTS } from '@social-bounty/shared';

export class SendMessageDto {
  @IsString()
  @MaxLength(INBOX_CONSTANTS.MAX_MESSAGE_LENGTH)
  body!: string;
}

export class EditMessageDto {
  @IsString()
  @MaxLength(INBOX_CONSTANTS.MAX_MESSAGE_LENGTH)
  body!: string;
}

export class CreateConversationDto {
  @IsEnum(ConversationContext)
  context!: ConversationContext;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MaxLength(INBOX_CONSTANTS.MAX_MESSAGE_LENGTH)
  initialMessage!: string;
}
