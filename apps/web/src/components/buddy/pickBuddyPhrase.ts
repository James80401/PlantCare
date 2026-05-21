import type { BuddyPhraseContext } from './buddyPhraseContext';
import { BUDDY_PHRASE_CATALOG, type BuddyPhraseEntry, type BuddyPhraseWhen } from './buddyPhraseCatalog';

const RECENT_LIMIT = 8;

export interface PickBuddyPhraseOptions {
  context: BuddyPhraseContext;
  recentIds: string[];
  /** Prefer API weather greeting ~25% of picks when available */
  preferApiGreeting?: boolean;
  tick?: number;
}

export interface PickBuddyPhraseResult {
  id: string;
  text: string;
}

function matchesWhen(ctx: BuddyPhraseContext, when: BuddyPhraseWhen | undefined): boolean {
  if (!when) return true;

  if (when.traveling !== undefined && when.traveling !== ctx.traveling) return false;
  if (when.journeyReady !== undefined && when.journeyReady !== ctx.journeyReady) return false;
  if (when.minStreak !== undefined && ctx.streakDays < when.minStreak) return false;
  if (when.minSunlight !== undefined && ctx.sunlightToday < when.minSunlight) return false;
  if (when.maxSunlight !== undefined && ctx.sunlightToday > when.maxSunlight) return false;
  if (when.minDewdrops !== undefined && ctx.dewdrops < when.minDewdrops) return false;

  if (when.mood !== undefined) {
    const moods = Array.isArray(when.mood) ? when.mood : [when.mood];
    if (!moods.includes(ctx.mood)) return false;
  }
  if (when.trait !== undefined) {
    const traits = Array.isArray(when.trait) ? when.trait : [when.trait];
    if (!traits.includes(ctx.trait)) return false;
  }
  if (when.speciesId !== undefined) {
    const ids = Array.isArray(when.speciesId) ? when.speciesId : [when.speciesId];
    if (!ids.includes(ctx.speciesId)) return false;
  }
  if (when.growthStage !== undefined) {
    const stages = Array.isArray(when.growthStage) ? when.growthStage : [when.growthStage];
    if (!stages.includes(ctx.growthStage)) return false;
  }
  if (when.timeOfDay !== undefined) {
    const times = Array.isArray(when.timeOfDay) ? when.timeOfDay : [when.timeOfDay];
    if (!times.includes(ctx.timeOfDay)) return false;
  }

  const g = ctx.garden;
  if (when.overdueGt !== undefined && g.overdue <= when.overdueGt) return false;
  if (when.overdueEq !== undefined && g.overdue !== when.overdueEq) return false;
  if (when.dueTodayGt !== undefined && g.dueToday <= when.dueTodayGt) return false;
  if (when.dueTodayEq !== undefined && g.dueToday !== when.dueTodayEq) return false;
  if (when.completedTodayGt !== undefined && g.completedToday <= when.completedTodayGt) return false;
  if (when.totalPlantsEq !== undefined && g.totalPlants !== when.totalPlantsEq) return false;
  if (when.totalPlantsGt !== undefined && g.totalPlants <= when.totalPlantsGt) return false;
  if (when.weatherRainHint !== undefined && when.weatherRainHint !== ctx.weatherRainHint) return false;

  return true;
}

function interpolate(text: string, ctx: BuddyPhraseContext): string {
  return text
    .replace(/\{name\}/g, ctx.name)
    .replace(/\{streakDays\}/g, String(ctx.streakDays))
    .replace(/\{sunlightToday\}/g, String(ctx.sunlightToday))
    .replace(/\{dewdrops\}/g, String(ctx.dewdrops))
    .replace(/\{overdue\}/g, String(ctx.garden.overdue))
    .replace(/\{dueToday\}/g, String(ctx.garden.dueToday))
    .replace(/\{completedToday\}/g, String(ctx.garden.completedToday))
    .replace(/\{biomeName\}/g, ctx.biomeName ?? 'the wild');
}

function scoreEntry(entry: BuddyPhraseEntry): number {
  return entry.priority ?? (entry.when ? 5 : 1);
}

export function pickBuddyPhrase(options: PickBuddyPhraseOptions): PickBuddyPhraseResult {
  const { context, recentIds, preferApiGreeting, tick = 0 } = options;

  if (preferApiGreeting && context.apiGreeting && tick % 4 === 0) {
    return { id: 'api-greeting', text: context.apiGreeting };
  }

  const eligible = BUDDY_PHRASE_CATALOG.filter(
    (e) => matchesWhen(context, e.when) && !recentIds.includes(e.id),
  );

  const pool = eligible.length > 0 ? eligible : BUDDY_PHRASE_CATALOG.filter((e) => !recentIds.includes(e.id));
  const fallback = pool.length > 0 ? pool : BUDDY_PHRASE_CATALOG;

  const maxScore = Math.max(...fallback.map(scoreEntry));
  const top = fallback.filter((e) => scoreEntry(e) >= maxScore - 1);
  const chosen = top[Math.floor(Math.random() * top.length)] ?? fallback[0];

  return {
    id: chosen.id,
    text: interpolate(chosen.text, context),
  };
}

export function pushRecentPhraseId(recentIds: string[], id: string): string[] {
  const next = [...recentIds, id];
  return next.length > RECENT_LIMIT ? next.slice(-RECENT_LIMIT) : next;
}
