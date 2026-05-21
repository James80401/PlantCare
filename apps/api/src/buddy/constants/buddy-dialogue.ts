import { BuddyTrait } from '@prisma/client';

const TRAIT_DISCOVERY_REACTION: Record<BuddyTrait, [string, string]> = {
  RESILIENT: [
    'Your buddy shakes it off and keeps exploring.',
    'Your buddy pauses, then carries on with quiet confidence.',
  ],
  SUN_SEEKER: [
    'Your buddy leans toward the brightest patch of light.',
    'Your buddy finds a sunnier spot before moving on.',
  ],
  NIGHT_BLOOMER: [
    'Your buddy seems calmer in the soft shade.',
    'Your buddy waits for the quieter part of the day.',
  ],
  WILD: [
    'Your buddy gets playful and pokes around every leaf.',
    'Your buddy zigzags off the path to investigate.',
  ],
  TENDER: [
    'Your buddy moves gently, careful not to disturb anything.',
    'Your buddy takes a soft, thoughtful moment before continuing.',
  ],
};

function pickVariant<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length] ?? items[0];
}

const RAIN_LINES = (name: string, loc: string) => [
  `${name} noticed rain in the forecast${loc} — a good day for indoor plant checks. 🌧️`,
  `${name} says umbrellas up${loc}! Group your watering tasks wisely. 🌧️`,
  `${name} is cozy inside while rain${loc} is on the way. Check humidity lovers. 🌧️`,
  `Rain${loc}? ${name} suggests peeking at drainage and leaves today. 🌧️`,
  `${name} loves the sound of rain — your plants might too${loc}. 🌧️`,
];

const HEAT_LINES = (name: string, loc: string) => [
  `${name} says it will be warm${loc} — keep an eye on soil moisture. ☀️`,
  `${name} is seeking shade${loc} — maybe mist your tropical friends. ☀️`,
  `Hot day${loc}! ${name} reminds you: water early or late. ☀️`,
  `${name} feels the heat${loc} — check sun-sensitive pots. ☀️`,
  `Warm weather${loc} — ${name} is cheering you on to stay hydrated (plants too!). ☀️`,
];

const COLD_LINES = (name: string, loc: string) => [
  `${name} feels the chill${loc} — watch for drafts near your plants. 🧣`,
  `Brr${loc}! ${name} says move tender plants from cold windows. 🧣`,
  `${name} is bundled up${loc} — roots feel cold stress too. 🧣`,
  `Cool air${loc} — ${name} suggests a gentle check on your warmest room. 🧣`,
];

const MILD_LOC_LINES = (name: string, loc: string) => [
  `${name} is enjoying a calm garden day in ${loc}. 🌿`,
  `${name} says ${loc} has lovely growing weather today. 🌿`,
  `Peaceful vibes in ${loc} — ${name} approves. 🌿`,
  `${name} is soaking up a gentle day in ${loc}. 🌿`,
];

const GENERIC_LINES = (name: string) => [
  `${name} is having a great day in the garden 🌿`,
  `${name} is glad you dropped by! 🌿`,
  `${name} says your garden sends green hello’s 🌿`,
  `${name} is ready for whatever care you bring today 🌿`,
  `${name} believes in you and your plants 🌿`,
];

export interface GardenCompanionMetrics {
  totalPlants: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
}

const GARDEN_LINES = (name: string, m: GardenCompanionMetrics) => {
  const lines: string[] = [];
  if (m.totalPlants === 0) {
    lines.push(
      `${name} can’t wait to meet your first plant!`,
      `An empty pot is just an invitation — ${name} is ready when you are.`,
    );
  }
  if (m.overdue > 0) {
    lines.push(
      `${name} spotted ${m.overdue} overdue task${m.overdue === 1 ? '' : 's'} — one step at a time!`,
      `${name} will cheer you through those overdue chores.`,
      `Overdue care on the list — ${name} believes in your comeback.`,
    );
  }
  if (m.dueToday > 0 && m.overdue === 0) {
    lines.push(
      `${name} sees ${m.dueToday} task${m.dueToday === 1 ? '' : 's'} due today — you’ve got this!`,
      `Today’s garden list: ${m.dueToday}. ${name} is rooting for you.`,
    );
  }
  if (m.completedToday > 0) {
    lines.push(
      `${name} is dancing after your ${m.completedToday} completed task${m.completedToday === 1 ? '' : 's'} today!`,
      `High five from ${name} — ${m.completedToday} tasks done today!`,
    );
  }
  if (m.overdue === 0 && m.dueToday === 0 && m.totalPlants > 0) {
    lines.push(
      `${name} says the schedule is clear — enjoy the calm!`,
      `All caught up! ${name} suggests a journal note or a new species browse.`,
    );
  }
  lines.push(...GENERIC_LINES(name));
  return lines;
};

export function discoveryReaction(trait: BuddyTrait, choice: number): string {
  const pair = TRAIT_DISCOVERY_REACTION[trait] ?? TRAIT_DISCOVERY_REACTION.RESILIENT;
  return pair[choice] ?? pair[0];
}

export function weatherGreetingLine(
  buddyName: string,
  locationLabel: string | null,
  maxTempC?: number,
  rainChance?: number,
  seed = 0,
): string {
  const loc = locationLabel ? ` near ${locationLabel}` : '';
  const locIn = locationLabel ? ` in ${locationLabel}` : '';

  if (rainChance !== undefined && rainChance >= 60) {
    return pickVariant(RAIN_LINES(buddyName, loc), seed);
  }
  if (maxTempC !== undefined && maxTempC >= 28) {
    return pickVariant(HEAT_LINES(buddyName, locIn || loc), seed);
  }
  if (maxTempC !== undefined && maxTempC <= 10) {
    return pickVariant(COLD_LINES(buddyName, loc), seed);
  }
  if (locationLabel) {
    return pickVariant(MILD_LOC_LINES(buddyName, locationLabel), seed);
  }
  return pickVariant(GENERIC_LINES(buddyName), seed);
}

export function companionLineFromGarden(
  buddyName: string,
  metrics: GardenCompanionMetrics,
  seed = 0,
): string {
  const pool = GARDEN_LINES(buddyName, metrics);
  return pickVariant(pool, seed);
}
