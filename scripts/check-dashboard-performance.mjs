import { performance } from 'node:perf_hooks';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const apiUrl = (process.env.API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
const databaseUrl = process.env.DATABASE_URL || '';
const allowed =
  process.env.NODE_ENV === 'test' ||
  process.env.DASHBOARD_FIXTURE_ALLOW_MUTATION === 'true';

if (!allowed) {
  throw new Error(
    'Dashboard fixtures mutate their target database. Run in NODE_ENV=test or set DASHBOARD_FIXTURE_ALLOW_MUTATION=true explicitly.',
  );
}

if (
  process.env.NODE_ENV === 'test' &&
  !/(@localhost[:/]|@127\.0\.0\.1[:/]|file:)/i.test(databaseUrl)
) {
  throw new Error('NODE_ENV=test dashboard fixtures require a local database target.');
}

const prisma = new PrismaClient();
const fixturePrefix = 'dashboard-performance-';
const fixtureSizes = [0, 10, 100];
const password = 'DashboardFixture1!';

async function replaceFixtures() {
  await prisma.user.deleteMany({
    where: { email: { startsWith: fixturePrefix, endsWith: '@example.test' } },
  });

  const species = await prisma.plantSpecies.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (!species) throw new Error('Seed the species catalog before dashboard performance fixtures.');

  const passwordHash = await bcrypt.hash(password, 10);
  for (const size of fixtureSizes) {
    const userId = `${fixturePrefix}user-${size}`;
    const gardenId = `${fixturePrefix}garden-${size}`;
    await prisma.user.create({
      data: {
        id: userId,
        email: `${fixturePrefix}${size}@example.test`,
        passwordHash,
        name: `Dashboard ${size}`,
        timezone: 'UTC',
        emailVerified: true,
        accountApprovalStatus: 'APPROVED',
      },
    });
    await prisma.garden.create({
      data: {
        id: gardenId,
        name: `${size}-plant fixture`,
        location: 'Indoor',
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
    });
    if (size > 0) {
      await prisma.plant.createMany({
        data: Array.from({ length: size }, (_, index) => ({
          id: `${fixturePrefix}plant-${size}-${index + 1}`,
          userId,
          gardenId,
          speciesId: species.id,
          nickname: `Fixture plant ${index + 1}`,
          location: index % 2 === 0 ? 'Living room' : 'Patio',
          imageUrl: `/uploads/fixture-${index + 1}.webp`,
        })),
      });
    }
  }
}

async function accessTokenFor(size) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `${fixturePrefix}${size}@example.test`,
      password,
    }),
  });
  if (!response.ok) {
    throw new Error(`Fixture login failed for ${size} plants: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json();
  if (!payload.accessToken) throw new Error(`Fixture login returned no access token for ${size} plants.`);
  return payload.accessToken;
}

async function fetchDashboard(accessToken) {
  const startedAt = performance.now();
  const response = await fetch(`${apiUrl}/dashboard`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const text = await response.text();
  const durationMs = performance.now() - startedAt;
  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status} ${text}`);
  }
  return {
    durationMs,
    responseBytes: Buffer.byteLength(text),
    payload: JSON.parse(text),
  };
}

function percentile95(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

try {
  await replaceFixtures();
  for (const size of fixtureSizes) {
    const accessToken = await accessTokenFor(size);
    const result = await fetchDashboard(accessToken);
    if (result.payload.metrics?.totalPlants !== size) {
      throw new Error(
        `${size}-plant fixture returned totalPlants=${result.payload.metrics?.totalPlants}`,
      );
    }
    console.log(
      `Dashboard fixture ${size}: ${result.responseBytes} bytes in ${result.durationMs.toFixed(1)} ms`,
    );
  }

  const accessToken = await accessTokenFor(100);
  await fetchDashboard(accessToken);
  const samples = [];
  let responseBytes = 0;
  for (let index = 0; index < 20; index += 1) {
    const result = await fetchDashboard(accessToken);
    samples.push(result.durationMs);
    responseBytes = result.responseBytes;
  }
  const p95Ms = percentile95(samples);
  console.log(
    `Dashboard 100-plant gate: ${responseBytes} bytes, p95 ${p95Ms.toFixed(1)} ms across ${samples.length} requests`,
  );
  if (responseBytes > 250 * 1024) {
    throw new Error(`Dashboard payload ${responseBytes} bytes exceeds the 250 KB gate.`);
  }
  if (p95Ms >= 750) {
    throw new Error(`Dashboard p95 ${p95Ms.toFixed(1)} ms exceeds the 750 ms gate.`);
  }
} finally {
  await prisma.user.deleteMany({
    where: { email: { startsWith: fixturePrefix, endsWith: '@example.test' } },
  });
  await prisma.$disconnect();
}
