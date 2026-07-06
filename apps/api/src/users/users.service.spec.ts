import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService.resolveLocationFields', () => {
  const weather = { geocodeLocation: jest.fn() };
  const prisma = {} as never;
  const upload = {} as never;
  const config = { get: () => undefined } as never;
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma, upload, weather as never, config);
  });

  const resolve = (data: Parameters<UsersService['updateNotificationSettings']>[1]) =>
    (service as unknown as { resolveLocationFields: (d: typeof data) => Promise<unknown> })
      .resolveLocationFields(data);

  it('skips geocode when coordinates are already set (dropdown pick)', async () => {
    const result = await resolve({
      latitude: 37.5407,
      longitude: -77.436,
      locationLabel: 'Richmond, Virginia, United States',
      locationQuery: 'Richmond, Virginia, United States',
      timezone: 'America/New_York',
    });

    expect(weather.geocodeLocation).not.toHaveBeenCalled();
    expect(result).toEqual({
      latitude: 37.5407,
      longitude: -77.436,
      locationLabel: 'Richmond, Virginia, United States',
      timezone: 'America/New_York',
    });
  });

  it('geocodes when only a search query is provided', async () => {
    weather.geocodeLocation.mockResolvedValue({
      latitude: 37.5407,
      longitude: -77.436,
      label: 'Richmond, Virginia, United States',
      timezone: 'America/New_York',
    });

    const result = await resolve({
      locationQuery: 'Richmond',
      timezone: 'America/New_York',
    });

    expect(weather.geocodeLocation).toHaveBeenCalledWith('Richmond');
    expect(result).toMatchObject({
      latitude: 37.5407,
      longitude: -77.436,
      locationLabel: 'Richmond, Virginia, United States',
    });
  });

  it('throws when geocode returns no match', async () => {
    weather.geocodeLocation.mockResolvedValue(null);

    await expect(resolve({ locationQuery: 'zzznopeville' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('UsersService.exportData', () => {
  const upload = {} as never;
  const weather = {} as never;
  const config = { get: () => undefined } as never;

  const prisma = {
    user: { findUnique: jest.fn() },
    garden: { findMany: jest.fn().mockResolvedValue([]) },
    gardenMember: { findMany: jest.fn().mockResolvedValue([]) },
    plant: { findMany: jest.fn().mockResolvedValue([]) },
    recommendation: { findMany: jest.fn().mockResolvedValue([]) },
    communityPost: { findMany: jest.fn().mockResolvedValue([]) },
    comment: { findMany: jest.fn().mockResolvedValue([]) },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.garden.findMany.mockResolvedValue([]);
    prisma.gardenMember.findMany.mockResolvedValue([]);
    prisma.plant.findMany.mockResolvedValue([]);
    prisma.recommendation.findMany.mockResolvedValue([]);
    prisma.communityPost.findMany.mockResolvedValue([]);
    prisma.comment.findMany.mockResolvedValue([]);
    service = new UsersService(prisma as never, upload, weather, config);
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.exportData('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('never selects credentials or internal tokens from the user row', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c' });

    await service.exportData('u1');

    const select = prisma.user.findUnique.mock.calls[0][0].select;
    expect(select.passwordHash).toBeUndefined();
    expect(select.emailVerificationToken).toBeUndefined();
    expect(select.passwordResetToken).toBeUndefined();
    expect(select.stripeCustomerId).toBeUndefined();
  });

  it('scopes every collection query to the requesting user and strips foreign keys from plants', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c' });
    prisma.plant.findMany.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        speciesId: 's1',
        gardenId: 'g1',
        nickname: 'Monty',
        species: { commonName: 'Monstera', scientificName: 'Monstera deliciosa' },
        tasks: [],
        journalEntries: [],
        progressEntries: [],
        diagnoses: [],
        milestones: [],
      },
    ]);

    const result = await service.exportData('u1');

    expect(prisma.garden.findMany.mock.calls[0][0].where).toEqual({ ownerId: 'u1' });
    expect(prisma.plant.findMany.mock.calls[0][0].where).toEqual({ userId: 'u1' });
    expect(prisma.communityPost.findMany.mock.calls[0][0].where).toEqual({ authorId: 'u1' });
    expect(prisma.comment.findMany.mock.calls[0][0].where).toEqual({ authorId: 'u1' });

    expect(result.format).toBe('dr-plant-export/v1');
    expect(result.plants[0].nickname).toBe('Monty');
    expect(result.plants[0]).not.toHaveProperty('userId');
    expect(result.plants[0]).not.toHaveProperty('speciesId');
    expect(result.plants[0]).not.toHaveProperty('gardenId');
  });
});
