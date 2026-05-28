import { ConfigService } from '@nestjs/config';

export function requiresAdminApproval(config: ConfigService): boolean {
  return config.get<string>('REGISTRATION_REQUIRES_ADMIN_APPROVAL') === 'true';
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
