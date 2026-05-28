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
