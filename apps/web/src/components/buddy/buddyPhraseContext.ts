import type { BuddyState, BuddyTrait, JourneyState } from '../../hooks/buddy/types';

export const SUNLIGHT_CAP = 100;

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GardenMetrics {
  totalPlants: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
}

export interface BuddyPhraseContext {
  name: string;
  speciesId: string;
  trait: BuddyTrait;
  mood: string;
  growthStage: string;
  streakDays: number;
  sunlightToday: number;
  dewdrops: number;
  journeyReady: boolean;
  traveling: boolean;
  biomeName?: string;
  journeyRemainingSeconds?: number;
  timeOfDay: TimeOfDay;
  garden: GardenMetrics;
  apiGreeting?: string;
  weatherRainHint?: boolean;
}

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function buildBuddyPhraseContext(
  buddy: BuddyState,
  journey: JourneyState | null,
  traveling: boolean,
  garden: GardenMetrics,
  apiGreeting?: string,
  now: Date = new Date(),
): BuddyPhraseContext {
  const weatherRainHint = apiGreeting
    ? apiGreeting.includes('rain') ||
      apiGreeting.includes('🌧') ||
      apiGreeting.includes('indoor plant checks')
    : false;

  return {
    name: buddy.name,
    speciesId: buddy.speciesId,
    trait: buddy.trait,
    mood: buddy.mood,
    growthStage: buddy.growthStage,
    streakDays: buddy.streakDays,
    sunlightToday: buddy.sunlightToday,
    dewdrops: buddy.dewdrops,
    journeyReady: buddy.journeyReady,
    traveling,
    biomeName: journey?.biomeName,
    journeyRemainingSeconds: journey?.remainingSeconds,
    timeOfDay: getTimeOfDay(now),
    garden,
    apiGreeting,
    weatherRainHint,
  };
}

export const EMPTY_GARDEN_METRICS: GardenMetrics = {
  totalPlants: 0,
  dueToday: 0,
  overdue: 0,
  completedToday: 0,
};
