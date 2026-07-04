import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResharePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  comment?: string;
}
