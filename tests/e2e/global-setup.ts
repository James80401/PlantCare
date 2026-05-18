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

  writeFileSync(
    authFile,
    JSON.stringify({ email, password, accessToken: token, refreshToken: reg.refreshToken }),
  );
}

export default main;
