import { IsBoolean, IsOptional } from 'class-validator';

export class FetchWeatherAdviceDto {
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;
}
