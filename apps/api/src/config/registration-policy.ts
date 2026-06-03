import { ConfigService } from '@nestjs/config';

function smtpConfigured(config: ConfigService): boolean {
  const user = config.get<string>('SMTP_USER')?.trim();
  const pass = (config.get<string>('SMTP_PASS') ?? '').trim();
  return Boolean(user && pass);
}

/** Private production: admin approval when SMTP is on unless explicitly disabled. */
export function requiresAdminApproval(config: ConfigService): boolean {
  const explicit = config.get<string>('REGISTRATION_REQUIRES_ADMIN_APPROVAL')?.trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return true;
  return config.get<string>('NODE_ENV') === 'production' && smtpConfigured(config);
}

export function adminEmails(config: ConfigService): string[] {
  return (config.get<string>('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(config: ConfigService, email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return adminEmails(config).includes(normalized);
}
