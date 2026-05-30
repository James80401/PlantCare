import { ConfigService } from '@nestjs/config';
import { PlanTier } from '@prisma/client';

export function allUsersPremium(config: ConfigService): boolean {
  return config.get<string>('ALL_USERS_PREMIUM')?.trim().toLowerCase() === 'true';
}

export function effectivePlanTier(config: ConfigService, planTier: PlanTier): PlanTier {
  return allUsersPremium(config) ? PlanTier.PREMIUM : planTier;
}

export function premiumTrialDays(config: ConfigService): number {
  const configured = Number.parseInt(config.get<string>('PREMIUM_TRIAL_DAYS', '14'), 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 14;
}

export function premiumPriceLabel(config: ConfigService): string {
  return config.get<string>('PREMIUM_PRICE_LABEL')?.trim() || '$4.99/month';
}
