import { NotFoundException } from '@nestjs/common';
import { PlantProgressService } from './plant-progress.service';

describe('PlantProgressService', () => {
  function makePlant(overrides: Record<string, unknown> = {}) {
    return {
      id: 'plant-1',
      userId: 'user-1',
      gardenId: 'garden-1',
      nickname: 'Monty',
      location: 'Living room',
      shares: [],
      species: {
        commonName: 'Monstera',
        scientificName: 'Monstera deliciosa',
        sunlight: 'Bright indirect light',
        wateringFreqDays: 7,
        careNotes: 'Let soil dry slightly.',
      },
      ...overrides,
    };
  }

  function makeEntry(overrides: Record<string, unknown> = {}) {
    return {
      id: 'entry-1',
      plantId: 'plant-1',
      userId: 'user-1',
      taskId: null,
      photoUrl: null,
      overallHealth: 'STABLE',
      growthChange: null,
      leafCondition: null,
      soilMoisture: null,
      pestSigns: null,
      recentCare: null,
      notes: null,
      analysisSummary: 'Original summary',
      adviceText: 'Original advice',
      storyJson: null,
      createdAt: new Date('2026-06-30T12:00:00.000Z'),
      updatedAt: new Date('2026-06-30T12:00:00.000Z'),
      ...overrides,
    };
  }

  function createService({
    plant = makePlant(),
    entry = makeEntry(),
  }: {
    plant?: Record<string, unknown> | null;
    entry?: Record<string, unknown> | null;
  } = {}) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue(plant),
      },
      plantProgressEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(entry),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'entry-new', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...entry, ...data })),
        delete: jest.fn().mockResolvedValue(entry),
      },
      task: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      taskFeedback: {
        create: jest.fn().mockResolvedValue({ id: 'feedback-1' }),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const upload = {
      saveFile: jest.fn().mockResolvedValue('/uploads/progress.webp'),
      deleteByUrl: jest.fn().mockResolvedValue(undefined),
    };
    const imageModeration = { assertImageAllowed: jest.fn().mockResolvedValue(null) };
    const aiUsage = {
      reserveCall: jest.fn().mockResolvedValue(null),
      completeCall: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    };
    const recommendations = {
      completePlantCheckInForPlant: jest.fn().mockResolvedValue({ count: 1 }),
      refreshPlant: jest.fn().mockResolvedValue([]),
    };
    const milestones = {
      syncPlantLifeMilestones: jest.fn().mockResolvedValue(undefined),
    };
    const service = new PlantProgressService(
      prisma as never,
      upload as never,
      imageModeration as never,
      aiUsage as never,
      config as never,
      recommendations as never,
      milestones as never,
    );

    return { service, prisma, upload, imageModeration, recommendations, milestones };
  }

  it('creates a progress entry and completes the active Plant Check-In recommendation', async () => {
    const { service, prisma, recommendations, milestones } = createService();

    const result = await service.create('user-1', 'plant-1', {
      overallHealth: 'STABLE',
      growthChange: 'SAME',
      leafCondition: 'HEALTHY',
    });

    expect(result.id).toBe('entry-new');
    expect(prisma.plantProgressEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          userId: 'user-1',
          overallHealth: 'STABLE',
          analysisSummary: expect.any(String),
        }),
      }),
    );
    expect(recommendations.completePlantCheckInForPlant).toHaveBeenCalledWith(
      'user-1',
      'plant-1',
    );
    expect(milestones.syncPlantLifeMilestones).toHaveBeenCalledWith(
      'user-1',
      'plant-1',
      expect.any(Array),
    );
    expect(prisma.task.findFirst).not.toHaveBeenCalled();
  });

  it('updates an owned progress entry and recomputes the saved story when content changes', async () => {
    const { service, prisma, milestones } = createService();

    const result = await service.update('user-1', 'plant-1', 'entry-1', {
      overallHealth: 'CONCERNED',
      notes: 'Yellowing moved to another leaf.',
    });

    expect(result.overallHealth).toBe('CONCERNED');
    expect(prisma.plantProgressEntry.findFirst).toHaveBeenCalledWith({
      where: { id: 'entry-1', plantId: 'plant-1', userId: 'user-1' },
    });
    expect(prisma.plantProgressEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { plantId: 'plant-1', id: { not: 'entry-1' } },
      }),
    );
    expect(prisma.plantProgressEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: expect.objectContaining({
        overallHealth: 'CONCERNED',
        notes: 'Yellowing moved to another leaf.',
        analysisSummary: expect.any(String),
        adviceText: expect.any(String),
        storyJson: expect.any(String),
      }),
    });
    expect(milestones.syncPlantLifeMilestones).toHaveBeenCalledWith(
      'user-1',
      'plant-1',
      expect.any(Array),
    );
  });

  it('replaces a progress photo after moderation', async () => {
    const { service, prisma, upload, imageModeration } = createService({
      entry: makeEntry({ photoUrl: '/uploads/old-progress.webp' }),
    });
    const file = {
      buffer: Buffer.from('image'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    await service.update('user-1', 'plant-1', 'entry-1', {}, file);

    expect(imageModeration.assertImageAllowed).toHaveBeenCalledWith(file, {
      feature: 'plant_progress_update',
      userId: 'user-1',
    });
    expect(upload.saveFile).toHaveBeenCalledWith(file);
    expect(prisma.plantProgressEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoUrl: '/uploads/progress.webp' }),
      }),
    );
    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/old-progress.webp');
  });

  it('deletes an owned progress entry', async () => {
    const { service, prisma, upload } = createService({
      entry: makeEntry({ photoUrl: '/uploads/progress.webp' }),
    });

    const result = await service.remove('user-1', 'plant-1', 'entry-1');

    expect(result).toEqual({ deleted: true });
    expect(prisma.plantProgressEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/progress.webp');
  });

  it('removes a new progress photo and preserves the old one when persistence fails', async () => {
    const { service, prisma, upload } = createService({
      entry: makeEntry({ photoUrl: '/uploads/old-progress.webp' }),
    });
    prisma.plantProgressEntry.update.mockRejectedValue(
      new Error('database unavailable'),
    );
    const file = {
      buffer: Buffer.from('image'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    await expect(
      service.update('user-1', 'plant-1', 'entry-1', {}, file),
    ).rejects.toThrow('database unavailable');

    expect(upload.deleteByUrl).toHaveBeenCalledTimes(1);
    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/progress.webp');
    expect(upload.deleteByUrl).not.toHaveBeenCalledWith('/uploads/old-progress.webp');
  });

  it('blocks updates when the progress entry is not owned by the user', async () => {
    const { service } = createService({ entry: null });

    await expect(
      service.update('other-user', 'plant-1', 'entry-1', { notes: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
