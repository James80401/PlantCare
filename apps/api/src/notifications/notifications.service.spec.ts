import { NotificationChannel } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import * as fcmClient from './fcm.client';

describe('NotificationsService', () => {
  const logCreate = jest.fn();
  const deviceFindMany = jest.fn();
  const deviceDeleteMany = jest.fn();

  const prisma = {
    deviceToken: {
      findMany: deviceFindMany,
      deleteMany: deviceDeleteMany,
    },
    notificationLog: { create: logCreate },
    user: { findUnique: jest.fn() },
    task: { findMany: jest.fn() },
  };

  const configGet = jest.fn();

  function createService() {
    return new NotificationsService(prisma as never, { get: configGet } as never);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    deviceFindMany.mockResolvedValue([{ token: 'device-1', platform: 'android' }]);
    logCreate.mockResolvedValue({});
    configGet.mockReturnValue(undefined);
  });

  it('logs mock push when user has no device tokens', async () => {
    deviceFindMany.mockResolvedValue([]);
    const service = createService();
    await (service as unknown as { sendPush: (u: string, t: string, b: string) => Promise<void> }).sendPush(
      'user-1',
      'Hello',
      'World',
    );
    expect(logCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channel: NotificationChannel.PUSH,
          message: expect.stringContaining('[push]'),
        }),
      }),
    );
  });

  it('sends FCM when server key is configured', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'FCM_SERVER_KEY' ? 'fcm-secret' : undefined,
    );
    const sendSpy = jest.spyOn(fcmClient, 'sendFcmNotification').mockResolvedValue({
      sent: 1,
      failed: 0,
      invalidTokens: [],
    });

    const service = createService();
    await (service as unknown as { sendPush: (u: string, t: string, b: string) => Promise<void> }).sendPush(
      'user-1',
      'Buddy',
      'Back from journey',
    );

    expect(sendSpy).toHaveBeenCalledWith('fcm-secret', ['device-1'], 'Buddy', 'Back from journey');
    sendSpy.mockRestore();
  });
});
