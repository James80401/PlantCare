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

export interface BuddyState {
  id: string;
  name: string;
  speciesId: string;
  trait: BuddyTrait;
  growthStage: string;
  journeyCount: number;
  dewdrops: number;
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
