import {
  mapDashboardDiagnosisSummary,
  mapDashboardJournalEntry,
  mapDashboardPlant,
  mapDashboardRecoveryPlant,
  mapDashboardTask,
  mapSharedPlantsForUser,
} from './dashboard.mapper';

describe('dashboard.mapper', () => {
  it('maps tasks to ISO strings', () => {
    const row = mapDashboardTask({
      id: 't1',
      taskType: 'WATER',
      dueDate: new Date('2026-05-27T12:00:00.000Z'),
      status: 'PENDING',
      completedAt: null,
      plant: {
        id: 'p1',
        nickname: 'Fern',
        imageUrl: null,
        species: { commonName: 'Boston Fern' },
      },
    });
    expect(row.dueDate).toBe('2026-05-27T12:00:00.000Z');
    expect(row.plant.nickname).toBe('Fern');
  });

  it('maps plant with next task and diagnosis', () => {
    const row = mapDashboardPlant({
      id: 'p1',
      nickname: null,
      imageUrl: '/img.jpg',
      createdAt: new Date('2026-01-01'),
      location: 'Kitchen',
      species: {
        commonName: 'Monstera',
        scientificName: 'Monstera deliciosa',
        sunlight: 'bright indirect',
        wateringFreqDays: 7,
      },
      tasks: [{ dueDate: new Date('2026-05-28'), taskType: 'WATER', status: 'PENDING' }],
      diagnoses: [{ resultLabel: 'Overwatering', createdAt: new Date('2026-05-20') }],
    });
    expect(row.tasks).toHaveLength(1);
    expect(row.unresolvedDiagnosis?.resultLabel).toBe('Overwatering');
  });

  it('maps shared plants for non-owner members', () => {
    const shared = mapSharedPlantsForUser(
      [
        {
          id: 'g1',
          name: 'Home',
          ownerId: 'owner',
          members: [{ userId: 'viewer', role: 'VIEWER' }],
          plants: [
            {
              canComplete: false,
              plant: {
                id: 'p2',
                userId: 'owner',
                nickname: 'Shared fern',
                imageUrl: null,
                createdAt: new Date(),
                location: null,
                species: {
                  commonName: 'Fern',
                  scientificName: null,
                  sunlight: null,
                  wateringFreqDays: 5,
                  defaultImageUrl: '/default.png',
                },
              },
            },
          ],
        },
      ],
      'viewer',
    );
    expect(shared).toHaveLength(1);
    expect(shared[0].shared).toBe(true);
    expect(shared[0].imageUrl).toBe('/default.png');
    expect(shared[0].gardenName).toBe('Home');
  });

  it('maps recent journal entries with plant display names and previews', () => {
    const row = mapDashboardJournalEntry({
      id: 'j1',
      plantId: 'p1',
      photoUrl: '/journal.jpg',
      notes: 'New leaf is opening after the last watering.',
      heightCm: 24,
      widthCm: null,
      leafCount: 8,
      createdAt: new Date('2026-06-01T12:00:00.000Z'),
      plant: {
        nickname: 'Marley',
        species: { commonName: 'Monstera' },
      },
    });

    expect(row.plantName).toBe('Marley');
    expect(row.notePreview).toContain('New leaf');
    expect(row.measurements.heightCm).toBe(24);
  });

  it('maps diagnosis summaries and recovery links', () => {
    const diagnosis = {
      id: 'd1',
      plantId: 'p1',
      resultLabel: 'Leaf scorch',
      confidence: 0.7,
      resolved: false,
      createdAt: new Date('2026-06-01T12:00:00.000Z'),
      plant: {
        nickname: null,
        species: { commonName: 'Basil' },
      },
    };

    const summary = mapDashboardDiagnosisSummary(diagnosis);
    const recovery = mapDashboardRecoveryPlant(diagnosis);

    expect(summary.plantName).toBe('Basil');
    expect(summary.confidence).toBe(0.7);
    expect(recovery.actionTo).toBe('/garden/plants/p1/health#dr-plant');
  });
});
