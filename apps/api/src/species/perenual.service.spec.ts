import { PerenualService } from './perenual.service';

function makeService() {
  const species = [
    { id: 's1', commonName: 'Aloe', scientificName: 'Aloe vera', wateringFreqDays: 14, petSafe: false },
    { id: 's2', commonName: 'Basil', scientificName: 'Ocimum', wateringFreqDays: 3, petSafe: true },
  ];
  const prisma = {
    plantSpecies: {
      findMany: jest.fn().mockResolvedValue(species),
      findUnique: jest.fn((args: { where: { id: string } }) =>
        Promise.resolve(species.find((s) => s.id === args.where.id) ?? null),
      ),
      count: jest.fn().mockResolvedValue(species.length),
      upsert: jest.fn().mockResolvedValue({ id: 's3', commonName: 'New', perenualId: 7 }),
    },
  };
  const config = { get: jest.fn(() => undefined) };
  const service = new PerenualService(config as never, prisma as never);
  return { service, prisma };
}

describe('PerenualService catalog caching', () => {
  it('serves the no-query filtered browse from one cached catalog read', async () => {
    const { service, prisma } = makeService();

    await service.browse('', { petSafe: true }, 1, 24, 'name');
    await service.browse('', { petSafe: true }, 1, 24, 'name');
    await service.browse('', { edible: true }, 1, 24, 'name');

    // Three filtered browses, but only ONE findMany hit the DB (rest cached).
    expect(prisma.plantSpecies.findMany).toHaveBeenCalledTimes(1);
  });

  it('caches getOrFetchById per id', async () => {
    const { service, prisma } = makeService();

    await service.getOrFetchById('s1');
    await service.getOrFetchById('s1');
    await service.getOrFetchById('s2');

    // s1 fetched once (second call cached), s2 once → 2 DB reads total.
    expect(prisma.plantSpecies.findUnique).toHaveBeenCalledTimes(2);
  });

  it('invalidates caches after an upsert so fresh rows are read', async () => {
    const { service, prisma } = makeService();

    await service.browse('', { petSafe: true }, 1, 24, 'name'); // populates cache (1 read)
    await (service as unknown as { upsertFromApi: (i: unknown) => Promise<unknown> }).upsertFromApi({
      id: 7,
      common_name: 'New Plant',
    });
    await service.browse('', { petSafe: true }, 1, 24, 'name'); // cache cleared → reads again

    expect(prisma.plantSpecies.findMany).toHaveBeenCalledTimes(2);
  });
});
