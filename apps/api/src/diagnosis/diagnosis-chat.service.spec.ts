import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiagnosisChatService } from './diagnosis-chat.service';

describe('DiagnosisChatService actions', () => {
  function createService(
    messages: unknown[] = [{ id: 'msg-1', role: 'assistant', content: 'Check soil moisture.' }],
    plantOverrides: Record<string, unknown> = {},
  ) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'plant-1',
          userId: 'user-1',
          garden: null,
          shares: [],
          location: 'Living room',
          potSize: 'MEDIUM',
          species: { commonName: 'Snake Plant', wateringFreqDays: 14 },
          ...plantOverrides,
        }),
        findUnique: jest.fn().mockResolvedValue({ gardenId: 'garden-1' }),
      },
      diagnosis: {
        findFirst: jest.fn().mockResolvedValue({ id: 'diagnosis-1' }),
        create: jest.fn().mockResolvedValue({ id: 'diagnosis-1' }),
      },
      diagnosisConversation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          plantId: 'plant-1',
          userId: 'user-1',
          title: 'Yellow leaves',
          createdAt: new Date('2026-06-01T12:00:00.000Z'),
          messages,
        }),
      },
      journalEntry: {
        create: jest.fn().mockResolvedValue({ id: 'journal-1' }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'task-1',
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
        }),
      },
    };

    const service = new DiagnosisChatService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      { assertImageAllowed: jest.fn().mockResolvedValue(null) } as never,
      {
        assertPlantIntentOrThrow: jest.fn().mockResolvedValue(undefined),
        reserveCall: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    return { service, prisma };
  }

  it('saves an assistant reply to the journal', async () => {
    const { service, prisma } = createService();

    await service.saveAssistantReplyToJournal('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });

    expect(prisma.diagnosisConversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conv-1', plantId: 'plant-1', userId: 'user-1' },
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: {
        plantId: 'plant-1',
        notes: 'Dr. Plant note:\n\nCheck soil moisture.',
      },
    });
  });

  it('schedules a health check and logs the chat context', async () => {
    const { service, prisma } = createService();

    const result = await service.scheduleHealthCheckFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
      dueInDays: 5,
    });

    expect(result.taskType).toBe('HEALTH_CHECK');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
        }),
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: {
        plantId: 'plant-1',
        notes: 'Dr. Plant health check scheduled in 5 days:\n\nCheck soil moisture.',
      },
    });
  });

  it('rejects actions outside the user conversation', async () => {
    const { service, prisma } = createService();
    prisma.diagnosisConversation.findFirst.mockResolvedValue(null);

    await expect(
      service.saveAssistantReplyToJournal('user-1', 'plant-1', 'missing', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires an assistant reply or explicit note', async () => {
    const { service } = createService([{ id: 'msg-1', role: 'user', content: 'Hello' }]);

    await expect(
      service.saveAssistantReplyToJournal('user-1', 'plant-1', 'conv-1', {
        messageId: 'msg-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns guided missing-context questions for a thread', async () => {
    const { service } = createService([
      {
        id: 'msg-1',
        role: 'user',
        content: 'The leaves are yellow and drooping.',
        imageUrl: null,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Let us narrow this down.',
        imageUrl: null,
      },
    ]);

    const result = await service.getGuidedContextQuestions('user-1', 'plant-1', 'conv-1');

    expect(result.title).toBe('Missing context check');
    expect(result.summary).toContain('Snake Plant');
    expect(result.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining([
        'symptom_duration',
        'soil_moisture',
        'recent_change',
        'pests_visible',
        'photo_needed',
        'main_goal',
      ]),
    );
  });

  it('does not ask for a photo when the thread already has one', async () => {
    const { service } = createService([
      {
        id: 'msg-1',
        role: 'user',
        content: 'The leaves started yellowing two days ago after watering.',
        imageUrl: '/uploads/plant.jpg',
      },
    ]);

    const result = await service.getGuidedContextQuestions('user-1', 'plant-1', 'conv-1');

    expect(result.questions.map((question) => question.id)).not.toContain('photo_needed');
  });

  it('returns recovery task suggestions from a chat reply', async () => {
    const { service, prisma } = createService([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Check soil moisture today.\nClean each leaf tomorrow.',
      },
    ]);

    const result = await service.getRecoverySuggestionsFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });

    expect(result.diagnosisId).toBe('diagnosis-1');
    expect(result.suggestions.map((suggestion) => suggestion.taskType)).toEqual(
      expect.arrayContaining(['CHECK_MOISTURE', 'CLEAN_LEAVES']),
    );
    expect(prisma.diagnosis.findFirst).toHaveBeenCalled();
  });

  it('applies selected recovery tasks from a chat reply', async () => {
    const { service, prisma } = createService([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Check soil moisture today.',
      },
    ]);
    const suggestions = await service.getRecoverySuggestionsFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });

    const result = await service.applyRecoveryTasksFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
      keys: [suggestions.suggestions[0].key],
    });

    expect(result).toHaveLength(1);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceDiagnosisId: 'diagnosis-1',
          taskType: 'CHECK_MOISTURE',
        }),
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: expect.stringContaining('Dr. Plant recovery plan'),
        }),
      }),
    );
  });

  describe('shared-garden plant access', () => {
    it('lets a caregiver with completion rights on a shared plant use Dr. Plant', async () => {
      const { service } = createService(undefined, {
        userId: 'owner',
        garden: null,
        shares: [
          {
            canComplete: true,
            canJournal: false,
            garden: { members: [{ userId: 'caregiver-1', role: 'CAREGIVER' }] },
          },
        ],
      });

      await expect(
        service.getGuidedContextQuestions('caregiver-1', 'plant-1', 'conv-1'),
      ).resolves.toBeDefined();
    });

    it('rejects a user with no relationship to the plant', async () => {
      const { service } = createService(undefined, {
        userId: 'owner',
        garden: null,
        shares: [],
      });

      await expect(
        service.getGuidedContextQuestions('stranger', 'plant-1', 'conv-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
