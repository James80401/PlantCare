import { PrismaClient } from '@prisma/client';
import {
  ACHIEVEMENT_QUESTS,
  DAILY_QUEST_POOL,
  MONTHLY_CHALLENGE_SEED,
} from '../apps/api/src/buddy/constants/quest-seed-data';

export async function seedBuddyQuests(prisma: PrismaClient) {
  const allQuests = [...DAILY_QUEST_POOL, ...ACHIEVEMENT_QUESTS];
  for (const q of allQuests) {
    await prisma.quest.upsert({
      where: { id: q.id },
      update: {
        type: q.type,
        title: q.title,
        description: q.description,
        requirement: JSON.stringify(q.requirement),
        rewardDewdrops: q.rewardDewdrops,
        isActive: true,
        sortOrder: q.sortOrder,
      },
      create: {
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description,
        requirement: JSON.stringify(q.requirement),
        rewardDewdrops: q.rewardDewdrops,
        sortOrder: q.sortOrder,
      },
    });
  }

  const { month, year, title, description, rewardDewdrops, steps } = MONTHLY_CHALLENGE_SEED;
  await prisma.monthlyChallenge.upsert({
    where: { month_year: { month, year } },
    update: {
      title,
      description,
      steps: JSON.stringify(steps),
      rewardDewdrops,
      isActive: true,
    },
    create: {
      month,
      year,
      title,
      description,
      steps: JSON.stringify(steps),
      rewardDewdrops,
      isActive: true,
    },
  });

  const questCount = await prisma.quest.count();
  const challengeCount = await prisma.monthlyChallenge.count();
  console.log(`Buddy quests: ${questCount} quests, ${challengeCount} monthly challenges.`);
}
