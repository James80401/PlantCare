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
