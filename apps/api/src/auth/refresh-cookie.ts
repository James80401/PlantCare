import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { getCorsOrigins } from '../cors-origins';

export const REFRESH_COOKIE_NAME = 'drplant_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

function cookieOptions(config: ConfigService, maxAge?: number) {
  const production = config.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? ('none' as const) : ('lax' as const),
    path: REFRESH_COOKIE_PATH,
    ...(maxAge == null ? {} : { maxAge }),
  };
}

export function setRefreshCookie(
  response: Response,
  config: ConfigService,
  refreshToken: string,
  maxAge: number,
) {
  response.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(config, maxAge));
}

export function clearRefreshCookie(response: Response, config: ConfigService) {
  response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(config));
}

export function readRefreshCookie(request: Request): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== REFRESH_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function assertCookieAuthOrigin(request: Request) {
  const origin = request.headers.origin;
  if (!origin) return;

  const normalized = origin.replace(/\/$/, '');
  const allowed = getCorsOrigins().some(
    (candidate) => candidate.replace(/\/$/, '') === normalized,
  );
  if (!allowed) {
    throw new ForbiddenException('Origin is not allowed for cookie authentication');
  }
}
