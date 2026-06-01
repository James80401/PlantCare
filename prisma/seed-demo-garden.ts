import { addDays } from 'date-fns';
import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';
import { speciesSeedId } from './data/species-catalog';

const DEMO_EMAIL = 'demo@plantcare.local';
const DEMO_PASSWORD = 'DemoPlant1!';

/**
 * Optional demo account with plants, an open diagnosis, and a Dr. Plant thread.
 * Login: demo@plantcare.local / DemoPlant1!
 */
export async function seedDemoGarden(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      emailVerified: true,
      name: 'Demo Gardener',
      onboardingCompletedAt: new Date(),
    },
    update: {
      emailVerified: true,
      passwordHash,
    },
  });

  const snakeSpeciesId =
    (
      await prisma.plantSpecies.findFirst({
        where: { commonName: { contains: 'Snake Plant' } },
        select: { id: true },
      })
    )?.id ?? speciesSeedId('Snake Plant', 'Sansevieria trifasciata');
  const pothosSpeciesId =
    (
      await prisma.plantSpecies.findFirst({
        where: { commonName: { contains: 'Pothos' } },
        select: { id: true },
      })
    )?.id ?? speciesSeedId('Pothos', 'Epipremnum aureum');

  // Every plant now lives in a Garden. Seed a demo "home" garden with the demo user
  // as its OWNER member.
  const garden = await prisma.garden.upsert({
    where: { id: 'seed-demo-garden' },
    create: {
      id: 'seed-demo-garden',
      name: 'Living Room Plants',
      location: 'Living room — south window',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
    update: {
      name: 'Living Room Plants',
      location: 'Living room — south window',
      ownerId: user.id,
    },
  });

  const snake = await prisma.plant.upsert({
    where: { id: 'seed-demo-snake-plant' },
    create: {
      id: 'seed-demo-snake-plant',
      userId: user.id,
      gardenId: garden.id,
      speciesId: snakeSpeciesId,
      nickname: 'Window Snake',
      location: 'Indoor — bright indirect',
      potSize: 'MEDIUM',
      notes: 'Demo plant with an open health check for Dr. Plant testing.',
    },
    update: {
      userId: user.id,
      gardenId: garden.id,
      nickname: 'Window Snake',
      notes: 'Demo plant with an open health check for Dr. Plant testing.',
    },
  });

  await prisma.plant.upsert({
    where: { id: 'seed-demo-pothos' },
    create: {
      id: 'seed-demo-pothos',
      userId: user.id,
      gardenId: garden.id,
      speciesId: pothosSpeciesId,
      nickname: 'Shelf Pothos',
      location: 'Indoor — medium light',
      potSize: 'SMALL',
    },
    update: {
      userId: user.id,
      gardenId: garden.id,
      nickname: 'Shelf Pothos',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { plantId: snake.id } });
  await prisma.diagnosisConversation.deleteMany({ where: { plantId: snake.id } });

  await prisma.diagnosis.create({
    data: {
      plantId: snake.id,
      symptomsText: 'Yellowing lower leaves, soil feels wet',
      resultLabel: 'Possible overwatering',
      confidence: 0.72,
      adviceText:
        'Let the top half of the soil dry before watering again. Check drainage and reduce volume.',
      source: 'openai',
      resolved: false,
    },
  });

  const conv = await prisma.diagnosisConversation.create({
    data: {
      plantId: snake.id,
      userId: user.id,
      title: 'Yellow leaves on snake plant',
    },
  });

  await prisma.diagnosisMessage.createMany({
    data: [
      {
        conversationId: conv.id,
        role: 'user',
        content: 'Lower leaves are turning yellow and soft. I watered last week.',
      },
      {
        conversationId: conv.id,
        role: 'assistant',
        content:
          'That pattern often means the roots have been wet too long. Check if the pot drains freely, skip watering until the top 2 inches of soil are dry, and remove any mushy leaves.',
      },
    ],
  });

  const today = new Date();
  await prisma.task.deleteMany({
    where: { plantId: { in: ['seed-demo-snake-plant', 'seed-demo-pothos'] } },
  });
  await prisma.task.createMany({
    data: [
      {
        plantId: snake.id,
        gardenId: garden.id,
        taskType: 'WATER',
        dueDate: today,
        status: 'PENDING',
      },
      {
        plantId: snake.id,
        gardenId: garden.id,
        taskType: 'MIST',
        dueDate: addDays(today, 2),
        status: 'PENDING',
      },
      {
        plantId: 'seed-demo-pothos',
        gardenId: garden.id,
        taskType: 'WATER',
        dueDate: addDays(today, 1),
        status: 'PENDING',
      },
    ],
  });

  console.log(
    `Demo garden: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (2 plants, 1 open diagnosis, Dr. Plant sample chat)`,
  );
}
