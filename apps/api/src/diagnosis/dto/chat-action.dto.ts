import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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
