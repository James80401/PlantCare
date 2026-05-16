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
