import { expect, test } from '@playwright/test';
import {
  apiBase,
  refreshCookieFrom,
  seedRefreshCookie,
} from './auth-helpers';

async function registerVerifiedUser(email: string, password: string) {
  const regRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Onboarding UAT' }),
  });
  const reg = await regRes.json();

  let token = reg.accessToken as string | undefined;
  let refreshCookie = refreshCookieFrom(regRes);
  if (reg.requiresVerification) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    await prisma.$disconnect();
    const loginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const login = await loginRes.json();
    token = login.accessToken;
    refreshCookie = refreshCookieFrom(loginRes);
  }

  if (!token) {
    throw new Error(`Onboarding E2E: no access token (${JSON.stringify(reg)})`);
  }
  return { token, refreshCookie };
}

test.describe('First login', () => {
  test.setTimeout(120_000);

  test('new user lands in the garden without an onboarding wizard', async ({ page }) => {
    const email = `uat-first-login-${Date.now()}@plantcare.test`;
    const password = 'password123';
    const { refreshCookie } = await registerVerifiedUser(email, password);

    await seedRefreshCookie(page, refreshCookie);
    await page.goto('/garden');

    await expect(page).not.toHaveURL(/\/garden\/onboarding/);
    await expect(page.getByRole('heading', { name: /Hi,/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Add your first plant/i })).toBeVisible();
  });
});
