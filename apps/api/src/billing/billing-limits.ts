import { FREE_IDENTIFY_MONTHLY_LIMIT, FREE_PLANT_LIMIT } from '@plant-care/shared';

export const IDENTIFY_WINDOW_DAYS = 30;

export function freePlanLimits() {
  return {
    plants: FREE_PLANT_LIMIT,
    identificationsPerWindow: FREE_IDENTIFY_MONTHLY_LIMIT,
    identifyWindowDays: IDENTIFY_WINDOW_DAYS,
  };
}
