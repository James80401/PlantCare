import {
  FREE_DIAGNOSIS_CHAT_MONTHLY_LIMIT,
  FREE_DIAGNOSIS_MONTHLY_LIMIT,
  FREE_IDENTIFY_MONTHLY_LIMIT,
  FREE_PLANT_LIMIT,
} from '@plant-care/shared';

export const IDENTIFY_WINDOW_DAYS = 30;
export const DIAGNOSIS_WINDOW_DAYS = 30;

export function freePlanLimits() {
  return {
    plants: FREE_PLANT_LIMIT,
    identificationsPerWindow: FREE_IDENTIFY_MONTHLY_LIMIT,
    identifyWindowDays: IDENTIFY_WINDOW_DAYS,
    diagnosesPerWindow: FREE_DIAGNOSIS_MONTHLY_LIMIT,
    diagnosisChatsPerWindow: FREE_DIAGNOSIS_CHAT_MONTHLY_LIMIT,
    diagnosisWindowDays: DIAGNOSIS_WINDOW_DAYS,
  };
}
