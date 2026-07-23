import { resolveNotificationCapabilities } from './notification-capabilities';

describe('resolveNotificationCapabilities', () => {
  it('reports every unconfigured channel as unavailable', () => {
    const capabilities = resolveNotificationCapabilities({
      get: () => undefined,
    } as never);

    expect(capabilities).toEqual({
      email: {
        available: false,
        reason: 'Email delivery is not configured by the operator.',
      },
      push: {
        available: false,
        reason: 'Push delivery is not configured by the operator.',
      },
      sms: {
        available: false,
        reason: 'SMS delivery is not configured by the operator.',
      },
    });
  });

  it('reports fully configured channels as available', () => {
    const values: Record<string, string> = {
      SMTP_USER: 'smtp@example.com',
      SMTP_PASS: 'app password',
      FCM_SERVER_KEY: 'fcm-key',
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'twilio-secret',
      TWILIO_FROM_NUMBER: '+15550001111',
    };
    const capabilities = resolveNotificationCapabilities({
      get: (key: string) => values[key],
    } as never);

    expect(capabilities).toEqual({
      email: { available: true, reason: null },
      push: { available: true, reason: null },
      sms: { available: true, reason: null },
    });
  });
});
