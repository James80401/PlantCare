import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';

const OWNED_PLANT = { userId: 'user-1', garden: null, shares: [] };

describe('DiagnosisService', () => {
  function createService(
    diagnosis: unknown = { id: 'diagnosis-1', plant: OWNED_PLANT },
  ) {
    const prisma = {
      diagnosis: {
        findFirst: jest.fn().mockResolvedValue(diagnosis),
        update: jest.fn().mockResolvedValue({ id: 'diagnosis-1', resolved: true }),
      },
      task: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'task-1',
          taskType: 'HEALTH_CHECK',
          plantId: 'plant-1',
          sourceDiagnosisId: 'diagnosis-1',
        }),
      },
      journalEntry: {
        create: jest.fn().mockResolvedValue({ id: 'journal-1' }),
      },
      plant: {
        findUnique: jest.fn().mockResolvedValue({ gardenId: 'garden-1' }),
      },
    };

    const service = new DiagnosisService(
      prisma as never,
      {} as never,
      { get: jest.fn() } as never,
      { isAvailable: jest.fn().mockReturnValue(false) } as never,
      { assertImageAllowed: jest.fn().mockResolvedValue(null) } as never,
      {
        assertPlantIntentOrThrow: jest.fn().mockResolvedValue(undefined),
        reserveCall: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    return { service, prisma };
  }

  it('updates diagnosis resolved status for the owning user', async () => {
    const { service, prisma } = createService();

    const result = await service.updateStatus('user-1', 'plant-1', 'diagnosis-1', {
      resolved: true,
    });

    expect(result.resolved).toBe(true);
    expect(prisma.diagnosis.findFirst).toHaveBeenCalledWith({
      where: { id: 'diagnosis-1', plantId: 'plant-1' },
      include: { plant: { include: expect.any(Object) } },
    });
    expect(prisma.diagnosis.update).toHaveBeenCalledWith({
      where: { id: 'diagnosis-1' },
      data: { resolved: true },
    });
  });

  it('rejects status updates for diagnoses outside the user plant', async () => {
    const { service } = createService(null);

    await expect(
      service.updateStatus('user-1', 'plant-1', 'diagnosis-1', { resolved: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns recovery suggestions from immediateActions', async () => {
    const { service } = createService({
      id: 'diagnosis-1',
      detailJson: JSON.stringify({
        immediateActions: ['Water lightly', 'Inspect for pests'],
      }),
      adviceText: null,
      plant: OWNED_PLANT,
    });

    const suggestions = await service.getRecoverySuggestions(
      'user-1',
      'plant-1',
      'diagnosis-1',
    );

    expect(suggestions.length).toBe(2);
    expect(suggestions[0].taskType).toBe('WATER');
    expect(suggestions[0].alreadyScheduled).toBe(false);
  });

  it('applies selected recovery tasks', async () => {
    const detailJson = JSON.stringify({
      immediateActions: ['Water lightly'],
    });
    const { service, prisma } = createService({
      id: 'diagnosis-1',
      detailJson,
      adviceText: null,
      plant: OWNED_PLANT,
    });

    const suggestions = await service.getRecoverySuggestions(
      'user-1',
      'plant-1',
      'diagnosis-1',
    );

    prisma.task.findFirst = jest.fn().mockResolvedValue(null);
    prisma.task.create = jest.fn().mockResolvedValue({
      id: 'task-water',
      taskType: 'WATER',
      plantId: 'plant-1',
    });

    const created = await service.applyRecoveryTasks('user-1', 'plant-1', 'diagnosis-1', {
      keys: [suggestions[0].key],
    });

    expect(created).toHaveLength(1);
    expect(prisma.task.create).toHaveBeenCalled();
  });

  it('creates a health check follow-up task linked to the diagnosis', async () => {
    const { service, prisma } = createService();

    const result = await service.createFollowUpTask(
      'user-1',
      'plant-1',
      'diagnosis-1',
      { dueInDays: 5 },
    );

    expect(result.taskType).toBe('HEALTH_CHECK');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
          sourceDiagnosisId: 'diagnosis-1',
        }),
      }),
    );
    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });

  it('logs follow-up note to journal when provided', async () => {
    const { service, prisma } = createService();

    await service.createFollowUpTask('user-1', 'plant-1', 'diagnosis-1', {
      dueInDays: 3,
      note: 'Check lower leaves',
    });

    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: {
        plantId: 'plant-1',
        notes: 'Health check follow-up in 3 days: Check lower leaves',
      },
    });
  });
});

describe('DiagnosisService.diagnose shared-plant access', () => {
  function makeService(plant: unknown) {
    const prisma = {
      plant: { findFirst: jest.fn().mockResolvedValue(plant) },
      diagnosis: { create: jest.fn().mockResolvedValue({ id: 'd-1' }) },
    };
    const service = new DiagnosisService(
      prisma as never,
      { saveFile: jest.fn() } as never,
      { get: jest.fn() } as never,
      { isAvailable: jest.fn().mockReturnValue(false) } as never,
      { assertImageAllowed: jest.fn().mockResolvedValue(null) } as never,
      {
        assertPlantIntentOrThrow: jest.fn().mockResolvedValue(undefined),
        reserveCall: jest.fn().mockResolvedValue(undefined),
      } as never,
    );
    return { service, prisma };
  }

  it('lets a garden caregiver diagnose a plant shared with completion rights', async () => {
    const { service } = makeService({
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      species: { commonName: 'Pothos', scientificName: 'Epipremnum aureum', wateringFreqDays: 7 },
      shares: [
        {
          canComplete: true,
          canJournal: false,
          garden: { members: [{ userId: 'caregiver-1', role: 'CAREGIVER' }] },
        },
      ],
    });

    await expect(
      service.diagnose('caregiver-1', 'plant-1', undefined, 'yellow leaves'),
    ).resolves.toBeDefined();
  });

  it('blocks a garden viewer from diagnosing a shared plant', async () => {
    const { service } = makeService({
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      species: { commonName: 'Pothos', scientificName: 'Epipremnum aureum', wateringFreqDays: 7 },
      shares: [
        {
          canComplete: true,
          canJournal: false,
          garden: { members: [{ userId: 'viewer-1', role: 'VIEWER' }] },
        },
      ],
    });

    await expect(
      service.diagnose('viewer-1', 'plant-1', undefined, 'yellow leaves'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DiagnosisService.diagnose parallelization', () => {
  function makeFile(): Express.Multer.File {
    return {
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimetype: 'image/jpeg',
      originalname: 'leaf.jpg',
      fieldname: 'image',
      encoding: '7bit',
      size: 3,
      stream: undefined as never,
      destination: '',
      filename: 'leaf.jpg',
      path: '',
    };
  }

  function makeService(overrides: { moderationDelayMs?: number; modelDelayMs?: number; moderationRejects?: boolean } = {}) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'plant-1',
          userId: 'user-1',
          location: 'window',
          species: { commonName: 'Pothos', scientificName: 'Epipremnum aureum', wateringFreqDays: 7 },
        }),
      },
      diagnosis: {
        create: jest.fn().mockResolvedValue({ id: 'd-1' }),
      },
    };
    const upload = {
      saveFile: jest.fn().mockResolvedValue('/uploads/leaf.webp'),
      deleteByUrl: jest.fn().mockResolvedValue(undefined),
    };
    const config = { get: jest.fn() };
    const llm = {
      isAvailable: jest.fn().mockReturnValue(true),
      diagnose: jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  issueName: 'Underwatering',
                  confidence: 0.8,
                  summary: 's',
                  likelyCauses: [],
                  immediateActions: [],
                  longTermCare: [],
                  whenToSeekHelp: 'soon',
                }),
              overrides.modelDelayMs ?? 100,
            ),
          ),
      ),
      formatAdviceText: jest.fn().mockReturnValue('advice'),
    };
    const imageModeration = {
      assertImageAllowed: jest.fn(
        () =>
          new Promise((resolve, reject) =>
            setTimeout(
              () =>
                overrides.moderationRejects
                  ? reject(new BadRequestException('rejected'))
                  : resolve(null),
              overrides.moderationDelayMs ?? 50,
            ),
          ),
      ),
    };
    const aiUsage = {
      assertPlantIntentOrThrow: jest.fn().mockResolvedValue(undefined),
      reserveCall: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DiagnosisService(
      prisma as never,
      upload as never,
      config as never,
      llm as never,
      imageModeration as never,
      aiUsage as never,
    );
    return { service, prisma, upload, llm, imageModeration };
  }

  it('runs moderation in parallel with the OpenAI diagnose call', async () => {
    const { service, llm, imageModeration } = makeService({ moderationDelayMs: 100, modelDelayMs: 100 });
    const t0 = Date.now();
    await service.diagnose('user-1', 'plant-1', makeFile(), 'yellow leaves');
    const elapsed = Date.now() - t0;
    expect(llm.diagnose).toHaveBeenCalled();
    expect(imageModeration.assertImageAllowed).toHaveBeenCalled();
    // Two ~100ms calls in parallel → total well under 200ms. Allow generous slack for CI.
    expect(elapsed).toBeLessThan(180);
  });

  it('throws BadRequest and does NOT persist the diagnosis when moderation rejects', async () => {
    const { service, prisma } = makeService({ moderationRejects: true, modelDelayMs: 50, moderationDelayMs: 20 });
    await expect(
      service.diagnose('user-1', 'plant-1', makeFile(), 'symptoms'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.diagnosis.create).not.toHaveBeenCalled();
  });

  it('does NOT save the image when moderation rejects', async () => {
    const { service, upload } = makeService({ moderationRejects: true });
    await expect(
      service.diagnose('user-1', 'plant-1', makeFile(), 'symptoms'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upload.saveFile).not.toHaveBeenCalled();
  });

  it('deletes a normalized image when diagnosis persistence fails', async () => {
    const { service, prisma, upload } = makeService();
    prisma.diagnosis.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.diagnose('user-1', 'plant-1', makeFile(), 'symptoms'),
    ).rejects.toThrow('database unavailable');

    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/leaf.webp');
  });
});
