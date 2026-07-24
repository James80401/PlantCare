import { NotFoundException } from '@nestjs/common';
import { PlantLifeStage, PlanTier, PotSize } from '@prisma/client';
import { PlantsService } from './plants.service';

describe('PlantsService', () => {
  const plant = {
    id: 'plant-1',
    userId: 'user-1',
    speciesId: 'species-1',
    nickname: 'Kitchen fern',
    location: 'Indoor — medium light',
    potSize: PotSize.MEDIUM,
    lifeStage: PlantLifeStage.ESTABLISHED,
    approximateAgeMonths: 12,
    imageUrl: 'https://example.com/old.jpg',
    notes: 'Old notes',
    journalEntries: [],
    progressEntries: [],
    diagnoses: [],
    diagnosisConversations: [],
  };

  function createService() {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          planTier: PlanTier.FREE,
          identifyCountThisMonth: 0,
          identifyCountResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      plant: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([
          {
            ...plant,
            species: { commonName: 'Fern' },
            tasks: [],
            diagnoses: [],
          },
        ]),
        findFirst: jest.fn().mockResolvedValue(plant),
        create: jest.fn().mockResolvedValue({ ...plant, species: {} }),
        update: jest.fn().mockResolvedValue({ ...plant, nickname: 'Updated' }),
        delete: jest.fn().mockResolvedValue(plant),
      },
      plantSpecies: {
        findFirst: jest.fn().mockResolvedValue({ id: 'species-1' }),
        create: jest.fn(),
      },
      gardenMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      garden: {
        findUnique: jest.fn().mockResolvedValue({ location: 'Indoor' }),
      },
    };
    const scheduler = {
      generateTasksForPlant: jest.fn().mockResolvedValue(undefined),
    };
    const upload = {
      deleteByUrl: jest.fn().mockResolvedValue(undefined),
      saveFile: jest.fn(),
    };

    const service = new PlantsService(
      prisma as never,
      {} as never,
      scheduler as never,
      upload as never,
      { identify: jest.fn() } as never,
      {
        getOrFetchById: jest.fn().mockResolvedValue({}),
        invalidateCacheForMutation: jest.fn(),
      } as never,
      {} as never,
      { get: jest.fn() } as never,
      { assertImageAllowed: jest.fn().mockResolvedValue(null) } as never,
      { refreshPlant: jest.fn().mockResolvedValue([]) } as never,
      { syncEngagementForUser: jest.fn().mockResolvedValue([]) } as never,
    );

    return { service, prisma, scheduler, upload };
  }

  it('lists plants without triggering write-side maintenance', async () => {
    const { service, prisma, scheduler } = createService();

    const result = await service.findAll('user-1');

    expect(result).toHaveLength(1);
    expect(prisma.plant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(prisma.plant.create).not.toHaveBeenCalled();
    expect(prisma.plant.update).not.toHaveBeenCalled();
    expect(prisma.plant.delete).not.toHaveBeenCalled();
    expect(scheduler.generateTasksForPlant).not.toHaveBeenCalled();
  });

  it('updates nickname, pot size, notes, and image for the owner', async () => {
    const { service, prisma, scheduler, upload } = createService();
    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue({
      ...plant,
      species: {},
      tasks: [],
      journalEntries: [],
      diagnoses: [],
      careOverview: {},
    } as never);

    const result = await service.update('user-1', 'plant-1', 'PREMIUM' as never, {
      nickname: '  Patio fern  ',
      potSize: PotSize.LARGE,
      notes: 'Moved to brighter corner',
      imageUrl: 'https://example.com/new.jpg',
    });

    expect(prisma.plant.update).toHaveBeenCalledWith({
      where: { id: 'plant-1' },
      data: {
        nickname: 'Patio fern',
        potSize: PotSize.LARGE,
        notes: 'Moved to brighter corner',
        imageUrl: 'https://example.com/new.jpg',
      },
    });
    expect(scheduler.generateTasksForPlant).toHaveBeenCalledWith('plant-1', 'PREMIUM');
    expect(upload.deleteByUrl).toHaveBeenCalledWith('https://example.com/old.jpg');
    expect(prisma.plant.update.mock.invocationCallOrder[0]).toBeLessThan(
      upload.deleteByUrl.mock.invocationCallOrder[0],
    );
    expect(result.tasksRescheduled).toBe(true);
    findOne.mockRestore();
  });

  it('rejects updates for plants outside the user', async () => {
    const { service, prisma } = createService();
    prisma.plant.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'missing', 'FREE' as never, { notes: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows a free user to create the fifth plant', async () => {
    const { service, prisma } = createService();
    prisma.plant.count.mockResolvedValue(4);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'plant-1' } as never);

    await service.create('user-1', PlanTier.FREE, {
      gardenId: 'garden-1',
      speciesId: 'species-1',
      potSize: PotSize.MEDIUM,
    } as never);

    expect(prisma.plant.create).toHaveBeenCalled();
  });

  it('deletes all managed plant media after the plant record is removed', async () => {
    const { service, prisma, upload } = createService();
    prisma.plant.findFirst.mockResolvedValue({
      ...plant,
      imageUrl: '/uploads/plant.webp',
      journalEntries: [{ photoUrl: '/uploads/journal.webp' }],
      progressEntries: [{ photoUrl: '/uploads/progress.webp' }],
      diagnoses: [{ imageUrl: '/uploads/diagnosis.webp' }],
      diagnosisConversations: [
        { messages: [{ imageUrl: '/uploads/chat.webp' }] },
      ],
    });

    await expect(service.remove('user-1', 'plant-1')).resolves.toEqual({
      deleted: true,
    });

    expect(prisma.plant.delete).toHaveBeenCalledWith({ where: { id: 'plant-1' } });
    expect(upload.deleteByUrl).toHaveBeenCalledTimes(5);
    expect(prisma.plant.delete.mock.invocationCallOrder[0]).toBeLessThan(
      upload.deleteByUrl.mock.invocationCallOrder[0],
    );
  });

  it('sets gardenId and inherits garden area on the created plant', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'plant-1' } as never);

    await service.create('user-1', PlanTier.FREE, {
      gardenId: 'garden-1',
      speciesId: 'species-1',
      location: 'Outdoor',
      potSize: PotSize.MEDIUM,
      lifeStage: PlantLifeStage.SEEDLING,
      approximateAgeMonths: 2,
    } as never);

    expect(prisma.plant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gardenId: 'garden-1',
          userId: 'user-1',
          location: 'Indoor',
          lifeStage: PlantLifeStage.SEEDLING,
          approximateAgeMonths: 2,
        }),
      }),
    );
  });

  it('blocks adding a plant to a garden the user is not an editor of', async () => {
    const { service, prisma } = createService();
    prisma.gardenMember.findUnique.mockResolvedValue(null); // not a member

    await expect(
      service.create('user-1', PlanTier.FREE, {
        gardenId: 'garden-x',
        speciesId: 'species-1',
        potSize: PotSize.MEDIUM,
      } as never),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('blocks a VIEWER from adding a plant to a shared garden', async () => {
    const { service, prisma } = createService();
    prisma.gardenMember.findUnique.mockResolvedValue({ role: 'VIEWER' });

    await expect(
      service.create('user-1', PlanTier.FREE, {
        gardenId: 'garden-shared',
        speciesId: 'species-1',
        potSize: PotSize.MEDIUM,
      } as never),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('blocks a free user from creating a sixth plant', async () => {
    const { service, prisma } = createService();
    prisma.plant.count.mockResolvedValue(5);

    await expect(
      service.create('user-1', PlanTier.FREE, {
        speciesId: 'species-1',
        potSize: PotSize.MEDIUM,
      } as never),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PLANT_LIMIT_REACHED' }),
    });
  });

  it('blocks a free user from a fourth identification in the active window', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      planTier: PlanTier.FREE,
      identifyCountThisMonth: 3,
      identifyCountResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    // Simulates the DB rejecting the conditional increment because the row is already
    // at the limit (`identifyCountThisMonth < 3` matches 0 rows).
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.identify('user-1', PlanTier.FREE, {} as never)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDENTIFY_LIMIT_REACHED' }),
    });
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    expect(plantNet.identify).not.toHaveBeenCalled();
  });

  it('never lets two concurrent identifications both slip under the cap', async () => {
    // The real DB serializes concurrent `UPDATE ... WHERE count < limit` statements against
    // the same row; this simulates that by having only the first conditional update match.
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      planTier: PlanTier.FREE,
      identifyCountThisMonth: 2,
      identifyCountResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    prisma.user.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    plantNet.identify.mockResolvedValue({
      commonName: 'Pothos',
      scientificName: 'Epipremnum aureum',
      confidence: 0.9,
    });

    const [first, second] = await Promise.allSettled([
      service.identify('user-1', PlanTier.FREE, {} as never),
      service.identify('user-1', PlanTier.FREE, {} as never),
    ]);

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toMatchObject({
      response: expect.objectContaining({ code: 'IDENTIFY_LIMIT_REACHED' }),
    });
  });

  it('resets the rolling identify window before counting a free identification', async () => {
    const { service, prisma } = createService();
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    plantNet.identify.mockResolvedValue({
      commonName: 'Pothos',
      scientificName: 'Epipremnum aureum',
      confidence: 0.9,
    });
    const staleResetAt = new Date(Date.now() - 1000);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      planTier: PlanTier.FREE,
      identifyCountThisMonth: 3,
      identifyCountResetAt: staleResetAt,
    });

    await service.identify('user-1', PlanTier.FREE, {} as never);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', identifyCountResetAt: staleResetAt },
      data: { identifyCountThisMonth: 0, identifyCountResetAt: expect.any(Date) },
    });
    expect(prisma.user.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'user-1', identifyCountThisMonth: { lt: 3 } },
      data: { identifyCountThisMonth: { increment: 1 } },
    });
  });

  it('releases the claimed slot when the identification attempt fails', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      planTier: PlanTier.FREE,
      identifyCountThisMonth: 0,
      identifyCountResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    plantNet.identify.mockResolvedValue(null);

    await expect(
      service.identify('user-1', PlanTier.FREE, {} as never),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.user.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'user-1', identifyCountThisMonth: { gt: 0 } },
      data: { identifyCountThisMonth: { decrement: 1 } },
    });
  });

  it('does not touch the quota for premium users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      planTier: PlanTier.PREMIUM,
      identifyCountThisMonth: 999,
      identifyCountResetAt: new Date(Date.now() - 1000),
    });
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    plantNet.identify.mockResolvedValue({
      commonName: 'Pothos',
      scientificName: 'Epipremnum aureum',
      confidence: 0.9,
    });

    await service.identify('user-1', PlanTier.PREMIUM, {} as never);

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('returns provisional external matches without creating catalog rows', async () => {
    const { service, prisma } = createService();
    const plantNet = (service as unknown as { plantNet: { identify: jest.Mock } }).plantNet;
    plantNet.identify.mockResolvedValue({
      commonName: 'Rare Prayer Plant',
      scientificName: 'Maranta rarea',
      confidence: 0.84,
      provider: 'plantnet',
      providerMatchId: 'Maranta rarea',
    });
    prisma.plantSpecies.findFirst.mockResolvedValue(null);

    const result = await service.identify('user-1', PlanTier.FREE, {} as never);

    expect(prisma.plantSpecies.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      matchType: 'external',
      species: null,
      externalMatch: {
        provider: 'plantnet',
        commonName: 'Rare Prayer Plant',
        scientificName: 'Maranta rarea',
        integrationStatus: 'requires_confirmation',
      },
    });
    expect(result.externalMatch?.careArchetype.id).toBe('high_humidity');
  });

  it('creates a first-class species row when the user confirms an external match', async () => {
    const { service, prisma } = createService();
    const perenual = (service as unknown as {
      perenual: { invalidateCacheForMutation: jest.Mock };
    }).perenual;
    prisma.plantSpecies.findFirst.mockResolvedValue(null);
    prisma.plantSpecies.create.mockResolvedValue({
      id: 'new-species',
      commonName: 'Rare Prayer Plant',
      scientificName: 'Maranta rarea',
      wateringFreqDays: 7,
    });

    const result = await service.confirmExternalSpecies('user-1', {
      provider: 'plantnet',
      commonName: 'Rare Prayer Plant',
      scientificName: 'Maranta rarea',
      confidence: 0.84,
      providerMatchId: 'Maranta rarea',
    });

    expect(prisma.plantSpecies.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        commonName: 'Rare Prayer Plant',
        scientificName: 'Maranta rarea',
        wateringFreqDays: 7,
        metadataJson: expect.stringContaining('"externalSource"'),
      }),
    });
    expect(perenual.invalidateCacheForMutation).toHaveBeenCalled();
    expect(result).toMatchObject({
      created: true,
      matchType: 'external_confirmed',
      species: { id: 'new-species' },
    });
  });
});
