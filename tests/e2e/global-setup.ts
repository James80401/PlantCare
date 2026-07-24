import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { apiBase, refreshCookieFrom } from './auth-helpers';

const authFile = resolve(__dirname, '.uat-auth.json');
const isStaging = process.env.STAGING_E2E === '1';
const buddyEnabled = process.env.UAT_ENABLE_PLANT_BUDDY === '1';

function stagingPsql(query: string) {
  const docker = process.env.DOCKER_BIN || 'docker';
  const inner = `psql -U plantcare -d plantcare -t -A -c ${JSON.stringify(query)}`;
  return execSync(`${docker} exec plantcare-postgres-1 sh -c ${JSON.stringify(inner)}`, {
    encoding: 'utf8',
    shell: true,
  }).trim();
}

async function main() {
  const email = `uat-e2e-${Date.now()}@plantcare.test`;
  const password = 'password123';

  const regRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'UAT E2E' }),
  });
  const reg = await regRes.json();

  let token = reg.accessToken as string | undefined;
  let refreshCookie = refreshCookieFrom(regRes);

  if (reg.requiresVerification) {
    if (isStaging) {
      stagingPsql(
        `UPDATE "User" SET "emailVerified" = true WHERE email = '${email.replace(/'/g, "''")}';`,
      );
    } else {
      const prisma = new PrismaClient();
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });
      await prisma.$disconnect();
    }

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
    throw new Error(`E2E setup: could not obtain access token (${JSON.stringify(reg)})`);
  }

  const gardenRes = await fetch(`${apiBase}/gardens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'UAT Garden', location: 'Indoor' }),
  });
  if (!gardenRes.ok) {
    const errBody = await gardenRes.text();
    throw new Error(`E2E setup: garden create failed (${gardenRes.status}) ${errBody}`);
  }
  const garden = await gardenRes.json();
  const gardenId = garden?.id as string | undefined;

  const speciesRes = await fetch(`${apiBase}/species/search?q=monstera`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const species = await speciesRes.json();
  const speciesId = species?.[0]?.id;

  if (buddyEnabled) {
    const buddyRes = await fetch(`${apiBase}/buddy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'UAT Buddy',
        speciesId: 'monstera',
        trait: 'RESILIENT',
      }),
    });
    if (!buddyRes.ok && buddyRes.status !== 409) {
      const errBody = await buddyRes.text();
      throw new Error(`E2E setup: buddy create failed (${buddyRes.status}) ${errBody}`);
    }
  }

  let plantId: string | undefined;
  if (speciesId) {
    const plantRes = await fetch(`${apiBase}/plants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speciesId,
        gardenId,
        nickname: 'UAT E2E Plant',
        location: 'Living Room',
      }),
    });
    const plant = await plantRes.json();
    plantId = plant?.id;
  }

  let userId: string | undefined;
  if (isStaging) {
    const meRes = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    userId = me?.id;
  } else {
    const prisma = new PrismaClient();
    const userRow = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    userId = userRow?.id;
    await prisma.$disconnect();
  }

  writeFileSync(
    authFile,
    JSON.stringify({
      email,
      password,
      accessToken: token,
      refreshCookie,
      gardenId,
      plantId,
      userId,
    }),
  );
}

export default main;
