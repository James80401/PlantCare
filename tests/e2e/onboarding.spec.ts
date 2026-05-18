import { expect, test } from '@playwright/test';

const apiBase = process.env.API_URL || 'http://localhost:3001/api/v1';

async function registerVerifiedUser(email: string, password: string) {
  const regRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Onboarding UAT' }),
  });
  const reg = await regRes.json();

  let token = reg.accessToken as string | undefined;
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
  }

  if (!token) {
    throw new Error(`Onboarding E2E: no access token (${JSON.stringify(reg)})`);
  }
  return token;
}

test.describe('Onboarding wizard', () => {
  test.setTimeout(120_000);

  test('new user completes onboarding and adds first plant from catalog', async ({ page }) => {
    const email = `uat-onboard-${Date.now()}@plantcare.test`;
    const password = 'password123';
    const token = await registerVerifiedUser(email, password);

    await page.addInitScript((t) => localStorage.setItem('accessToken', t), token);
    await page.goto('/garden');

    await expect(page).toHaveURL(/\/garden\/onboarding/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /set up your garden/i })).toBeVisible();

    await page.getByRole('button', { name: /Get started/i }).click();
    await expect(page.getByText(/How would you describe your plant care experience/i)).toBeVisible();
    await page.locator('button', { has: page.getByText('Beginner', { exact: true }) }).click();
    await page.getByRole('button', { name: /^Continue$/i }).click();
    await expect(page.getByText(/Where do most of your plants live/i)).toBeVisible();
    await page.locator('button', { has: page.getByText('Medium', { exact: true }) }).click();
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await expect(page.getByRole('heading', { name: /You.re ready/i })).toBeVisible();
    await page.getByRole('button', { name: /Add your first plant/i }).click();
    await expect(page).toHaveURL(/\/garden\/plants\/new/);

    await page.getByRole('button', { name: /Search by name instead/i }).click();
    await page.getByLabel(/Species name/i).fill('snake');
    await page.getByRole('button', { name: /Snake Plant/i }).first().click();
    await page.getByRole('button', { name: /Save plant/i }).click();
    await page.waitForURL((url) => {
      const match = url.pathname.match(/^\/garden\/plants\/([^/]+)/);
      const id = match?.[1];
      return Boolean(id && id !== 'new' && id !== 'browse');
    });

    await page.goto('/garden');
    await expect(page.getByRole('heading', { name: /Hi,/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Snake Plant|UAT|plant/i).first()).toBeVisible();
  });
});
