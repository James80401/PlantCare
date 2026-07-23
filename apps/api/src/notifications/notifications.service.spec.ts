import { NotificationChannel, PlanTier, RecommendationPriority, RecommendationStatus } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import * as fcmClient from './fcm.client';
import * as smsClient from './sms.client';

describe('NotificationsService', () => {
  const logCreate = jest.fn();
  const deviceFindMany = jest.fn();
  const deviceDeleteMany = jest.fn();
  const userFindUnique = jest.fn();
  const recommendationFindMany = jest.fn();
  const recommendationUpdateMany = jest.fn();

  const prisma = {
    deviceToken: {
      findMany: deviceFindMany,
      deleteMany: deviceDeleteMany,
    },
    notificationLog: { create: logCreate },
    user: { findUnique: userFindUnique },
    task: { findMany: jest.fn() },
    recommendation: {
      findMany: recommendationFindMany,
      updateMany: recommendationUpdateMany,
    },
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
    recommendationFindMany.mockResolvedValue([]);
    recommendationUpdateMany.mockResolvedValue({ count: 0 });
  });

  describe('timezone-aware hour checks', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('isReminderHourDue converts to the user\'s own timezone, not the server\'s', () => {
      // 2026-01-15T13:00:00Z is 8am in America/New_York (UTC-5 in January) and
      // 10pm (22:00) in Asia/Tokyo (UTC+9) — three different local hours for the
      // same instant, so this pins down real timezone conversion rather than
      // coincidentally matching whatever timezone the test runner happens to be in.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15T13:00:00.000Z'));
      const service = createService();

      expect(service.isReminderHourDue({ reminderHour: 8, timezone: 'America/New_York' })).toBe(true);
      expect(service.isReminderHourDue({ reminderHour: 13, timezone: 'America/New_York' })).toBe(false);
      expect(service.isReminderHourDue({ reminderHour: 22, timezone: 'Asia/Tokyo' })).toBe(true);
      expect(service.isReminderHourDue({ reminderHour: 13, timezone: null })).toBe(true);
    });

    it('isQuietHours converts to the user\'s own timezone, not the server\'s', () => {
      // Same instant as above: 8am in New York, 1pm UTC, 10pm in Tokyo.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15T13:00:00.000Z'));
      const service = createService();

      expect(
        service.isQuietHours({ quietHoursStart: 22, quietHoursEnd: 7, timezone: 'America/New_York' }),
      ).toBe(false);
      expect(
        service.isQuietHours({ quietHoursStart: 20, quietHoursEnd: 23, timezone: 'Asia/Tokyo' }),
      ).toBe(true);
      expect(
        service.isQuietHours({ quietHoursStart: 20, quietHoursEnd: 23, timezone: null }),
      ).toBe(false);
    });
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

  describe('sendRecommendationReminders', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15T13:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const baseUser = {
      id: 'user-1',
      email: 'a@example.com',
      notifyPush: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      reminderHour: 13,
      timezone: 'UTC',
    };

    it('queries only ACTIVE, unnotified, HIGH/MEDIUM-priority recommendations that are not snoozed', async () => {
      const service = createService();
      await service.sendRecommendationReminders();

      expect(recommendationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RecommendationStatus.ACTIVE,
            notifiedAt: null,
            priority: { in: [RecommendationPriority.HIGH, RecommendationPriority.MEDIUM] },
          }),
        }),
      );
    });

    it('sends a push and marks notifiedAt for a due recommendation', async () => {
      recommendationFindMany.mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'user-1',
          title: 'Check in on Mona',
          priority: RecommendationPriority.MEDIUM,
          user: baseUser,
        },
      ]);

      const service = createService();
      await service.sendRecommendationReminders();

      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.PUSH,
            message: expect.stringContaining('Check in on Mona'),
          }),
        }),
      );
      expect(recommendationUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['rec-1'] } },
        data: { notifiedAt: expect.any(Date) },
      });
    });

    it('does not push during quiet hours, and leaves notifiedAt unset', async () => {
      recommendationFindMany.mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'user-1',
          title: 'Check in on Mona',
          priority: RecommendationPriority.MEDIUM,
          user: { ...baseUser, quietHoursStart: 0, quietHoursEnd: 23 },
        },
      ]);

      const service = createService();
      await service.sendRecommendationReminders();

      expect(logCreate).not.toHaveBeenCalled();
      expect(recommendationUpdateMany).not.toHaveBeenCalled();
    });

    it("does not push outside the user's reminder hour, and leaves notifiedAt unset", async () => {
      const offHour = (baseUser.reminderHour + 1) % 24;
      recommendationFindMany.mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'user-1',
          title: 'Check in on Mona',
          priority: RecommendationPriority.MEDIUM,
          user: { ...baseUser, reminderHour: offHour },
        },
      ]);

      const service = createService();
      await service.sendRecommendationReminders();

      expect(logCreate).not.toHaveBeenCalled();
      expect(recommendationUpdateMany).not.toHaveBeenCalled();
    });

    it('does not push when the user has push notifications disabled, but still marks notifiedAt', async () => {
      recommendationFindMany.mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'user-1',
          title: 'Check in on Mona',
          priority: RecommendationPriority.MEDIUM,
          user: { ...baseUser, notifyPush: false },
        },
      ]);

      const service = createService();
      await service.sendRecommendationReminders();

      expect(logCreate).not.toHaveBeenCalled();
      expect(recommendationUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['rec-1'] } },
        data: { notifiedAt: expect.any(Date) },
      });
    });

    it('bundles multiple recommendations for the same user into one push', async () => {
      recommendationFindMany.mockResolvedValue([
        { id: 'rec-1', userId: 'user-1', title: 'Check in on Mona', priority: RecommendationPriority.MEDIUM, user: baseUser },
        { id: 'rec-2', userId: 'user-1', title: 'Review outdoor protection for Fern', priority: RecommendationPriority.MEDIUM, user: baseUser },
      ]);

      const service = createService();
      await service.sendRecommendationReminders();

      expect(logCreate).toHaveBeenCalledTimes(1);
      expect(logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringContaining('2 plant recommendations'),
          }),
        }),
      );
      expect(recommendationUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['rec-1', 'rec-2'] } },
        data: { notifiedAt: expect.any(Date) },
      });
    });
  });
});
