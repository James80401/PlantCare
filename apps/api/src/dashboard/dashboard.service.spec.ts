import { DashboardService } from './dashboard.service';
import {
  buildDashboardPlantFixture,
  DASHBOARD_FIXTURE_SIZES,
} from './dashboard-performance.fixture';

describe('DashboardService', () => {
  const userId = 'user-1';
  const now = new Date('2026-06-03T12:00:00.000Z');

  function createService() {
    const writeOperation = jest.fn();
    const user = { name: 'Maya Green' };
    const plants = [
      {
        id: 'plant-1',
        nickname: 'Monsty',
        imageUrl: '/uploads/monsty.jpg',
        createdAt: new Date('2026-01-10T12:00:00.000Z'),
        location: 'Living room',
        species: {
          commonName: 'Monstera',
          scientificName: 'Monstera deliciosa',
          sunlight: 'bright indirect',
          wateringFreqDays: 7,
        },
        tasks: [
          {
            dueDate: new Date('2026-06-02T09:00:00.000Z'),
            taskType: 'WATER',
            status: 'PENDING',
          },
        ],
        diagnoses: [],
      },
      {
        id: 'plant-2',
        nickname: null,
        imageUrl: null,
        createdAt: new Date('2026-03-01T12:00:00.000Z'),
        location: 'Patio',
        species: {
          commonName: 'Basil',
          scientificName: 'Ocimum basilicum',
          sunlight: 'full sun',
          wateringFreqDays: 3,
        },
        tasks: [
          {
            dueDate: new Date('2026-06-03T09:00:00.000Z'),
            taskType: 'PRUNE',
            status: 'PENDING',
          },
        ],
        diagnoses: [
          {
            resultLabel: 'Leaf scorch',
            createdAt: new Date('2026-06-02T12:00:00.000Z'),
          },
        ],
      },
    ];
    const tasks = [
      {
        id: 'task-overdue',
        taskType: 'WATER',
        dueDate: new Date('2026-06-02T09:00:00.000Z'),
        status: 'PENDING',
        completedAt: null,
        plant: {
          id: 'plant-1',
          nickname: 'Monsty',
          imageUrl: '/uploads/monsty.jpg',
          species: { commonName: 'Monstera' },
        },
      },
      {
        id: 'task-today',
        taskType: 'PRUNE',
        dueDate: new Date('2026-06-03T09:00:00.000Z'),
        status: 'PENDING',
        completedAt: null,
        plant: {
          id: 'plant-2',
          nickname: null,
          imageUrl: null,
          species: { commonName: 'Basil' },
        },
      },
      {
        id: 'task-done',
        taskType: 'FERTILIZE',
        dueDate: new Date('2026-06-01T09:00:00.000Z'),
        status: 'DONE',
        completedAt: new Date('2026-06-03T10:00:00.000Z'),
        plant: {
          id: 'plant-1',
          nickname: 'Monsty',
          imageUrl: '/uploads/monsty.jpg',
          species: { commonName: 'Monstera' },
        },
      },
    ];
    const gardens = [
      {
        id: 'garden-owned',
        name: 'My Garden',
        ownerId: userId,
        members: [{ userId, role: 'OWNER' }],
        plants: [],
      },
      {
        id: 'garden-shared',
        name: 'Neighbor Patio',
        ownerId: 'neighbor',
        members: [{ userId, role: 'VIEWER' }],
        plants: [
          {
            canComplete: false,
            plant: {
              id: 'shared-plant',
              userId: 'neighbor',
              nickname: 'Shared fern',
              imageUrl: null,
              createdAt: new Date('2026-02-01T12:00:00.000Z'),
              location: 'Porch',
              species: {
                commonName: 'Fern',
                scientificName: null,
                sunlight: 'shade',
                wateringFreqDays: 5,
                defaultImageUrl: '/care-guides/photos/fern.jpg',
              },
            },
          },
        ],
      },
    ];
    const unresolvedDiagnoses = [
      {
        plantId: 'plant-2',
        resultLabel: 'Leaf scorch',
        createdAt: new Date('2026-06-02T12:00:00.000Z'),
      },
    ];
    const recentJournalEntries = [
      {
        id: 'journal-1',
        plantId: 'plant-1',
        photoUrl: '/uploads/journal.jpg',
        notes: 'New leaf opened after watering.',
        heightCm: 42,
        widthCm: null,
        leafCount: 8,
        createdAt: new Date('2026-06-02T14:00:00.000Z'),
        plant: {
          nickname: 'Monsty',
          species: { commonName: 'Monstera' },
        },
      },
    ];
    const recentDiagnoses = [
      {
        id: 'diagnosis-1',
        plantId: 'plant-2',
        resultLabel: 'Leaf scorch',
        confidence: 0.82,
        resolved: false,
        createdAt: new Date('2026-06-02T12:00:00.000Z'),
        plant: {
          nickname: null,
          species: { commonName: 'Basil' },
        },
      },
      {
        id: 'diagnosis-2',
        plantId: 'plant-1',
        resultLabel: 'Recovered',
        confidence: 0.91,
        resolved: true,
        createdAt: new Date('2026-05-31T12:00:00.000Z'),
        plant: {
          nickname: 'Monsty',
          species: { commonName: 'Monstera' },
        },
      },
    ];

    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
      plant: {
        findMany: jest.fn().mockResolvedValue(plants),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
      garden: {
        findMany: jest.fn().mockResolvedValue(gardens),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
      task: {
        findMany: jest.fn().mockResolvedValue(tasks),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
      diagnosis: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(unresolvedDiagnoses)
          .mockResolvedValueOnce(recentDiagnoses),
        count: jest.fn().mockResolvedValue(2),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
      journalEntry: {
        findMany: jest.fn().mockResolvedValue(recentJournalEntries),
        create: writeOperation,
        update: writeOperation,
        delete: writeOperation,
      },
    };
    const scheduler = {
      autoPostponeOutdoorWateringFromWeather: jest.fn().mockResolvedValue(undefined),
      getScheduleSuggestionsForUser: jest
        .fn()
        .mockResolvedValue([{ id: 'suggestion-1', plantId: 'plant-2' }]),
    };
    const weather = {
      getAdviceStatus: jest.fn().mockResolvedValue({
        hasLocation: true,
        locationLabel: 'Denver',
        canFetchToday: false,
        cachedAdvice: {
          locationLabel: 'Denver',
          overviewAlerts: [{ title: 'Hot afternoon', severity: 'warning' }],
          plants: [{ advice: 'Water patio herbs early.' }],
        },
      }),
    };
    const plantMilestones = {
      syncEngagementForUser: jest.fn(),
      listForUser: jest.fn().mockResolvedValue([
        { id: 'first_plant', title: 'First plant', unlocked: true },
      ]),
    };
    const recommendations = {
      refreshForUser: jest.fn(),
      listForUser: jest.fn().mockResolvedValue([
        { id: 'rec-1', title: 'Check in on Monsty', priority: 'MEDIUM' },
      ]),
    };
    const gardenSummaries = [
      {
        id: 'garden-owned',
        name: 'My Garden',
        location: 'Indoor',
        isOwner: true,
        plantCount: 2,
        memberCount: 1,
        tasksDueToday: 1,
        overdue: 1,
        urgentAlerts: 1,
        status: 'Needs attention',
      },
    ];
    const gardensService = {
      getSummaries: jest.fn().mockResolvedValue(gardenSummaries),
    };
    const service = new DashboardService(
      prisma as never,
      scheduler as never,
      weather as never,
      plantMilestones as never,
      recommendations as never,
      gardensService as never,
    );

    return {
      service,
      prisma,
      scheduler,
      weather,
      plantMilestones,
      recommendations,
      gardensService,
      writeOperation,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the current dashboard contract for the garden home screen', async () => {
    const { service, scheduler, plantMilestones } = createService();

    const result = await service.getDashboard(userId);

    expect(scheduler.autoPostponeOutdoorWateringFromWeather).not.toHaveBeenCalled();
    expect(Object.keys(result).sort()).toEqual([
      'attention',
      'attentionSummary',
      'careSummary',
      'engagement',
      'gardenSummaries',
      'greeting',
      'healthStory',
      'metrics',
      'pendingTasks',
      'plants',
      'recommendations',
      'scheduleSuggestions',
      'sharedPlants',
      'todayTasks',
      'weather',
      'weekPreview',
      'weekSummary',
    ]);
    expect(result.greeting).toMatchObject({
      name: 'Maya',
      dateLabel: 'Wednesday, Jun 3',
      statusLine: '1 overdue · 1 due today · 2 plants',
    });
    expect(result.metrics).toMatchObject({
      totalPlants: 2,
      dueToday: 1,
      overdue: 1,
      completedToday: 1,
      gardenScore: 90,
    });
    expect(result.careSummary).toEqual({
      status: 'overdue',
      headline: 'Catch up gently',
      body: 'Monsty has one overdue care task.',
      actionLabel: 'Review overdue care',
      actionTo: '/garden/tasks/overdue',
      focusPlantId: 'plant-1',
      focusPlantName: 'Monsty',
      counts: {
        overdue: 1,
        dueToday: 1,
        completedToday: 1,
        pending: 2,
        openDiagnoses: 2,
      },
    });
    expect(result.todayTasks.map((task) => task.id)).toEqual(['task-overdue', 'task-today']);
    expect(result.pendingTasks.map((task) => task.id)).toEqual(['task-overdue', 'task-today']);
    expect(result.recommendations).toEqual([
      { id: 'rec-1', title: 'Check in on Monsty', priority: 'MEDIUM' },
    ]);
    expect(result.gardenSummaries).toHaveLength(1);
    expect(result.weekPreview).toHaveLength(7);
    expect(result.weekPreview[0]).toMatchObject({ label: 'Today', count: 1 });
    expect(result.weekSummary).toEqual({
      status: 'light',
      headline: 'Light care week',
      body: '1 task scheduled across 1 day.',
      actionLabel: 'Open calendar',
      actionTo: '/garden/calendar',
      busiestDay: {
        date: '2026-06-03',
        label: 'Today',
        dateLabel: 'Jun 3',
        count: 1,
      },
      counts: {
        totalTasks: 1,
        activeDays: 1,
        busiestDayCount: 1,
      },
    });
    expect(result.attention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plantId: 'plant-1',
          reason: '1 overdue task',
          priority: 'urgent',
        }),
        expect.objectContaining({
          plantId: 'plant-2',
          reason: '1 task due today',
          priority: 'warning',
        }),
      ]),
    );
    expect(result.attentionSummary).toEqual({
      status: 'urgent',
      headline: 'Needs attention',
      body: '1 plant has overdue care.',
      counts: {
        urgent: 1,
        warning: 1,
        info: 0,
        needsAttention: 2,
        total: 2,
      },
    });
    expect(result.healthStory).toMatchObject({
      openDiagnosisCount: 2,
      recentJournal: [
        expect.objectContaining({
          id: 'journal-1',
          plantName: 'Monsty',
          measurements: expect.objectContaining({ heightCm: 42 }),
        }),
      ],
      recentDiagnoses: [
        expect.objectContaining({
          id: 'diagnosis-1',
          plantName: 'Basil',
          resolved: false,
        }),
        expect.objectContaining({
          id: 'diagnosis-2',
          plantName: 'Monsty',
          resolved: true,
        }),
      ],
      recoveryPlants: [
        expect.objectContaining({
          diagnosisId: 'diagnosis-1',
          actionTo: '/garden/plants/plant-2/health#dr-plant',
        }),
      ],
    });
    expect(result.sharedPlants).toEqual([
      expect.objectContaining({
        id: 'shared-plant',
        shared: true,
        gardenName: 'Neighbor Patio',
        imageUrl: '/care-guides/photos/fern.jpg',
      }),
    ]);
    expect(result.weather).toEqual({
      hasLocation: true,
      locationLabel: 'Denver',
      canFetchToday: false,
      cachedSummary: 'Denver: Hot afternoon — Water patio herbs early.',
    });
    expect(result.engagement).toMatchObject({
      score: 90,
      streak: 1,
      completedInRange: 1,
      milestones: [{ id: 'first_plant', title: 'First plant', unlocked: true }],
    });
    expect(plantMilestones.listForUser).toHaveBeenCalledWith(userId, {
      plantCount: 2,
      plantCreatedAts: [new Date('2026-01-10T12:00:00.000Z'), new Date('2026-03-01T12:00:00.000Z')],
      completedInRange: 1,
      streak: 1,
    });
  });

  it('uses explicit date windows for task queries', async () => {
    const { service, prisma } = createService();
    const from = '2026-06-01T00:00:00.000Z';
    const to = '2026-06-10T23:59:59.000Z';

    await service.getDashboard(userId, from, to);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          plant: { userId },
          dueDate: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
      }),
    );
    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(prisma.diagnosis.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('keeps dashboard reads bounded and free of mutation queries', async () => {
    const {
      service,
      prisma,
      scheduler,
      plantMilestones,
      recommendations,
      writeOperation,
    } = createService();

    await service.getDashboard(userId);

    expect(prisma.plant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        select: expect.objectContaining({
          id: true,
          species: expect.any(Object),
          tasks: expect.objectContaining({ take: 1 }),
          diagnoses: expect.objectContaining({ take: 1 }),
        }),
      }),
    );
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500, select: expect.any(Object) }),
    );
    expect(recommendations.listForUser).toHaveBeenCalledWith(userId, { now });
    expect(recommendations.refreshForUser).not.toHaveBeenCalled();
    expect(plantMilestones.syncEngagementForUser).not.toHaveBeenCalled();
    expect(scheduler.autoPostponeOutdoorWateringFromWeather).not.toHaveBeenCalled();
    expect(writeOperation).not.toHaveBeenCalled();
  });

  it.each(DASHBOARD_FIXTURE_SIZES)(
    'keeps the %i-plant fixture contract within its response budget',
    async (plantCount) => {
      const { service, prisma } = createService();
      prisma.plant.findMany.mockResolvedValueOnce(buildDashboardPlantFixture(plantCount));

      const result = await service.getDashboard(userId);
      const responseBytes = Buffer.byteLength(JSON.stringify(result));

      expect(result.plants).toHaveLength(plantCount);
      if (plantCount === 100) expect(responseBytes).toBeLessThanOrEqual(250 * 1024);
    },
  );

  it('summarizes a calm garden without task or diagnosis focus', async () => {
    const { service, prisma } = createService();
    prisma.task.findMany.mockResolvedValueOnce([]);
    prisma.diagnosis.findMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.diagnosis.count.mockResolvedValueOnce(0);

    const result = await service.getDashboard(userId);

    expect(result.careSummary).toMatchObject({
      status: 'calm',
      headline: "You're all caught up",
      actionLabel: 'Review plants',
      actionTo: '/garden#plants',
      counts: {
        overdue: 0,
        dueToday: 0,
        completedToday: 0,
        pending: 0,
        openDiagnoses: 0,
      },
    });
    expect(result.attentionSummary).toMatchObject({
      status: 'info',
      headline: 'A few ways to make this smarter',
      counts: {
        urgent: 0,
        warning: 0,
        info: 1,
        needsAttention: 0,
        total: 1,
      },
    });
    expect(result.healthStory.openDiagnosisCount).toBe(0);
    expect(result.todayTasks).toEqual([]);
    expect(result.weekSummary).toEqual({
      status: 'calm',
      headline: 'Quiet week ahead',
      body: 'No care tasks are scheduled for the next seven days.',
      actionLabel: 'Review calendar',
      actionTo: '/garden/calendar',
      busiestDay: null,
      counts: {
        totalTasks: 0,
        activeDays: 0,
        busiestDayCount: 0,
      },
    });
  });
});
