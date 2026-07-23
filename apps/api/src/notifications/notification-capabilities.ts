import type { ConfigService } from '@nestjs/config';
import { resolveFcmTransport } from './fcm.client';
import { resolveSmsTransport } from './sms.client';

export interface NotificationCapability {
  available: boolean;
  reason: string | null;
}

export interface NotificationCapabilities {
  email: NotificationCapability;
  push: NotificationCapability;
  sms: NotificationCapability;
}

function capability(
  available: boolean,
  unavailableReason: string,
): NotificationCapability {
  return {
    available,
    reason: available ? null : unavailableReason,
  };
}

export function resolveNotificationCapabilities(
  config: ConfigService,
): NotificationCapabilities {
  const smtpUser = config.get<string>('SMTP_USER')?.trim();
  const smtpPassword = (config.get<string>('SMTP_PASS') ?? '')
    .trim()
    .replace(/\s+/g, '');
  const get = (key: string) => config.get<string>(key);

  return {
    email: capability(
      Boolean(smtpUser && smtpPassword),
      'Email delivery is not configured by the operator.',
    ),
    push: capability(
      resolveFcmTransport(get).mode !== 'none',
      'Push delivery is not configured by the operator.',
    ),
    sms: capability(
      resolveSmsTransport(get).mode !== 'none',
      'SMS delivery is not configured by the operator.',
    ),
  };
}
