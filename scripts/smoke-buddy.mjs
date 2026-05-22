import { PrismaClient } from '@prisma/client';

const base = process.env.API_URL || 'http://localhost:3001/api/v1';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const email = `buddy-smoke-${Date.now()}@plantcare.test`;
const password = 'VerifyBuddy1!';

const reg = await api('POST', '/auth/register', { email, password, name: 'Buddy Smoke' });
if (reg.status >= 400) throw new Error(`register ${reg.status}`);

const prisma = new PrismaClient();
await prisma.user.update({ where: { email }, data: { emailVerified: true } });
await prisma.$disconnect();

const login = await api('POST', '/auth/login', { email, password });
if (!login.data.accessToken) throw new Error('login failed');
const token = login.data.accessToken;

const create = await api('POST', '/buddy', { name: 'Sprout', speciesId: 'monstera', trait: 'RESILIENT' }, token);
if (create.status >= 400) throw new Error(`create buddy ${create.status}`);

const get = await api('GET', '/buddy', null, token);
const acts = await api('GET', '/buddy/activities', null, token);
const greet = await api('GET', '/buddy/greeting', null, token);
const quests = await api('GET', '/buddy/quests', null, token);
const seasonal = await api('GET', '/buddy/seasonal', null, token);

const checks = [
  ['GET /buddy', get.status === 200 && get.data.name === 'Sprout'],
  ['GET /buddy/activities', acts.status === 200 && Array.isArray(acts.data) && acts.data.length === 10],
  ['GET /buddy/greeting', greet.status === 200 && greet.data.message],
  ['GET /buddy/quests', quests.status === 200 && quests.data.daily],
  ['GET /buddy/seasonal', seasonal.status === 200 && typeof seasonal.data.active === 'boolean'],
];

for (const [name, ok] of checks) {
  console.log(ok ? `✓ ${name}` : `✗ ${name}`);
  if (!ok) process.exit(1);
}
console.log('Buddy API smoke passed');
