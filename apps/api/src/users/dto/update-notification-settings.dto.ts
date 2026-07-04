import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  notifyPush?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifySms?: boolean;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietHoursStart?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietHoursEnd?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationQuery?: string;

  @IsOptional()
  @IsIn(['C', 'F'])
  temperatureUnit?: 'C' | 'F';
}
