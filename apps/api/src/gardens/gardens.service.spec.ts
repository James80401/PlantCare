import { GardensService } from './gardens.service';

describe('GardensService.getSummaries', () => {
  function makeService(opts: {
    gardens: Array<{ id: string; name: string; location: string | null; ownerId: string; homePlants: number; members: number }>;
    dueToday?: Array<{ gardenId: string; n: number }>;
    overdue?: Array<{ gardenId: string; n: number }>;
    alerts?: Array<{ gardenId: string; n: number }>;
  }) {
    const grouped = (rows: Array<{ gardenId: string; n: number }> = []) =>
      rows.map((r) => ({ gardenId: r.gardenId, _count: { _all: r.n } }));

    const prisma = {
      garden: {
        findMany: jest.fn().mockResolvedValue(
          opts.gardens.map((g) => ({
            id: g.id,
            name: g.name,
            location: g.location,
            ownerId: g.ownerId,
            _count: { homePlants: g.homePlants, members: g.members },
          })),
        ),
      },
      task: {
        groupBy: jest
          .fn()
          .mockResolvedValueOnce(grouped(opts.dueToday))
          .mockResolvedValueOnce(grouped(opts.overdue)),
      },
      plant: {
        groupBy: jest.fn().mockResolvedValue(grouped(opts.alerts)),
      },
    };
    const service = new GardensService(prisma as never, {} as never);
    return { service, prisma };
  }

  it('returns an empty array when the user has no gardens', async () => {
    const { service, prisma } = makeService({ gardens: [] });
    expect(await service.getSummaries('u1')).toEqual([]);
    // No aggregate queries when there are no gardens.
    expect(prisma.task.groupBy).not.toHaveBeenCalled();
  });

  it('maps per-garden counts, ownership, and derives status', async () => {
    const { service } = makeService({
      gardens: [
        { id: 'g1', name: 'Living Room', location: 'South window', ownerId: 'u1', homePlants: 3, members: 2 },
        { id: 'g2', name: 'Balcony', location: null, ownerId: 'other', homePlants: 0, members: 1 },
      ],
      dueToday: [{ gardenId: 'g1', n: 2 }],
      overdue: [{ gardenId: 'g1', n: 1 }],
      alerts: [{ gardenId: 'g1', n: 1 }],
    });

    const [g1, g2] = await service.getSummaries('u1');

    expect(g1).toMatchObject({
      id: 'g1',
      name: 'Living Room',
      location: 'South window',
      isOwner: true,
      plantCount: 3,
      memberCount: 2,
      tasksDueToday: 2,
      overdue: 1,
      urgentAlerts: 1,
      status: 'Needs attention', // urgent alerts win
    });
    expect(g2).toMatchObject({
      id: 'g2',
      isOwner: false, // owned by someone else → shared with me
      plantCount: 0,
      tasksDueToday: 0,
      overdue: 0,
      urgentAlerts: 0,
      status: 'No plants yet',
    });
  });

  it('derives "Care due today" when only today tasks exist', async () => {
    const { service } = makeService({
      gardens: [{ id: 'g1', name: 'G', location: null, ownerId: 'u1', homePlants: 4, members: 1 }],
      dueToday: [{ gardenId: 'g1', n: 3 }],
    });
    const [g1] = await service.getSummaries('u1');
    expect(g1.status).toBe('Care due today');
  });
});

describe('GardensService.getDetail', () => {
  function makeService() {
    const now = new Date();
    const overdueDate = new Date(now.getTime() - 2 * 86_400_000);
    const todayAt = new Date(now);
    todayAt.setHours(23, 0, 0, 0); // later today
    const in3days = new Date(now.getTime() + 3 * 86_400_000);

    const prisma = {
      gardenMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      garden: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          name: 'Living Room',
          location: 'South window',
          ownerId: 'u1',
          members: [{ user: { id: 'u1', name: 'Me', email: 'me@x.com' } }],
          homePlants: [
            { id: 'p1', nickname: 'Snake', imageUrl: null, location: 'Window', species: { commonName: 'Snake Plant', scientificName: 'S. t.' }, diagnoses: [{ id: 'd1' }] },
            { id: 'p2', nickname: 'Pothos', imageUrl: null, location: 'Shelf', species: { commonName: 'Pothos', scientificName: 'E. a.' }, diagnoses: [] },
          ],
        }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([
          { id: 't-overdue', taskType: 'WATER', dueDate: overdueDate, status: 'PENDING', completedAt: null, plant: { id: 'p1', nickname: 'Snake', imageUrl: null, species: { commonName: 'Snake Plant' } } },
          { id: 't-today', taskType: 'MIST', dueDate: todayAt, status: 'PENDING', completedAt: null, plant: { id: 'p1', nickname: 'Snake', imageUrl: null, species: { commonName: 'Snake Plant' } } },
          { id: 't-upcoming', taskType: 'WATER', dueDate: in3days, status: 'PENDING', completedAt: null, plant: { id: 'p2', nickname: 'Pothos', imageUrl: null, species: { commonName: 'Pothos' } } },
        ]),
      },
      journalEntry: {
        count: jest.fn().mockResolvedValue(5),
      },
    };
    const service = new GardensService(prisma as never, {} as never);
    return { service, prisma, overdueDate };
  }

  it('returns task buckets, next watering, notes count, and per-plant next task', async () => {
    const { service, overdueDate } = makeService();
    const detail = await service.getDetail('u1', 'g1');

    expect(detail.taskSummary).toEqual({ dueToday: 1, overdue: 1, upcoming: 1 });
    // Earliest WATER task is the overdue one.
    expect(detail.nextWatering).toBe(overdueDate.toISOString());
    expect(detail.notesCount).toBe(5);
    expect(detail.tasks).toHaveLength(3);

    const snake = detail.plants.find((p) => p.id === 'p1')!;
    expect(snake.needsAttention).toBe(true); // unresolved diagnosis
    expect(snake.nextTask?.taskType).toBe('WATER'); // its earliest pending task
    const pothos = detail.plants.find((p) => p.id === 'p2')!;
    expect(pothos.needsAttention).toBe(false);
  });

  it('blocks a non-member from viewing a garden', async () => {
    const { service, prisma } = makeService();
    prisma.gardenMember.findUnique.mockResolvedValue(null);
    await expect(service.getDetail('intruder', 'g1')).rejects.toMatchObject({ status: 403 });
  });
});
