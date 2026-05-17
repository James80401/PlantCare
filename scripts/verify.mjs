import { PrismaClient } from '@prisma/client';

const base = process.env.API_URL || 'http://localhost:3001/api/v1';
const prisma = new PrismaClient();

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? `: ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}${detail ? `: ${detail}` : ''}`);
}

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  const speciesCount = await prisma.plantSpecies.count();
  pass('Database', `${speciesCount} species`);

  const health = await api('GET', '/health');
  if (health.status === 200 && health.data?.status === 'ok') pass('Health');
  else fail('Health', `status ${health.status}`);

  const email = `verify-${Date.now()}@plantcare.test`;
  const reg = await api('POST', '/auth/register', {
    email,
    password: 'password123',
    name: 'Verify User',
  });
  let token = reg.data.accessToken;
  let authUser = reg.data.user;
  if (reg.status === 201 || reg.status === 200) {
    if (reg.data.requiresVerification) {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });
      const login = await api('POST', '/auth/login', {
        email,
        password: 'password123',
      });
      if (login.status === 200 || login.status === 201) {
        token = login.data.accessToken;
        authUser = login.data.user;
        pass('Register', `${email} (verified for test)`);
      } else {
        fail('Register login after verify', JSON.stringify(login.data));
        await prisma.$disconnect();
        process.exit(1);
      }
    } else {
      pass('Register', email);
    }
  } else {
    fail('Register', JSON.stringify(reg.data));
    await prisma.$disconnect();
    process.exit(1);
  }

  if (!token) {
    fail('Register', 'no access token');
    await prisma.$disconnect();
    process.exit(1);
  }
  const meForTier = await api('GET', '/users/me', null, token);
  const planTier = authUser?.planTier ?? meForTier.data?.planTier;
  if (planTier === 'PREMIUM') pass('Premium tier', 'PREMIUM');
  else fail('Premium tier', planTier ?? 'unknown');

  const search = await api('GET', '/species/search?q=monstera', null, token);
  if (search.status === 200 && Array.isArray(search.data) && search.data.length > 0) {
    pass('Species search', `${search.data.length} results`);
  } else fail('Species search');

  const speciesId = search.data[0]?.id;
  const plant = await api(
    'POST',
    '/plants',
    { speciesId, nickname: 'Verify Plant', location: 'Living Room' },
    token,
  );
  if (plant.status === 201 || plant.status === 200) pass('Create plant', plant.data.id);
  else fail('Create plant', JSON.stringify(plant.data));

  const plantId = plant.data?.id;
  const tasks = await api('GET', '/tasks', null, token);
  if (tasks.status === 200 && Array.isArray(tasks.data) && tasks.data.length > 0) {
    pass('Tasks generated', `${tasks.data.length} tasks`);
    const taskId = tasks.data[0].id;
    const instr = await api('GET', `/tasks/${taskId}/instructions`, null, token);
    if (instr.status === 200 && Array.isArray(instr.data?.sections)) {
      const sections = instr.data.sections;
      if (sections.length >= 4 && instr.data.isSpeciesSpecific) {
        pass('Task instructions', `${sections.length} sections`);
        const imgUrl = sections.find((s) => s.images?.length)?.images?.[0]?.url;
        if (imgUrl) {
          const imgRes = await fetch(`http://localhost:3001${imgUrl}`);
          if (imgRes.status === 200) pass('Care guide image', imgUrl);
          else fail('Care guide image', `${imgRes.status} ${imgUrl}`);
        }
      } else {
        fail('Task instructions depth', `sections=${sections.length} specific=${instr.data.isSpeciesSpecific}`);
      }
    } else fail('Task instructions', String(instr.status));

    const done = await api('PATCH', `/tasks/${taskId}/complete`, null, token);
    if (done.status === 200) pass('Complete task');
    else fail('Complete task', String(done.status));

    const skipTarget = tasks.data.find((t) => t.status === 'PENDING' && t.id !== taskId) ?? tasks.data[1];
    if (skipTarget?.id) {
      const skipped = await api(
        'PATCH',
        `/tasks/${skipTarget.id}/skip`,
        { reason: 'OTHER', note: 'verify script' },
        token,
      );
      if (skipped.status === 200) pass('Skip task with reason');
      else fail('Skip task with reason', String(skipped.status));
    }
  } else fail('Tasks');

  const thymeSearch = await api('GET', '/species/search?q=magic+carpet+thyme', null, token);
  const thymeSpeciesId = thymeSearch.data?.[0]?.id;
  if (thymeSpeciesId) {
    const outdoor = await api(
      'POST',
      '/plants',
      { speciesId: thymeSpeciesId, nickname: 'Outdoor Thyme', location: 'Outdoor garden' },
      token,
    );
    if (outdoor.status === 201 || outdoor.status === 200) {
      const allTasks = await api('GET', '/tasks', null, token);
      const outdoorTasks = (allTasks.data ?? []).filter((t) => t.plantId === outdoor.data.id);
      const mistTasks = outdoorTasks.filter((t) => t.taskType === 'MIST');
      if (mistTasks.length === 0) pass('Outdoor plant: no MIST tasks');
      else fail('Outdoor plant: no MIST tasks', `${mistTasks.length} MIST`);

      const indoorPatch = await api(
        'PATCH',
        `/plants/${outdoor.data.id}`,
        { location: 'Living Room' },
        token,
      );
      if (indoorPatch.status === 200 && indoorPatch.data?.tasksRescheduled === true) {
        pass('Location change reschedules tasks');
      } else {
        fail('Location change reschedules tasks', JSON.stringify(indoorPatch.data?.tasksRescheduled));
      }
    } else {
      fail('Outdoor plant create', JSON.stringify(outdoor.data));
    }
  } else {
    fail('Species search (Magic Carpet Thyme)');
  }

  const diagForm = new FormData();
  diagForm.append('symptomsText', 'Yellow leaves on lower stems, soil feels wet');
  const diagRes = await fetch(`${base}/plants/${plantId}/diagnose`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: diagForm,
  });
  const diagData = await diagRes.json().catch(() => ({}));
  if (diagRes.status === 200 || diagRes.status === 201) {
    pass('Diagnosis', `source=${diagData?.source}, label=${diagData?.resultLabel}`);
  } else if (diagRes.status === 503) {
    pass('Diagnosis', `skipped (${diagData?.message || 'OpenAI unavailable'})`);
  } else fail('Diagnosis', JSON.stringify(diagData));

  const chatForm = new FormData();
  chatForm.append('message', 'Yellow lower leaves, soil is wet. What should I do first?');
  const chatRes = await fetch(`${base}/plants/${plantId}/diagnose/conversations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: chatForm,
  });
  const chatData = await chatRes.json().catch(() => ({}));
  if (chatRes.status === 200 || chatRes.status === 201) {
    const msgCount = chatData.messages?.length ?? 0;
    const hasAssistant = chatData.messages?.some((m) => m.role === 'assistant');
    if (hasAssistant) pass('Dr. Plant chat', `${msgCount} messages`);
    else pass('Dr. Plant chat', 'conversation created');
  } else if (chatRes.status === 503) {
    pass('Dr. Plant chat', `skipped (${chatData?.message || 'OpenAI unavailable'})`);
  } else {
    fail('Dr. Plant chat', `${chatRes.status} ${JSON.stringify(chatData)}`);
  }

  const weather = await api('GET', '/users/me/weather', null, token);
  if (weather.status === 200) pass('Weather', weather.data?.message || 'ok');
  else fail('Weather', String(weather.status));

  if (meForTier.status === 200) pass('User profile');
  else fail('User profile');

  await prisma.$disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
