import type { Page } from '@playwright/test';

export const apiBase = process.env.API_URL || 'http://localhost:3001/api/v1';
export const refreshCookieName = 'drplant_refresh';
export const refreshCookiePath = '/api/v1/auth';

export function refreshCookieFrom(response: Response): string {
  const setCookie = response.headers.get('set-cookie') ?? '';
  const encoded = setCookie
    .split(';', 1)[0]
    ?.split('=')
    .slice(1)
    .join('=')
    .trim();
  if (!encoded) {
    throw new Error('Auth response did not set the refresh cookie');
  }
  return decodeURIComponent(encoded);
}

export async function seedRefreshCookie(page: Page, value: string) {
  const apiUrl = new URL(apiBase);
  const secure = apiUrl.protocol === 'https:';
  await page.context().addCookies([
    {
      name: refreshCookieName,
      value,
      url: `${apiUrl.origin}${refreshCookiePath}`,
      httpOnly: true,
      secure,
      sameSite: secure ? 'None' : 'Lax',
    },
  ]);
}
