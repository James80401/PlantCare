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

export type CanonicalTaskType = `${TaskType}`;

export interface TaskTypeMetadata {
  label: string;
  shortLabel: string;
  category: 'critical' | 'routine' | 'seasonal' | 'diagnostic';
  description: string;
  journalPrompt: string;
}

export const TASK_TYPE_METADATA: Record<CanonicalTaskType, TaskTypeMetadata> = {
  [TaskType.WATER]: {
    label: 'Water',
    shortLabel: 'Water',
    category: 'critical',
    description: 'Core watering care based on soil, plant needs, and schedule.',
    journalPrompt: 'soil moisture, leaf posture, and how the plant responded',
  },
  [TaskType.FERTILIZE]: {
    label: 'Fertilize',
    shortLabel: 'Feed',
    category: 'routine',
    description: 'Nutrient care during active growth, with burn and dormancy safeguards.',
    journalPrompt: 'fertilizer strength, amount, and any leaf/root response',
  },
  [TaskType.PRUNE]: {
    label: 'Prune',
    shortLabel: 'Prune',
    category: 'routine',
    description: 'Remove damaged growth, shape the plant, or encourage healthier branching.',
    journalPrompt: 'what was removed and whether new growth is expected',
  },
  [TaskType.MIST]: {
    label: 'Mist / humidity',
    shortLabel: 'Mist',
    category: 'routine',
    description: 'Humidity support when it is useful for the plant and environment.',
    journalPrompt: 'humidity conditions and whether leaves stayed healthy afterward',
  },
  [TaskType.PH_TEST]: {
    label: 'Test soil pH',
    shortLabel: 'pH test',
    category: 'diagnostic',
    description: 'Check whether soil pH may be affecting nutrient availability.',
    journalPrompt: 'test result, soil mix, and whether symptoms match pH stress',
  },
  [TaskType.PEST_CONTROL]: {
    label: 'Pest treatment',
    shortLabel: 'Treat pests',
    category: 'critical',
    description: 'Treat confirmed or likely pest pressure and track follow-up signs.',
    journalPrompt: 'pest signs, treatment used, and where pests were found',
  },
  [TaskType.REPOT]: {
    label: 'Repot',
    shortLabel: 'Repot',
    category: 'seasonal',
    description: 'Move the plant to a better pot or soil mix when roots or soil call for it.',
    journalPrompt: 'new pot size, soil mix, root condition, and recovery notes',
  },
  [TaskType.ROTATE]: {
    label: 'Rotate',
    shortLabel: 'Rotate',
    category: 'routine',
    description: 'Turn the plant for more even light exposure and balanced growth.',
    journalPrompt: 'light direction and any leaning or uneven growth',
  },
  [TaskType.CLEAN_LEAVES]: {
    label: 'Clean leaves',
    shortLabel: 'Clean',
    category: 'routine',
    description: 'Remove dust so leaves can photosynthesize and pests are easier to spot.',
    journalPrompt: 'dust, residue, leaf condition, or pests noticed while cleaning',
  },
  [TaskType.INSPECT_PESTS]: {
    label: 'Inspect for pests',
    shortLabel: 'Inspect',
    category: 'diagnostic',
    description: 'Look under leaves, stems, and soil surface for early pest signs.',
    journalPrompt: 'what areas were checked and whether pests or residue appeared',
  },
  [TaskType.CHECK_MOISTURE]: {
    label: 'Check moisture',
    shortLabel: 'Moisture',
    category: 'diagnostic',
    description: 'Check soil moisture before changing the watering schedule.',
    journalPrompt: 'moisture depth, dry-down speed, and whether watering should change',
  },
  [TaskType.HEALTH_CHECK]: {
    label: 'Health check',
    shortLabel: 'Health',
    category: 'diagnostic',
    description: 'Review symptoms, recovery, or overall plant status after care changes.',
    journalPrompt: 'symptoms, recovery signs, and what to watch next',
  },
};

export const CANONICAL_TASK_TYPES = Object.values(TaskType);

export function taskTypeMetadata(taskType: string): TaskTypeMetadata {
  return (
    TASK_TYPE_METADATA[taskType as CanonicalTaskType] ?? {
      label: taskType,
      shortLabel: taskType,
      category: 'routine',
      description: 'Care task.',
      journalPrompt: 'what happened and what changed',
    }
  );
}

export function taskTypeLabel(taskType: string): string {
  return taskTypeMetadata(taskType).label;
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

export default {
  TaskType,
  TASK_TYPE_METADATA,
  CANONICAL_TASK_TYPES,
  taskTypeMetadata,
  taskTypeLabel,
};
