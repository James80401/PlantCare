import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const apiBase = process.env.API_URL || 'http://localhost:3001/api/v1';
const authFile = resolve(__dirname, '.uat-auth.json');
const isStaging = process.env.STAGING_E2E === '1';

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
  }

  if (!token) {
    throw new Error(`E2E setup: could not obtain access token (${JSON.stringify(reg)})`);
  }

  const onboardingRes = await fetch(`${apiBase}/users/me/onboarding`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skip: true }),
  });
  if (!onboardingRes.ok) {
    throw new Error(`E2E setup: onboarding failed (${onboardingRes.status})`);
  }

  const speciesRes = await fetch(`${apiBase}/species/search?q=monstera`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const species = await speciesRes.json();
  const speciesId = species?.[0]?.id;

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
      refreshToken: reg.refreshToken,
      plantId,
      userId,
    }),
  );
}

export default main;
