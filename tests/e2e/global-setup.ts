import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const apiBase = process.env.API_URL || 'http://localhost:3001/api/v1';
const authFile = resolve(__dirname, '.uat-auth.json');

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
    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
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
    throw new Error(`E2E setup: could not obtain access token (${JSON.stringify(reg)})`);
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

  const prisma = new PrismaClient();
  const userRow = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  await prisma.$disconnect();

  writeFileSync(
    authFile,
    JSON.stringify({
      email,
      password,
      accessToken: token,
      refreshToken: reg.refreshToken,
      plantId,
      userId: userRow?.id,
    }),
  );
}

export default main;
