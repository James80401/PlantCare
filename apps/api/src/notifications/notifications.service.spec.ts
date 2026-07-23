import {
  NotificationChannel,
  PlanTier,
  RecommendationPriority,
  RecommendationStatus,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { NotificationsService } from './notifications.service';
import * as fcmClient from './fcm.client';
import * as smsClient from './sms.client';

describe('NotificationsService', () => {
  const userFindMany = jest.fn();
  const userFindUnique = jest.fn();
  const taskFindMany = jest.fn();
  const taskUpdateMany = jest.fn();
  const recommendationFindMany = jest.fn();
  const recommendationUpdateMany = jest.fn();
  const deviceFindMany = jest.fn();
  const deviceDeleteMany = jest.fn();
  const logFindMany = jest.fn();
  const logFindFirst = jest.fn();
  const logFindUnique = jest.fn();
  const logCreate = jest.fn();
  const logUpdateMany = jest.fn();
  const logUpsert = jest.fn();
  const transaction = jest.fn();
  const configGet = jest.fn();
  const sendNotificationEmail = jest.fn();

  const prisma = {
    user: { findMany: userFindMany, findUnique: userFindUnique },
    task: { findMany: taskFindMany, updateMany: taskUpdateMany },
    recommendation: {
      findMany: recommendationFindMany,
      updateMany: recommendationUpdateMany,
    },
    deviceToken: {
      findMany: deviceFindMany,
      deleteMany: deviceDeleteMany,
    },
    notificationLog: {
      findMany: logFindMany,
      findFirst: logFindFirst,
      findUnique: logFindUnique,
      create: logCreate,
      updateMany: logUpdateMany,
      upsert: logUpsert,
    },
    $transaction: transaction,
  };

  const baseUser = {
    id: 'user-1',
    email: 'gardener@example.com',
    planTier: PlanTier.FREE,
    notifyEmail: false,
    notifyPush: true,
    notifySms: false,
    phone: null,
    timezone: 'UTC',
    reminderHour: 13,
    quietHoursStart: null,
    quietHoursEnd: null,
  };

  const baseTask = {
    id: 'task-1',
    taskType: TaskType.WATER,
    plantId: 'plant-1',
    dueDate: new Date('2026-01-15T12:00:00.000Z'),
    notifiedAt: null,
    plant: {
      nickname: 'Mona',
      species: { commonName: 'Monstera' },
    },
  };

  function createService() {
    return new NotificationsService(
      prisma as never,
      { get: configGet } as never,
      { sendNotificationEmail } as never,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T13:00:00.000Z'));
    userFindMany.mockResolvedValue([]);
    userFindUnique.mockResolvedValue(null);
    taskFindMany.mockResolvedValue([]);
    taskUpdateMany.mockResolvedValue({ count: 0 });
    recommendationFindMany.mockResolvedValue([]);
    recommendationUpdateMany.mockResolvedValue({ count: 0 });
    deviceFindMany.mockResolvedValue([{ token: 'device-token-0001', platform: 'android' }]);
    deviceDeleteMany.mockResolvedValue({ count: 0 });
    logFindMany.mockResolvedValue([]);
    logFindFirst.mockResolvedValue(null);
    logFindUnique.mockResolvedValue(null);
    logCreate.mockResolvedValue({});
    logUpdateMany.mockResolvedValue({ count: 0 });
    logUpsert.mockResolvedValue({});
    transaction.mockImplementation((operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    );
    configGet.mockReturnValue(undefined);
    sendNotificationEmail.mockResolvedValue({
      success: false,
      skipped: true,
      error: 'SMTP not configured',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('uses each user timezone for reminder and quiet-hour checks', () => {
    const service = createService();

    expect(
      service.isReminderHourDue({
        reminderHour: 8,
        timezone: 'America/New_York',
      }),
    ).toBe(true);
    expect(
      service.isReminderHourDue({
        reminderHour: 22,
        timezone: 'Asia/Tokyo',
      }),
    ).toBe(true);
    expect(
      service.isQuietHours({
        quietHoursStart: 20,
        quietHoursEnd: 23,
        timezone: 'Asia/Tokyo',
      }),
    ).toBe(true);
    expect(
      service.isQuietHours({
        quietHoursStart: 22,
        quietHoursEnd: 7,
        timezone: 'America/New_York',
      }),
    ).toBe(false);
  });

  it('queries only the exact local calendar day across a DST transition', async () => {
    jest.setSystemTime(new Date('2026-03-08T13:00:00.000Z'));
    userFindMany.mockResolvedValue([
      {
        ...baseUser,
        timezone: 'America/New_York',
        reminderHour: 9,
      },
    ]);
    const service = createService();

    await service.sendDueTaskReminders();

    expect(taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: TaskStatus.PENDING,
          plant: { userId: 'user-1' },
          dueDate: {
            gte: new Date('2026-03-08T05:00:00.000Z'),
            lt: new Date('2026-03-09T04:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('queries overdue tasks against the same local-day boundary', async () => {
    userFindMany.mockResolvedValue([
      {
        ...baseUser,
        timezone: 'America/New_York',
        reminderHour: 8,
      },
    ]);
    const service = createService();

    await service.sendOverdueTaskReminders();

    expect(taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: TaskStatus.PENDING,
          dueDate: { lt: new Date('2026-01-15T05:00:00.000Z') },
        }),
      }),
    );
  });

  it('records an unconfigured push honestly and never marks the task notified', async () => {
    userFindMany.mockResolvedValue([baseUser]);
    taskFindMany.mockResolvedValue([baseTask]);
    const service = createService();

    await service.sendDueTaskReminders();

    expect(logUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          channel: NotificationChannel.PUSH,
          status: 'UNCONFIGURED',
          provider: 'fcm',
          errorCode: 'FCM_NOT_CONFIGURED',
          relatedEntity: 'task',
          relatedId: 'task-1',
        }),
      }),
    );
    expect(taskUpdateMany).not.toHaveBeenCalled();
  });

  it('marks a task notified only when at least one channel really succeeds', async () => {
    userFindMany.mockResolvedValue([
      { ...baseUser, notifyEmail: true, notifyPush: true },
    ]);
    taskFindMany.mockResolvedValue([baseTask]);
    sendNotificationEmail.mockResolvedValue({
      success: true,
      messageId: 'smtp-1',
    });
    const service = createService();

    await service.sendDueTaskReminders();

    expect(logUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          channel: NotificationChannel.EMAIL,
          status: 'SENT',
          provider: 'smtp',
        }),
      }),
    );
    expect(logUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          channel: NotificationChannel.PUSH,
          status: 'UNCONFIGURED',
        }),
      }),
    );
    expect(taskUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['task-1'] } },
      data: { notifiedAt: new Date('2026-01-15T13:00:00.000Z') },
    });
  });

  it('retries only channels that have not already succeeded', async () => {
    userFindMany.mockResolvedValue([
      { ...baseUser, notifyEmail: true, notifyPush: true },
    ]);
    taskFindMany.mockResolvedValue([
      { ...baseTask, notifiedAt: new Date('2026-01-14T13:00:00.000Z') },
    ]);
    logFindMany.mockResolvedValue([
      {
        channel: NotificationChannel.EMAIL,
        relatedId: 'task-1',
        status: 'SENT',
      },
      {
        channel: NotificationChannel.PUSH,
        relatedId: 'task-1',
        status: 'FAILED',
      },
    ]);
    configGet.mockImplementation((key: string) =>
      key === 'FCM_SERVER_KEY' ? 'fcm-secret' : undefined,
    );
    const fcmSend = jest
      .spyOn(fcmClient, 'sendFcmNotification')
      .mockResolvedValue({ sent: 1, failed: 0, invalidTokens: [] });
    const service = createService();

    await service.sendDueTaskReminders();

    expect(sendNotificationEmail).not.toHaveBeenCalled();
    expect(fcmSend).toHaveBeenCalledTimes(1);
    expect(taskUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['task-1'] } } }),
    );
  });

  it('does not resend legacy tasks that were already marked notified', async () => {
    userFindMany.mockResolvedValue([baseUser]);
    taskFindMany.mockResolvedValue([
      { ...baseTask, notifiedAt: new Date('2026-01-14T13:00:00.000Z') },
    ]);
    const service = createService();

    await service.sendDueTaskReminders();

    expect(deviceFindMany).not.toHaveBeenCalled();
    expect(logUpsert).not.toHaveBeenCalled();
    expect(taskUpdateMany).not.toHaveBeenCalled();
  });

  it('does not deliver when another cron invocation holds a fresh claim', async () => {
    userFindMany.mockResolvedValue([baseUser]);
    taskFindMany.mockResolvedValue([baseTask]);
    logCreate.mockRejectedValue({ code: 'P2002' });
    logFindUnique.mockResolvedValue({
      id: 'log-1',
      status: 'ATTEMPTING',
      attemptedAt: new Date('2026-01-15T12:59:30.000Z'),
    });
    const service = createService();

    await service.sendDueTaskReminders();

    expect(deviceFindMany).not.toHaveBeenCalled();
    expect(logUpdateMany).not.toHaveBeenCalled();
    expect(logUpsert).not.toHaveBeenCalled();
    expect(taskUpdateMany).not.toHaveBeenCalled();
  });

  it('removes invalid push tokens and records partial delivery as sent', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'FCM_SERVER_KEY' ? 'fcm-secret' : undefined,
    );
    deviceFindMany.mockResolvedValue([
      { token: 'valid-device-token', platform: 'android' },
      { token: 'invalid-device-token', platform: 'android' },
    ]);
    const fcmSend = jest
      .spyOn(fcmClient, 'sendFcmNotification')
      .mockResolvedValue({
        sent: 1,
        failed: 1,
        invalidTokens: ['invalid-device-token'],
      });
    const service = createService();

    const result = await (
      service as unknown as {
        sendPush: (
          userId: string,
          title: string,
          body: string,
        ) => Promise<{ status: string; errorCode?: string }>;
      }
    ).sendPush('user-1', 'Care due', 'Water Mona');

    expect(result).toMatchObject({
      status: 'SENT',
      errorCode: 'PARTIAL_FAILURE',
    });
    expect(deviceDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        token: { in: ['invalid-device-token'] },
      },
    });
  });

  it('reports missing and unconfigured SMS without pretending to send', async () => {
    const service = createService();
    const sendSms = (
      service as unknown as {
        sendSms: (
          userId: string,
          phone: string | null,
          body: string,
        ) => Promise<{ status: string; errorCode?: string }>;
      }
    ).sendSms.bind(service);

    await expect(sendSms('user-1', null, 'Care due')).resolves.toMatchObject({
      status: 'SKIPPED',
      errorCode: 'NO_PHONE',
    });
    await expect(
      sendSms('user-1', '+15551234567', 'Care due'),
    ).resolves.toMatchObject({
      status: 'UNCONFIGURED',
      errorCode: 'TWILIO_NOT_CONFIGURED',
    });
  });

  it('records Twilio failures with provider detail', async () => {
    configGet.mockImplementation(
      (key: string) =>
        ({
          TWILIO_ACCOUNT_SID: 'AC123',
          TWILIO_AUTH_TOKEN: 'secret',
          TWILIO_FROM_NUMBER: '+15550001111',
        })[key],
    );
    jest.spyOn(smsClient, 'sendSmsNotification').mockResolvedValue({
      sent: false,
      errorCode: 21211,
      errorMessage: 'Invalid phone number',
    });
    const service = createService();

    const result = await (
      service as unknown as {
        sendSms: (
          userId: string,
          phone: string,
          body: string,
        ) => Promise<{ status: string; errorCode?: string }>;
      }
    ).sendSms('user-1', '+15551234567', 'Care due');

    expect(result).toEqual({
      status: 'FAILED',
      provider: 'twilio',
      errorCode: '21211',
      errorMessage: 'Invalid phone number',
    });
  });

  it('does not mark recommendations notified when push is unavailable', async () => {
    recommendationFindMany.mockResolvedValue([
      {
        id: 'rec-1',
        userId: 'user-1',
        title: 'Check Mona',
        priority: RecommendationPriority.MEDIUM,
        notifiedAt: null,
        user: baseUser,
      },
    ]);
    const service = createService();

    await service.sendRecommendationReminders();

    expect(recommendationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: RecommendationStatus.ACTIVE,
          priority: {
            in: [
              RecommendationPriority.HIGH,
              RecommendationPriority.MEDIUM,
            ],
          },
        }),
      }),
    );
    expect(logUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'UNCONFIGURED',
          relatedEntity: 'recommendation',
          relatedId: 'rec-1',
        }),
      }),
    );
    expect(recommendationUpdateMany).not.toHaveBeenCalled();
  });

  it('marks recommendations notified after genuine FCM delivery', async () => {
    recommendationFindMany.mockResolvedValue([
      {
        id: 'rec-1',
        userId: 'user-1',
        title: 'Check Mona',
        priority: RecommendationPriority.HIGH,
        notifiedAt: null,
        user: baseUser,
      },
    ]);
    configGet.mockImplementation((key: string) =>
      key === 'FCM_SERVER_KEY' ? 'fcm-secret' : undefined,
    );
    jest
      .spyOn(fcmClient, 'sendFcmNotification')
      .mockResolvedValue({ sent: 1, failed: 0, invalidTokens: [] });
    const service = createService();

    await service.sendRecommendationReminders();

    expect(recommendationUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['rec-1'] } },
      data: { notifiedAt: new Date('2026-01-15T13:00:00.000Z') },
    });
  });

  it('deduplicates successful Buddy channels by user-local date', async () => {
    userFindUnique.mockResolvedValue({
      ...baseUser,
      notifyEmail: true,
      timezone: 'America/New_York',
    });
    logFindMany.mockResolvedValue([
      { channel: NotificationChannel.EMAIL, status: 'SENT' },
      { channel: NotificationChannel.PUSH, status: 'SENT' },
    ]);
    const service = createService();

    await service.notifyBuddy('user-1', 'Buddy', 'Welcome back', 'journey');

    expect(sendNotificationEmail).not.toHaveBeenCalled();
    expect(deviceFindMany).not.toHaveBeenCalled();
    expect(logUpsert).toHaveBeenCalledTimes(1);
    expect(logUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          channel: NotificationChannel.SMS,
          dedupeKey: 'buddy:journey:2026-01-15',
          status: 'SKIPPED',
        }),
      }),
    );
  });

  it('checks Buddy history against the user local calendar day', async () => {
    userFindUnique.mockResolvedValue({ timezone: 'America/Los_Angeles' });
    const service = createService();

    await service.hasBuddyNudgeToday('user-1', 'mood');

    expect(logFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        OR: expect.arrayContaining([
          { dedupeKey: 'buddy:mood:2026-01-15' },
          expect.objectContaining({
            message: { contains: '[mood]' },
            createdAt: {
              gte: new Date('2026-01-15T08:00:00.000Z'),
            },
          }),
        ]),
      }),
    });
  });
});
