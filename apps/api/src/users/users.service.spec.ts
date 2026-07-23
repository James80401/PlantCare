import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersService.resolveLocationFields', () => {
  const weather = { geocodeLocation: jest.fn() };
  const prisma = {} as never;
  const upload = {} as never;
  const config = { get: () => undefined } as never;
  const billing = {} as never;
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma, upload, weather as never, config, billing);
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
  const billing = {} as never;

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
    service = new UsersService(prisma as never, upload, weather, config, billing);
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

describe('UsersService.deleteAccount', () => {
  const upload = { deleteByUrl: jest.fn().mockResolvedValue(undefined) };
  const weather = {} as never;
  const config = { get: () => undefined } as never;
  const billing = {
    stopSubscriptionsForAccountDeletion: jest.fn().mockResolvedValue({ canceled: 0 }),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
    },
    plant: { findMany: jest.fn() },
    diagnosisConversation: {
      findMany: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    communityPost: { findMany: jest.fn() },
    refreshToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    $transaction: jest.fn(),
  };

  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash('correct-password', 4),
    });
    prisma.plant.findMany.mockResolvedValue([
      {
        imageUrl: '/uploads/plant.webp',
        journalEntries: [{ photoUrl: '/uploads/journal.webp' }],
        progressEntries: [{ photoUrl: '/uploads/progress.webp' }],
        diagnoses: [{ imageUrl: '/uploads/diagnosis.webp' }],
        diagnosisConversations: [
          { messages: [{ imageUrl: '/uploads/chat.webp' }] },
        ],
      },
    ]);
    prisma.diagnosisConversation.findMany.mockResolvedValue([
      {
        id: 'conversation-1',
        messages: [
          { imageUrl: '/uploads/chat.webp' },
          { imageUrl: '/uploads/standalone-chat.webp' },
        ],
      },
    ]);
    prisma.communityPost.findMany.mockResolvedValue([
      { imageUrl: '/uploads/community.webp' },
    ]);
    billing.stopSubscriptionsForAccountDeletion.mockResolvedValue({ canceled: 0 });
    upload.deleteByUrl.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    service = new UsersService(
      prisma as never,
      upload as never,
      weather,
      config,
      billing as never,
    );
  });

  it('requires the current password without mutating the account', async () => {
    await expect(
      service.deleteAccount('user-1', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(billing.stopSubscriptionsForAccountDeletion).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('stops billing, revokes sessions, deletes the account, and removes unique managed media', async () => {
    await expect(
      service.deleteAccount('user-1', 'correct-password'),
    ).resolves.toEqual({ deleted: true });

    expect(prisma.plant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ userId: 'user-1' }, { garden: { ownerId: 'user-1' } }],
        },
      }),
    );
    expect(billing.stopSubscriptionsForAccountDeletion).toHaveBeenCalledWith('user-1');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.diagnosisConversation.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(upload.deleteByUrl).toHaveBeenCalledTimes(7);
    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/chat.webp');
  });

  it('does not delete database records when subscription cancellation fails', async () => {
    billing.stopSubscriptionsForAccountDeletion.mockRejectedValue(
      new Error('Stripe unavailable'),
    );

    await expect(
      service.deleteAccount('user-1', 'correct-password'),
    ).rejects.toThrow('Stripe unavailable');

    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.diagnosisConversation.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(upload.deleteByUrl).not.toHaveBeenCalled();
  });
});
