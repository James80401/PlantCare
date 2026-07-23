import { IsEmpty, IsOptional } from 'class-validator';

/** Cookie-only refresh/logout body. Explicitly rejects the removed legacy field. */
export class CookieAuthDto {
  @IsOptional()
  @IsEmpty({ message: 'refreshToken is supplied by the HttpOnly cookie' })
  refreshToken?: never;
}
