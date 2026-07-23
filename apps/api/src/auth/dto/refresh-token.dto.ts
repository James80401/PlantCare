import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Temporary compatibility field for clients released before refresh cookies.
 * New clients leave this body empty and use the HttpOnly cookie.
 */
export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  refreshToken?: string;
}
