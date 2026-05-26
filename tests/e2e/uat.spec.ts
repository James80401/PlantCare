import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect, test } from '@playwright/test';

const authFile = resolve(__dirname, '.uat-auth.json');

function loadAuth() {
  return JSON.parse(readFileSync(authFile, 'utf8')) as {
    accessToken: string;
    refreshToken?: string;
    email?: string;
    plantId?: string;
  };
}

async function seedAuth(page: import('@playwright/test').Page) {
  const { accessToken, refreshToken } = loadAuth();
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },
    { accessToken, refreshToken: refreshToken ?? '' },
  );
}

async function openAddPlantSearch(page: import('@playwright/test').Page) {
  await page.goto('/garden/plants/new');
  await page.getByRole('button', { name: /Search by name instead/i }).click();
}

async function expectNoHorizontalScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 2;
  });
  expect(overflow).toBe(false);
}

test.describe('UAT checklist — authenticated flows', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('household and community pages load', async ({ page }) => {
    await page.goto('/garden/household');
    await expect(page.getByRole('heading', { name: 'Household', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create$/i })).toBeVisible();
    await page.goto('/garden/community');
    await expect(page.getByRole('heading', { name: /Plant tips & wins/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Share with community/i })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('community post can be liked and commented', async ({ page }) => {
    const note = `E2E community tip ${Date.now()}`;
    await page.goto('/garden/community');
    await page.getByPlaceholder(/What worked in your care routine/i).fill(note);
    await page.getByRole('button', { name: /Share with community/i }).click();
    await expect(page.getByText(note)).toBeVisible({ timeout: 10_000 });

    const card = page.locator('li').filter({ hasText: note });
    await card.getByRole('button', { name: /Like \(\d+\)/i }).click();
    await expect(card.getByRole('button', { name: /♥ Liked/i })).toBeVisible();

    await card.getByRole('button', { name: /View comments/i }).click();
    await card.getByPlaceholder(/Add a comment/i).fill('E2E comment');
    await card.getByRole('button', { name: /^Reply$/i }).click();
    await expect(card.getByText('E2E comment')).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalScroll(page);
  });

  test('calendar page loads week and month views', async ({ page }) => {
    await page.goto('/garden/calendar');
    await expect(page.getByRole('heading', { name: /Care calendar/i })).toBeVisible();
    await page.getByRole('button', { name: /^Month$/i }).click();
    await expect(page.getByText(/Sun/i).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('dashboard loads with metrics and navigation', async ({ page }) => {
    await page.goto('/garden');
    await expect(page.getByRole('heading', { name: /Hi,/i })).toBeVisible();
    await expect(page.getByText('Garden score')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Weather advice/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse/i }).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('Dr. Plant chat is reachable from plant health tab', async ({ page }) => {
    const auth = loadAuth();
    let plantId = auth.plantId;
    if (!plantId) {
      await openAddPlantSearch(page);
      await page.getByLabel(/Species name/i).fill('pothos');
      await page.getByRole('button', { name: /Pothos/i }).first().click();
      await page.getByRole('button', { name: /Save plant/i }).click();
      await page.waitForURL(/\/garden\/plants\/[^/]+/);
      plantId = page.url().match(/\/garden\/plants\/([^/]+)/)?.[1]!;
    }
    await page.goto(`/garden/plants/${plantId}/health#dr-plant`);
    await expect(page.getByRole('heading', { name: /^Dr\. Plant$/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('#dr-plant')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Send$/i })).toBeEnabled();
    await expectNoHorizontalScroll(page);
  });

  test('plant buddy home and activities load', async ({ page }) => {
    await page.goto('/garden/buddy');
    await expect(page.getByRole('heading', { name: 'UAT Buddy' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Plant Buddy/i).first()).toBeVisible();
    await page.goto('/garden/buddy/activities');
    await expect(page.getByRole('heading', { name: 'Activities' })).toBeVisible();
    await expect(page.getByText(/Watering check/i)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('browse plants catalog is paged', async ({ page }) => {
    await page.goto('/garden/plants/browse');
    await expect(page.getByRole('heading', { name: /Browse plants/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recommended for you/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Add$/i }).first()).toBeVisible();
    await expect(page.getByText(/Showing \d+/)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('browse plants filters, sort, and species detail', async ({ page }) => {
    await page.goto('/garden/plants/browse');
    await page.getByRole('button', { name: /Beginner-friendly/i }).click();
    await page.getByLabel(/Sort by/i).selectOption('waterAsc');
    await expect(page).toHaveURL(/beginnerFriendly=true/);
    await expect(page).toHaveURL(/sort=waterAsc/);
    await expect(page.getByText(/Beginner/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Details$/i }).first()).toBeVisible();

    await page.goto('/garden/plants/browse/seed-snake-plant-sansevieria-trifasciata');
    await expect(page.getByRole('heading', { name: /Snake Plant/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Growing profile/i })).toBeVisible();
    await expect(page.getByText(/Common pests/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to my garden/i })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('add plant search finds Magic Carpet Thyme', async ({ page }) => {
    await openAddPlantSearch(page);
    await page.getByLabel(/Species name/i).fill('magic carpet thyme');
    await expect(page.getByText(/Magic Carpet Thyme/i).first()).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalScroll(page);
  });

  test('tasks page shows grouped care types after adding a plant', async ({ page }) => {
    await openAddPlantSearch(page);
    await page.getByLabel(/Species name/i).fill('monstera');
    await page.getByRole('button', { name: /Monstera/i }).first().click();
    await page.getByRole('button', { name: /Save plant/i }).click();
    await page.waitForURL(/\/garden\/plants\//);

    await page.goto('/garden/tasks');
    await expect(page.getByRole('heading', { name: /Care tasks/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Water|Fertilize|Mist|Check/i);
    await expectNoHorizontalScroll(page);
  });

  test('plant profile diagnosis can schedule a follow-up task', async ({ page }) => {
    await openAddPlantSearch(page);
    await page.getByLabel(/Species name/i).fill('snake');
    await page.getByRole('button', { name: /Snake Plant/i }).first().click();
    await page.getByRole('button', { name: /Save plant/i }).click();
    await page.waitForURL((url) => {
      const match = url.pathname.match(/^\/garden\/plants\/([^/]+)/);
      const id = match?.[1];
      return Boolean(id && id !== 'new' && id !== 'browse');
    });
    const plantId = page.url().match(/\/garden\/plants\/([^/]+)/)?.[1]!;
    await page.goto(`/garden/plants/${plantId}/health`);
    await expect(page.getByRole('heading', { name: /^Dr\. Plant$/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByText(/One-shot diagnosis/i).click();
    await expect(page.getByRole('button', { name: /Run diagnosis/i })).toBeVisible();
    await page.getByLabel(/What are you seeing/i).fill('Yellow leaves and wet soil');
    await page.getByRole('button', { name: /Run diagnosis/i }).click();
    await expect(page.getByText(/Treatment plan/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Remind in 3 days/i }).click();
    await page.goto('/garden/tasks');
    await expect(page.getByText(/Health check/i).first()).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalScroll(page);
  });

  test('plant profile has care sections and journal', async ({ page }) => {
    await openAddPlantSearch(page);
    await page.getByLabel(/Species name/i).fill('snake');
    await page.getByRole('button', { name: /Snake Plant/i }).first().click();
    await page.getByRole('button', { name: /Save plant/i }).click();
    await page.waitForURL((url) => {
      const match = url.pathname.match(/^\/garden\/plants\/([^/]+)/);
      const id = match?.[1];
      return Boolean(id && id !== 'new' && id !== 'browse');
    });
    const plantId = page.url().match(/\/garden\/plants\/([^/]+)/)?.[1]!;

    await page.goto(`/garden/plants/${plantId}/overview`);
    await expect(page.getByRole('link', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Care', exact: true })).toBeVisible();
    await page.goto(`/garden/plants/${plantId}/journal`);
    await page
      .getByPlaceholder(/Add a note about growth/i)
      .fill('E2E journal note');
    await page.getByRole('button', { name: /Save journal entry/i }).click();
    await expect(page.getByText(/E2E journal note/i)).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalScroll(page);
  });

  test('dashboard highlights overdue tasks', async ({ page }) => {
    const auth = loadAuth();
    if (!auth.plantId || !auth.email) {
      test.skip();
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { email: auth.email } });
    const overdue = new Date();
    overdue.setDate(overdue.getDate() - 3);
    if (user) {
      await prisma.task.updateMany({
        where: { plant: { userId: user.id }, status: 'PENDING' },
        data: { dueDate: overdue },
      });
    }
    await prisma.$disconnect();

    await page.goto('/garden');
    const overdueCard = page.locator('.text-rose-50, .text-rose-900').filter({ hasText: /overdue/i });
    await expect(page.getByText('Overdue', { exact: true })).toBeVisible();
    await expect(overdueCard.first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('dashboard all-caught-up shows useful next action', async ({ page }) => {
    const auth = loadAuth();
    if (!auth.email) {
      test.skip();
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { email: auth.email } });
    const future = new Date();
    future.setDate(future.getDate() + 30);
    if (user) {
      await prisma.task.updateMany({
        where: { plant: { userId: user.id }, status: 'PENDING' },
        data: { dueDate: future },
      });
    }
    await prisma.$disconnect();

    await page.goto('/garden');
    await expect(page.getByRole('heading', { name: /Log a quick observation/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Nothing due right now')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('task instructions modal opens from tasks', async ({ page }) => {
    await page.goto('/garden/tasks');
    const howTo = page.getByRole('button', { name: /Care steps/i }).first();
    if (await howTo.isVisible().catch(() => false)) {
      await howTo.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('[role="dialog"]')).toContainText(/Water|Light|Step/i);
    }
  });

  test('schedule explanation modal opens from tasks', async ({ page }) => {
    await page.goto('/garden/tasks');
    const why = page.getByRole('button', { name: /Why this date/i }).first();
    await expect(why).toBeVisible();
    await why.click();
    await expect(page.getByRole('dialog', { name: /Why this date/i })).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText(/What shaped this date/i);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('UAT checklist — public auth', () => {
  test('password reset page accepts token from email flow', async ({ page }) => {
    const email = `uat-reset-${Date.now()}@plantcare.test`;
    const password = 'password123';
    const reg = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Reset UAT' }),
    }).then((r) => r.json());

    if (reg.requiresVerification) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
      await prisma.$disconnect();
    }

    const forgot = await fetch('http://localhost:3001/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (forgot.status === 503) {
      test.skip(true, 'SMTP not configured');
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const row = await prisma.user.findUnique({
      where: { email },
      select: { passwordResetToken: true },
    });
    await prisma.$disconnect();
    if (!row?.passwordResetToken) {
      throw new Error('Expected password reset token after forgot-password');
    }

    await page.goto(`/reset-password/${row.passwordResetToken}`);
    await page.getByPlaceholder(/New password/i).fill('newpass456');
    await page.getByPlaceholder(/Confirm password/i).fill('newpass456');
    await page.getByRole('button', { name: /Update password/i }).click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    await page.goto('/login');
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Password$/i).fill('newpass456');
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/garden/, { timeout: 15_000 });
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (token) {
      await fetch('http://localhost:3001/api/v1/users/me/onboarding', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skip: true }),
      });
      await page.goto('/garden');
    }
    await expect(page.getByRole('heading', { name: /Hi,/i })).toBeVisible({ timeout: 15_000 });
  });

  test('landing page links to register and login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Sign in|Log in/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Register|Get started/i }).first()).toBeVisible();
  });

  test('register form submits to garden or verification message', async ({ page }) => {
    const email = `uat-ui-${Date.now()}@plantcare.test`;
    await page.goto('/register');
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Password$/i).fill('password123');
    await page.getByLabel(/Name/i).fill('UAT Browser');
    await page.getByRole('button', { name: /Create account/i }).click();
    const verified = page.getByText(/check your email|verify/i);
    const onboarding = page.getByRole('button', { name: /Get started/i });
    const garden = page.getByRole('heading', { name: /Hi,/i });
    await expect(verified.or(onboarding).or(garden)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('UAT checklist — mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('empty garden state and bottom nav padding', async ({ page }) => {
    const email = `uat-empty-${Date.now()}@plantcare.test`;
    const reg = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Empty Garden' }),
    }).then((r) => r.json());

    let token = reg.accessToken;
    if (reg.requiresVerification) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
      await prisma.$disconnect();
      const login = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      }).then((r) => r.json());
      token = login.accessToken;
    }

    await fetch('http://localhost:3001/api/v1/users/me/onboarding', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skip: true }),
    });

    await page.addInitScript((t) => localStorage.setItem('accessToken', t), token);
    await page.goto('/garden');
    await expect(
      page.getByText(/Build your first care plan|Add your first plant/i).first(),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);

    const contentPad = await page.locator('.page-garden').first().evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.paddingBottom || '0');
    });
    expect(contentPad).toBeGreaterThanOrEqual(48);
  });

  test('bottom nav has comfortable tap targets', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/garden');
    const browse = page.getByRole('link', { name: 'Browse' });
    const box = await browse.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('mobile bottom nav includes community', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/garden');
    await page.getByRole('link', { name: 'Tips' }).click();
    await expect(page.getByRole('heading', { name: /Plant tips & wins/i })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe('Demo seed account', () => {
  test('demo login opens garden with sample plants', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/^Email$/i).fill('demo@plantcare.local');
    await page.getByLabel(/^Password$/i).fill('DemoPlant1!');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/garden/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Hi,/i })).toBeVisible();
    await expect(page.getByText(/Window Snake|Shelf Pothos/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expectNoHorizontalScroll(page);
  });
});
