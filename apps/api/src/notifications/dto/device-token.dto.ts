import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterDeviceDto {
  @Transform(trimString)
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token!: string;

  @Transform(trimString)
  @IsIn(['android', 'ios', 'web'])
  platform!: 'android' | 'ios' | 'web';
}

export class UnregisterDeviceDto {
  @Transform(trimString)
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token!: string;
}
