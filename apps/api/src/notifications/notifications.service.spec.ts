import { NotificationChannel, PlanTier } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import * as fcmClient from './fcm.client';
import * as smsClient from './sms.client';

describe('NotificationsService', () => {
  const logCreate = jest.fn();
  const deviceFindMany = jest.fn();
  const deviceDeleteMany = jest.fn();
  const userFindUnique = jest.fn();

  const prisma = {
    deviceToken: {
      findMany: deviceFindMany,
      deleteMany: deviceDeleteMany,
    },
    notificationLog: { create: logCreate },
    user: { findUnique: userFindUnique },
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
    await (service as unknown as { sendPush: (u: string, t: string, b: string, tag?: string) => Promise<void> }).sendPush(
      'user-1',
      'Buddy',
      'Back from journey',
      'buddy',
    );

    expect(sendSpy).toHaveBeenCalledWith(
      { mode: 'legacy', serverKey: 'fcm-secret' },
      ['device-1'],
      'Buddy',
      'Back from journey',
      expect.objectContaining({ route: '/garden/buddy/journey' }),
    );
    sendSpy.mockRestore();
  });

  describe('sendSms', () => {
    type ServiceWithSendSms = {
      sendSms: (
        userId: string,
        phone: string | null | undefined,
        body: string,
        tag?: string,
      ) => Promise<void>;
    };

    it('logs mock SMS when the user has no phone number', async () => {
      const service = createService();

      await (service as unknown as ServiceWithSendSms).sendSms('user-1', null, 'Water your plants');

      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.SMS,
            message: expect.stringContaining('Water your plants'),
          }),
        }),
      );
    });

    it('logs mock SMS when Twilio is not configured', async () => {
      const service = createService();

      await (service as unknown as ServiceWithSendSms).sendSms(
        'user-1',
        '+15551234567',
        'Water your plants',
      );

      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ channel: NotificationChannel.SMS }),
        }),
      );
    });

    it('sends via Twilio when fully configured, and logs on success', async () => {
      configGet.mockImplementation((key: string) =>
        ({
          TWILIO_ACCOUNT_SID: 'AC123',
          TWILIO_AUTH_TOKEN: 'secret',
          TWILIO_FROM_NUMBER: '+15550001111',
        })[key],
      );
      const sendSpy = jest.spyOn(smsClient, 'sendSmsNotification').mockResolvedValue({ sent: true });

      const service = createService();
      await (service as unknown as ServiceWithSendSms).sendSms(
        'user-1',
        '+15551234567',
        'Water your plants',
      );

      expect(sendSpy).toHaveBeenCalledWith(
        { mode: 'live', accountSid: 'AC123', authToken: 'secret', fromNumber: '+15550001111' },
        '+15551234567',
        'Water your plants',
      );
      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.SMS,
            message: expect.not.stringContaining('SMS error'),
          }),
        }),
      );
      sendSpy.mockRestore();
    });

    it('logs an SMS-error tag when Twilio reports a send failure', async () => {
      configGet.mockImplementation((key: string) =>
        ({
          TWILIO_ACCOUNT_SID: 'AC123',
          TWILIO_AUTH_TOKEN: 'secret',
          TWILIO_FROM_NUMBER: '+15550001111',
        })[key],
      );
      const sendSpy = jest
        .spyOn(smsClient, 'sendSmsNotification')
        .mockResolvedValue({ sent: false, errorCode: 21211, errorMessage: 'Invalid number' });

      const service = createService();
      await (service as unknown as ServiceWithSendSms).sendSms('user-1', 'bad-number', 'hi');

      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.SMS,
            message: expect.stringContaining('SMS error'),
          }),
        }),
      );
      sendSpy.mockRestore();
    });
  });

  describe('notifyBuddy SMS gating', () => {
    it('sends SMS for a premium user with notifySms on', async () => {
      userFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        planTier: PlanTier.PREMIUM,
        notifyPush: false,
        notifyEmail: false,
        notifySms: true,
        phone: '+15551234567',
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      const sendSpy = jest.spyOn(smsClient, 'sendSmsNotification').mockResolvedValue({ sent: true });

      const service = createService();
      await service.notifyBuddy('user-1', 'Buddy', 'Missed you!', 'mood');

      expect(sendSpy).not.toHaveBeenCalled(); // Twilio unconfigured in this test -> mock path
      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ channel: NotificationChannel.SMS }) }),
      );
      sendSpy.mockRestore();
    });

    it('does not send SMS for a free-tier user even with notifySms on', async () => {
      userFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        planTier: PlanTier.FREE,
        notifyPush: false,
        notifyEmail: false,
        notifySms: true,
        phone: '+15551234567',
        quietHoursStart: null,
        quietHoursEnd: null,
      });

      const service = createService();
      await service.notifyBuddy('user-1', 'Buddy', 'Missed you!', 'mood');

      expect(logCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ channel: NotificationChannel.SMS }) }),
      );
    });

    it('does not send SMS when notifySms is off, even for a premium user', async () => {
      userFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        planTier: PlanTier.PREMIUM,
        notifyPush: false,
        notifyEmail: false,
        notifySms: false,
        phone: '+15551234567',
        quietHoursStart: null,
        quietHoursEnd: null,
      });

      const service = createService();
      await service.notifyBuddy('user-1', 'Buddy', 'Missed you!', 'mood');

      expect(logCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ channel: NotificationChannel.SMS }) }),
      );
    });
  });
});
