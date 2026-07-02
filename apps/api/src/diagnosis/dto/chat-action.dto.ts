import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ChatJournalActionDto {
  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class ChatHealthCheckActionDto extends ChatJournalActionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  dueInDays?: number = 3;
}

export class ChatRecoveryTasksDto extends ChatJournalActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keys!: string[];
}

export class ChatConfirmActionDraftDto extends ChatJournalActionDto {
  @IsString()
  @IsNotEmpty()
  draftKey!: string;
}
