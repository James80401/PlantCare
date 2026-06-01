export type BuddyTrait =
  | 'RESILIENT'
  | 'SUN_SEEKER'
  | 'NIGHT_BLOOMER'
  | 'WILD'
  | 'TENDER';

export type BuddyMood =
  | 'THRIVING'
  | 'HAPPY'
  | 'CONTENT'
  | 'WILTING'
  | 'THIRSTY'
  | 'DORMANT';

export const BUDDY_COMPANION_MODES = ['visible', 'minimized', 'hidden'] as const;

export type BuddyCompanionMode = (typeof BUDDY_COMPANION_MODES)[number];

export function isBuddyCompanionMode(value: unknown): value is BuddyCompanionMode {
  return typeof value === 'string' && BUDDY_COMPANION_MODES.includes(value as BuddyCompanionMode);
}

export interface BuddyState {
  id: string;
  name: string;
  speciesId: string;
  trait: BuddyTrait;
  growthStage: string;
  journeyCount: number;
  dewdrops: number;
  experiencePoints: number;
  level: number;
  levelProgress: {
    level: number;
    experiencePoints: number;
    currentLevelXp: number;
    nextLevelXp: number | null;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
  };
  bloomTokens: number;
  bloomTokensEnabled: boolean;
  sunlightToday: number;
  tasksToday: number;
  mood: BuddyMood;
  streakDays: number;
  longestStreak: number;
  gardenCode: string;
  equippedItems: Record<string, unknown>;
  unlockedSpecies: string[];
  unlockedBiomes: string[];
  currentBiome: string;
  terrariumLayout: Record<string, unknown>;
  terrariumBackground: string;
  floatingCompanionMode: BuddyCompanionMode;
  journeyReady: boolean;
  hasActiveJourney: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyDiscovery {
  id: string;
  biomeId: string;
  story: string;
  choiceA: string;
  choiceB: string;
}

export interface JourneyState {
  id: string;
  biomeId: string;
  biomeName: string;
  biomeEmoji: string;
  startedAt: string;
  endsAt: string;
  completed: boolean;
  completedAt: string | null;
  remainingSeconds: number;
  progressPercent: number;
  discoveryId: string | null;
  dewdropsEarned: number;
  choiceMade: number | null;
  tasksCompletedDuring: number;
  minutesSaved: number;
  buddyName: string;
  discovery?: JourneyDiscovery;
  needsChoice?: boolean;
}

export interface JourneyResponse {
  journey: JourneyState | null;
  buddy?: BuddyState | null;
  dewdropsEarned?: number;
  stageAdvanced?: boolean;
  newGrowthStage?: string;
}
