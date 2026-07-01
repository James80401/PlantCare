export enum PlanTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum TaskType {
  WATER = 'WATER',
  FERTILIZE = 'FERTILIZE',
  PRUNE = 'PRUNE',
  MIST = 'MIST',
  PH_TEST = 'PH_TEST',
  PEST_CONTROL = 'PEST_CONTROL',
  REPOT = 'REPOT',
  ROTATE = 'ROTATE',
  CLEAN_LEAVES = 'CLEAN_LEAVES',
  INSPECT_PESTS = 'INSPECT_PESTS',
  CHECK_MOISTURE = 'CHECK_MOISTURE',
  HEALTH_CHECK = 'HEALTH_CHECK',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  SKIPPED = 'SKIPPED',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum PotSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export const FREE_PLANT_LIMIT = 5;
export const FREE_IDENTIFY_MONTHLY_LIMIT = 3;
export const FREE_DIAGNOSIS_MONTHLY_LIMIT = 5;
export const FREE_DIAGNOSIS_CHAT_MONTHLY_LIMIT = 10;
