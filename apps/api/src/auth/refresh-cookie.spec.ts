import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  assertCookieAuthOrigin,
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie';

describe('refresh cookie', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sets an HttpOnly cross-site-capable production cookie with a narrow path', () => {
    const response = { cookie: jest.fn() } as unknown as Response;
    const config = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'production' : undefined)),
    } as unknown as ConfigService;

    setRefreshCookie(response, config, 'refresh.jwt', 60_000);

    expect(response.cookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, 'refresh.jwt', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: REFRESH_COOKIE_PATH,
      maxAge: 60_000,
    });
  });

  it('clears the cookie using matching development attributes', () => {
    const response = { clearCookie: jest.fn() } as unknown as Response;
    const config = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'development' : undefined)),
    } as unknown as ConfigService;

    clearRefreshCookie(response, config);

    expect(response.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
    });
  });

  it('reads only the named cookie and safely decodes its value', () => {
    const request = {
      headers: { cookie: 'theme=green; drplant_refresh=jwt%2Evalue; another=1' },
    } as Request;

    expect(readRefreshCookie(request)).toBe('jwt.value');
  });

  it('rejects unapproved browser origins and accepts configured/native origins', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://drplant.app',
      CORS_ORIGINS: 'https://drplant.app',
    };

    expect(() =>
      assertCookieAuthOrigin({
        headers: { origin: 'https://attacker.example' },
      } as Request),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertCookieAuthOrigin({
        headers: { origin: 'https://drplant.app' },
      } as Request),
    ).not.toThrow();
    expect(() =>
      assertCookieAuthOrigin({
        headers: { origin: 'capacitor://localhost' },
      } as Request),
    ).not.toThrow();
  });
});
