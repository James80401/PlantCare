import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiagnosisChatService } from './diagnosis-chat.service';
import { OpenAiRequestError } from './openai-errors';

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
          gardenId: 'garden-1',
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
      recommendation: {
        upsert: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      },
    };
    const recommendations = {
      createDrPlantRecommendation: jest.fn().mockResolvedValue({ id: 'rec-1' }),
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
        completeCall: jest.fn().mockResolvedValue(undefined),
      } as never,
      recommendations as never,
    );

    return { service, prisma, recommendations };
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

  it('returns explicit Dr. Plant action drafts from a chat reply', async () => {
    const { service } = createService([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Flush the soil if you see mineral crust. Check soil moisture today.',
      },
    ]);

    const result = await service.getActionDraftsFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });

    expect(result.drafts.map((draft) => draft.key)).toEqual(
      expect.arrayContaining([
        'recommendation:plant-check-in',
        'recommendation:flush-soil',
      ]),
    );
    expect(result.drafts.some((draft) => draft.kind === 'task')).toBe(true);
  });

  it('confirms a Dr. Plant recommendation draft explicitly', async () => {
    const { service, recommendations } = createService([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Flush the soil if you see mineral crust.',
      },
    ]);

    await service.confirmRecommendationDraft('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
      draftKey: 'recommendation:flush-soil',
    });

    expect(recommendations.createDrPlantRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        plantId: 'plant-1',
        gardenId: 'garden-1',
        sourceKey: 'dr-plant:conv-1:recommendation:flush-soil',
        title: 'Consider a soil flush for Snake Plant',
      }),
    );
  });

  it('confirms a Dr. Plant task draft explicitly', async () => {
    const { service, prisma } = createService([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Check soil moisture today.',
      },
    ]);
    const { drafts } = await service.getActionDraftsFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });
    const taskDraft = drafts.find((draft) => draft.kind === 'task');

    await service.confirmTaskDraft('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
      draftKey: taskDraft!.key,
    });

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          gardenId: 'garden-1',
          taskType: 'CHECK_MOISTURE',
        }),
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: expect.stringContaining('Dr. Plant task added'),
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

describe('DiagnosisChatService delivery truth', () => {
  function createDeliveryService(
    options: {
      providerError?: OpenAiRequestError;
      cachedMessages?: Array<Record<string, unknown>>;
    } = {},
  ) {
    const createdMessages: Array<Record<string, unknown>> = [];
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'plant-1',
          userId: 'user-1',
          garden: null,
          shares: [],
          nickname: 'Fern',
          location: 'Office',
          potSize: 'MEDIUM',
          species: {
            commonName: 'Fern',
            scientificName: 'Nephrolepis exaltata',
            wateringFreqDays: 7,
            sunlight: 'Indirect',
            toxicity: null,
            careNotes: null,
          },
        }),
      },
      diagnosisConversation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          plantId: 'plant-1',
          userId: 'user-1',
          messages: [],
        }),
        update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      },
      diagnosisMessage: {
        findMany: jest.fn().mockResolvedValue(options.cachedMessages ?? []),
        create: jest.fn(({ data }) => {
          const message = {
            id: `message-${createdMessages.length + 1}`,
            createdAt: new Date(),
            imageUrl: null,
            source: null,
            ...data,
          };
          createdMessages.push(message);
          return Promise.resolve(message);
        }),
      },
      journalEntry: { findMany: jest.fn().mockResolvedValue([]) },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      taskFeedback: { findMany: jest.fn().mockResolvedValue([]) },
      diagnosis: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'diagnosis-1' }),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof prisma) => unknown) => callback(prisma),
    );
    const llm = {
      isAvailable: jest.fn().mockReturnValue(true),
      getModelName: jest.fn().mockReturnValue('test-model'),
      chat: options.providerError
        ? jest.fn().mockRejectedValue(options.providerError)
        : jest.fn().mockResolvedValue('Use steady moisture and indirect light.'),
    };
    const aiUsage = {
      assertPlantIntentOrThrow: jest.fn().mockResolvedValue(undefined),
      reserveCall: jest.fn().mockResolvedValue('usage-1'),
      completeCall: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DiagnosisChatService(
      prisma as never,
      llm as never,
      {
        saveFile: jest.fn(),
        deleteByUrl: jest.fn(),
        getUploadDir: jest.fn(),
      } as never,
      {
        getAdviceStatus: jest.fn().mockResolvedValue({
          cachedAdvice: null,
          locationLabel: null,
        }),
      } as never,
      { assertImageAllowed: jest.fn() } as never,
      aiUsage as never,
      {} as never,
    );
    return { service, prisma, llm, aiUsage };
  }

  it('persists the exchange only after a successful provider result', async () => {
    const { service, prisma, aiUsage } = createDeliveryService();

    const result = await service.sendMessage(
      'user-1',
      'plant-1',
      'conv-1',
      'Why are the fronds brown?',
      undefined,
      '21bb0dac-0ce4-4fae-aaeb-4bcb03255f34',
    );

    expect(result.source).toBe('openai');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(aiUsage.completeCall).toHaveBeenCalledWith('usage-1', 'SUCCEEDED');
  });

  it('preserves a provider rate-limit error and writes no messages', async () => {
    const { service, prisma, aiUsage } = createDeliveryService({
      providerError: new OpenAiRequestError(
        'OpenAI rate limit hit.',
        'rate_limited',
        429,
      ),
    });

    await expect(
      service.sendMessage(
        'user-1',
        'plant-1',
        'conv-1',
        'Why are the fronds brown?',
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_PROVIDER_RATE_LIMITED' }),
    });
    expect(prisma.diagnosisMessage.create).not.toHaveBeenCalled();
    expect(aiUsage.completeCall).toHaveBeenCalledWith(
      'usage-1',
      'FAILED',
      'rate_limited',
    );
  });

  it('returns an existing exchange for a repeated request key', async () => {
    const cachedMessages = [
      {
        id: 'user-message',
        role: 'user',
        content: 'Why are the fronds brown?',
        source: null,
      },
      {
        id: 'assistant-message',
        role: 'assistant',
        content: 'Check humidity.',
        source: 'openai',
      },
    ];
    const { service, prisma, llm } = createDeliveryService({ cachedMessages });

    const result = await service.sendMessage(
      'user-1',
      'plant-1',
      'conv-1',
      'Why are the fronds brown?',
      undefined,
      '21bb0dac-0ce4-4fae-aaeb-4bcb03255f34',
    );

    expect(result.userMessage.id).toBe('user-message');
    expect(llm.chat).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
