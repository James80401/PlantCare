import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const base = process.env.API_URL || 'http://localhost:3001/api/v1';
const isStaging = process.env.STAGING_E2E === '1';
const stagingDatabaseUrl =
  process.env.STAGING_DATABASE_URL ||
  'postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public';

function stagingPsql(query) {
  const docker = process.env.DOCKER_BIN || 'docker';
  const inner = `psql -U plantcare -d plantcare -t -A -c ${JSON.stringify(query)}`;
  return execSync(`${docker} exec plantcare-postgres-1 sh -c ${JSON.stringify(inner)}`, {
    encoding: 'utf8',
    shell: true,
  }).trim();
}

async function speciesCountCheck(prisma) {
  if (isStaging) {
    const count = Number.parseInt(stagingPsql('SELECT COUNT(*) FROM "PlantSpecies";'), 10);
    if (Number.isFinite(count)) return count;
    throw new Error('species count unavailable from staging Postgres');
  }
  return prisma.plantSpecies.count();
}

async function markEmailVerified(prisma, email) {
  if (isStaging) {
    stagingPsql(`UPDATE "User" SET "emailVerified" = true WHERE email = '${email.replace(/'/g, "''")}';`);
    return;
  }
  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
}

async function readPasswordResetToken(prisma, email) {
  if (isStaging) {
    return stagingPsql(
      `SELECT "passwordResetToken" FROM "User" WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1;`,
    );
  }
  const resetRow = await prisma.user.findUnique({
    where: { email },
    select: { passwordResetToken: true },
  });
  return resetRow?.passwordResetToken ?? '';
}

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
  const prisma = isStaging ? null : new PrismaClient();

  const speciesCount = await speciesCountCheck(prisma);
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
      await markEmailVerified(prisma, email);
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
        if (prisma) await prisma.$disconnect();
        process.exit(1);
      }
    } else {
      pass('Register', email);
    }
  } else {
    fail('Register', JSON.stringify(reg.data));
    if (prisma) await prisma.$disconnect();
    process.exit(1);
  }

  if (!token) {
    fail('Register', 'no access token');
    if (prisma) await prisma.$disconnect();
    process.exit(1);
  }
  const meForTier = await api('GET', '/users/me', null, token);
  const planTier = authUser?.planTier ?? meForTier.data?.planTier;
  if (planTier === 'PREMIUM') pass('Premium tier', 'PREMIUM');
  else fail('Premium tier', planTier ?? 'unknown');

  const forgot = await api('POST', '/auth/forgot-password', { email: 'nobody@plantcare.test' });
  if (forgot.status === 200 || forgot.status === 201) {
    pass('Forgot password', forgot.data?.message?.slice(0, 40) || 'ok');
  } else if (forgot.status === 503) {
    pass('Forgot password', 'skipped (SMTP off)');
  } else {
    fail('Forgot password', String(forgot.status));
  }

  const forgotSelf = await api('POST', '/auth/forgot-password', { email });
  if (forgotSelf.status === 503) {
    pass('Password reset E2E', 'skipped (SMTP off — inbox link manual)');
  } else if (forgotSelf.status === 200 || forgotSelf.status === 201) {
    const resetToken = await readPasswordResetToken(prisma, email);
    if (resetToken) {
      const reset = await api('POST', '/auth/reset-password', {
        token: resetToken,
        password: 'resetpass789',
      });
      if (reset.status === 200 || reset.status === 201) {
        pass('Reset password (token)', reset.data?.message?.slice(0, 40) || 'ok');
        const loginAfterReset = await api('POST', '/auth/login', {
          email,
          password: 'resetpass789',
        });
        if (loginAfterReset.status === 200 || loginAfterReset.status === 201) {
          token = loginAfterReset.data.accessToken;
          pass('Login after password reset');
        } else {
          fail('Login after password reset', JSON.stringify(loginAfterReset.data));
        }
      } else {
        fail('Reset password', JSON.stringify(reset.data));
      }
    } else {
      fail('Password reset E2E', 'forgot ok but no token in DB');
    }
  } else {
    fail('Forgot password (self)', String(forgotSelf.status));
  }

  const browse = await api('GET', '/species/browse?page=1&pageSize=24', null, token);
  if (
    browse.status === 200 &&
    Array.isArray(browse.data?.items) &&
    browse.data.items.length > 0 &&
    browse.data.total >= 300
  ) {
    pass('Browse plants', `page 1, ${browse.data.items.length} items, ${browse.data.total} total`);
  } else {
    fail('Browse plants', JSON.stringify(browse.data)?.slice(0, 120));
  }

  const beginnerBrowse = await api(
    'GET',
    '/species/browse?beginnerFriendly=true&pageSize=50',
    null,
    token,
  );
  const beginnerItems = beginnerBrowse.data?.items ?? [];
  if (
    beginnerBrowse.status === 200 &&
    beginnerItems.length > 0 &&
    beginnerItems.every((s) => s.difficulty === 'Beginner')
  ) {
    pass('Browse beginner filter', `${beginnerItems.length} beginner species`);
  } else {
    fail('Browse beginner filter', JSON.stringify(beginnerBrowse.data)?.slice(0, 120));
  }

  const speciesDetailId = browse.data?.items?.[0]?.id;
  if (speciesDetailId) {
    const detail = await api('GET', `/species/${speciesDetailId}`, null, token);
    if (
      detail.status === 200 &&
      detail.data?.difficulty &&
      detail.data?.discoveryTags?.length &&
      detail.data?.metadata?.pests?.length
    ) {
      pass('Species detail metadata', detail.data.commonName);
    } else {
      fail('Species detail metadata', JSON.stringify(detail.data)?.slice(0, 120));
    }
  }

  const recommended = await api('GET', '/species/recommended?limit=8', null, token);
  if (
    recommended.status === 200 &&
    Array.isArray(recommended.data?.items) &&
    recommended.data.items.length > 0 &&
    recommended.data.reason
  ) {
    pass('Species recommended', `${recommended.data.items.length} picks`);
  } else {
    fail('Species recommended', JSON.stringify(recommended.data)?.slice(0, 120));
  }

  const herbSearch = await api('GET', '/species/search?q=basil', null, token);
  if (herbSearch.status === 200 && herbSearch.data?.length > 0) {
    pass('Species search (herb)', herbSearch.data[0]?.commonName);
  } else fail('Species search (herb)');

  const search = await api('GET', '/species/search?q=monstera', null, token);
  if (search.status === 200 && Array.isArray(search.data) && search.data.length > 0) {
    pass('Species search (houseplant)', `${search.data.length} results`);
  } else fail('Species search (houseplant)');

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
  const dashboard = await api('GET', '/dashboard', null, token);
  if (
    dashboard.status === 200 &&
    dashboard.data?.greeting?.name &&
    dashboard.data?.metrics &&
    Array.isArray(dashboard.data.todayTasks)
  ) {
    pass('Dashboard aggregate', `${dashboard.data.metrics.totalPlants} plants`);
  } else {
    fail('Dashboard aggregate', JSON.stringify(dashboard.data)?.slice(0, 120));
  }

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

    const explain = await api('GET', `/tasks/${taskId}/explanation`, null, token);
    if (
      explain.status === 200 &&
      explain.data?.summary &&
      Array.isArray(explain.data?.factors) &&
      explain.data.factors.length > 0
    ) {
      pass('Task schedule explanation', `${explain.data.factors.length} factors`);
    } else {
      fail('Task schedule explanation', JSON.stringify(explain.data)?.slice(0, 120));
    }

    const to90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const tasks90 = await api('GET', `/tasks?to=${encodeURIComponent(to90)}`, null, token);
    const repotTask = (tasks90.data ?? tasks.data).find(
      (t) => t.taskType === 'REPOT' && t.plantId === plantId,
    );
    if (repotTask?.dueDate) {
      const daysUntil =
        (new Date(repotTask.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      if (daysUntil <= 90) {
        pass('Repot within 90 days', `due in ${Math.round(daysUntil)}d`);
      } else {
        fail('Repot within 90 days', `due in ${Math.round(daysUntil)}d`);
      }
    } else {
      fail('Repot within 90 days', 'no REPOT task generated');
    }

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

    const followUp = await api(
      'POST',
      `/plants/${plantId}/diagnose/${diagData.id}/follow-up-task`,
      { dueInDays: 3 },
      token,
    );
    if (followUp.status === 201 || followUp.status === 200) {
      if (followUp.data?.taskType === 'HEALTH_CHECK' && followUp.data?.sourceDiagnosisId === diagData.id) {
        pass('Diagnosis follow-up task', 'HEALTH_CHECK linked');
      } else {
        fail('Diagnosis follow-up task', JSON.stringify(followUp.data));
      }
    } else {
      fail('Diagnosis follow-up task', `${followUp.status} ${JSON.stringify(followUp.data)}`);
    }
  } else if (diagRes.status === 503) {
    pass('Diagnosis', `skipped (${diagData?.message || 'OpenAI unavailable'})`);
    pass('Diagnosis follow-up task', 'skipped (no diagnosis id)');
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

  const settings = await api(
    'PUT',
    '/users/me/notification-settings',
    { latitude: 40.44, longitude: -79.99, notifyEmail: false },
    token,
  );
  if (settings.status === 200) pass('Notification settings (location)');
  else fail('Notification settings', String(settings.status));

  const weatherStatus = await api('GET', '/users/me/weather/advice/status', null, token);
  if (weatherStatus.status === 200 && weatherStatus.data?.hasLocation) {
    pass('Weather advice status', 'location set');
  } else if (weatherStatus.status === 200) {
    pass('Weather advice status', 'no location (optional)');
  } else fail('Weather advice status', String(weatherStatus.status));

  const weatherAdvice = await api(
    'POST',
    '/users/me/weather/advice',
    { confirmed: true },
    token,
  );
  if (weatherAdvice.status === 201 || weatherAdvice.status === 200) {
    const plants = weatherAdvice.data?.plants?.length ?? 0;
    pass('Weather plant advice', `${plants} plant line(s)`);
    const cached = await api('POST', '/users/me/weather/advice', { confirmed: true }, token);
    if (
      (cached.status === 200 || cached.status === 201) &&
      cached.data?.fromCache === true
    ) {
      pass('Weather advice cache', 'same-day replay');
    } else {
      fail('Weather advice cache', JSON.stringify(cached.data));
    }
  } else if (weatherAdvice.status === 400 && !weatherStatus.data?.hasLocation) {
    pass('Weather plant advice', 'skipped (no location)');
  } else {
    fail('Weather plant advice', `${weatherAdvice.status} ${JSON.stringify(weatherAdvice.data)}`);
  }

  const suggestions = await api('GET', '/tasks/schedule-suggestions', null, token);
  if (suggestions.status === 200 && Array.isArray(suggestions.data)) {
    pass('Schedule suggestions', `${suggestions.data.length} suggestion(s)`);
  } else fail('Schedule suggestions', String(suggestions.status));

  const journalForm = new FormData();
  journalForm.append('notes', 'UAT verify: leaves look healthy.');
  const journalRes = await fetch(`${base}/plants/${plantId}/journal`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: journalForm,
  });
  const journalData = await journalRes.json().catch(() => ({}));
  if (journalRes.status === 201 || journalRes.status === 200) {
    pass('Journal entry', journalData?.id || 'created');
    const journalList = await api('GET', `/plants/${plantId}/journal`, null, token);
    if (journalList.status === 200 && Array.isArray(journalList.data) && journalList.data.length > 0) {
      pass('Journal list', `${journalList.data.length} entries`);
    } else fail('Journal list');

    const journalPatch = await api(
      'PATCH',
      `/plants/${plantId}/journal/${journalData.id}`,
      { notes: 'UAT verify: updated note', heightCm: 12 },
      token,
    );
    if (journalPatch.status === 200 && journalPatch.data?.notes?.includes('updated')) {
      pass('Journal update', 'notes saved');
    } else {
      fail('Journal update', `${journalPatch.status} ${JSON.stringify(journalPatch.data)}`);
    }

    const journalDelete = await api(
      'DELETE',
      `/plants/${plantId}/journal/${journalData.id}`,
      null,
      token,
    );
    if (journalDelete.status === 200 && journalDelete.data?.deleted) {
      pass('Journal delete', 'removed');
    } else {
      fail('Journal delete', `${journalDelete.status} ${JSON.stringify(journalDelete.data)}`);
    }
  } else fail('Journal entry', `${journalRes.status} ${JSON.stringify(journalData)}`);

  const plantsList = await api('GET', '/plants', null, token);
  if (plantsList.status === 200 && Array.isArray(plantsList.data) && plantsList.data.length > 0) {
    pass('Plants list (dashboard)', `${plantsList.data.length} plants`);
  } else fail('Plants list');

  const household = await api('POST', '/gardens', { name: 'Verify Household' }, token);
  if (household.status === 201 || household.status === 200) {
    pass('Create garden', household.data?.name || 'ok');
    const gardenId = household.data?.id;
    if (gardenId && plantId) {
      const share = await api(
        'POST',
        `/gardens/${gardenId}/plants`,
        { plantId, canComplete: true },
        token,
      );
      if (share.status === 201 || share.status === 200) {
        pass('Share plant to garden', plantId);
      } else {
        fail('Share plant to garden', JSON.stringify(share.data)?.slice(0, 120));
      }
      const activity = await api('GET', `/gardens/${gardenId}/activity`, null, token);
      if (activity.status === 200 && Array.isArray(activity.data)) {
        pass('Garden activity', `${activity.data.length} events`);
      } else {
        fail('Garden activity', JSON.stringify(activity.data)?.slice(0, 120));
      }
    }
  } else {
    fail('Create garden', JSON.stringify(household.data)?.slice(0, 120));
  }

  const gardensMine = await api('GET', '/gardens/mine', null, token);
  if (gardensMine.status === 200 && Array.isArray(gardensMine.data) && gardensMine.data.length > 0) {
    pass('Gardens mine', `${gardensMine.data.length} garden(s)`);
  } else {
    fail('Gardens mine', JSON.stringify(gardensMine.data)?.slice(0, 120));
  }

  const communityPost = await api(
    'POST',
    '/community/posts',
    { body: 'Verify community post — happy growing!' },
    token,
  );
  const postId = communityPost.data?.id;
  if (communityPost.status === 201 || communityPost.status === 200) {
    pass('Community post create', postId || 'ok');
  } else {
    fail('Community post create', JSON.stringify(communityPost.data)?.slice(0, 120));
  }

  if (postId) {
    const comment = await api(
      'POST',
      `/community/posts/${postId}/comments`,
      { body: 'Verify comment — great tip!' },
      token,
    );
    if (comment.status === 201 || comment.status === 200) {
      pass('Community comment create', comment.data?.id || 'ok');
    } else {
      fail('Community comment create', JSON.stringify(comment.data)?.slice(0, 120));
    }

    const like = await api('POST', `/community/posts/${postId}/like`, null, token);
    if (like.status === 201 || like.status === 200) {
      pass('Community post like', `liked=${like.data?.liked}, count=${like.data?.likeCount}`);
    } else {
      fail('Community post like', JSON.stringify(like.data)?.slice(0, 120));
    }
  }

  const communityList = await api('GET', '/community/posts?limit=5', null, token);
  if (communityList.status === 200 && Array.isArray(communityList.data) && communityList.data.length > 0) {
    pass('Community posts list', `${communityList.data.length} post(s)`);
  } else {
    fail('Community posts list', JSON.stringify(communityList.data)?.slice(0, 120));
  }

  if (meForTier.status === 200) pass('User profile');
  else fail('User profile');

  let buddyGet = await api('GET', '/buddy', null, token);
  if (buddyGet.status === 404) {
    const buddyCreate = await api(
      'POST',
      '/buddy',
      { name: 'Verify Sprout', speciesId: 'monstera', trait: 'RESILIENT' },
      token,
    );
    if (buddyCreate.status === 201 || buddyCreate.status === 200) {
      pass('Buddy create', buddyCreate.data?.name || 'ok');
      buddyGet = await api('GET', '/buddy', null, token);
    } else {
      fail('Buddy create', JSON.stringify(buddyCreate.data)?.slice(0, 120));
    }
  } else if (buddyGet.status === 200) {
    pass('Buddy exists', buddyGet.data?.name || 'ok');
  } else {
    fail('Buddy get', String(buddyGet.status));
  }

  if (buddyGet.status === 200) {
    const buddyActs = await api('GET', '/buddy/activities', null, token);
    if (buddyActs.status === 200 && Array.isArray(buddyActs.data) && buddyActs.data.length >= 10) {
      pass('Buddy activities', `${buddyActs.data.length} types`);
    } else {
      fail('Buddy activities', JSON.stringify(buddyActs.data)?.slice(0, 80));
    }

    const buddyGreet = await api('GET', '/buddy/greeting', null, token);
    if (buddyGreet.status === 200 && buddyGreet.data?.message) pass('Buddy greeting');
    else fail('Buddy greeting', String(buddyGreet.status));

    const buddyQuests = await api('GET', '/buddy/quests', null, token);
    if (buddyQuests.status === 200 && buddyQuests.data?.daily) pass('Buddy quests');
    else fail('Buddy quests', String(buddyQuests.status));

    const buddySeasonal = await api('GET', '/buddy/seasonal', null, token);
    if (buddySeasonal.status === 200 && typeof buddySeasonal.data?.active === 'boolean') {
      pass('Buddy seasonal', buddySeasonal.data.active ? 'event active' : 'no event');
    } else {
      fail('Buddy seasonal', String(buddySeasonal.status));
    }

    let buddyShop = await api('GET', '/buddy/shop/catalog', null, token);
    if (
      buddyShop.status === 200 &&
      Array.isArray(buddyShop.data?.items) &&
      buddyShop.data.items.length > 0 &&
      typeof buddyShop.data.dewdrops === 'number'
    ) {
      pass('Buddy shop catalog', `${buddyShop.data.items.length} items`);

      if (prisma && buddyGet.data?.id) {
        await prisma.buddy.update({
          where: { id: buddyGet.data.id },
          data: { dewdrops: 0 },
        });
        buddyShop = await api('GET', '/buddy/shop/catalog', null, token);
      }
      const costly = buddyShop.data?.items?.find(
        (i) => !i.owned && (i.cost ?? 0) > 0 && !i.bloomTokenCost,
      );
      if (costly) {
        const buyFail = await api(
          'POST',
          '/buddy/shop/purchase',
          { itemId: costly.id },
          token,
        );
        const msg = buyFail.data?.message ?? '';
        if (buyFail.status === 400 && /dewdrop/i.test(String(msg))) {
          pass('Buddy shop insufficient funds', costly.id);
        } else {
          fail('Buddy shop insufficient funds', JSON.stringify(buyFail.data)?.slice(0, 80));
        }
      } else {
        pass('Buddy shop insufficient funds', 'skipped (no priced item)');
      }
    } else {
      fail('Buddy shop catalog', String(buddyShop.status));
    }
  }

  if (prisma) await prisma.$disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
