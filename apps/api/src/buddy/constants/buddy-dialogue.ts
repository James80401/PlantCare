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

export function discoveryReaction(trait: BuddyTrait, choice: number): string {
  const pair = TRAIT_DISCOVERY_REACTION[trait] ?? TRAIT_DISCOVERY_REACTION.RESILIENT;
  return pair[choice] ?? pair[0];
}

export function weatherGreetingLine(
  buddyName: string,
  locationLabel: string | null,
  maxTempC?: number,
  rainChance?: number,
): string {
  if (rainChance !== undefined && rainChance >= 60) {
    return `${buddyName} noticed rain in the forecast${locationLabel ? ` near ${locationLabel}` : ''} — a good day for indoor plant checks. 🌧️`;
  }
  if (maxTempC !== undefined && maxTempC >= 28) {
    return `${buddyName} says it will be warm${locationLabel ? ` in ${locationLabel}` : ''} — keep an eye on soil moisture. ☀️`;
  }
  if (maxTempC !== undefined && maxTempC <= 10) {
    return `${buddyName} feels the chill${locationLabel ? ` around ${locationLabel}` : ''} — watch for drafts near your plants. 🧣`;
  }
  if (locationLabel) {
    return `${buddyName} is enjoying a calm garden day in ${locationLabel}. 🌿`;
  }
  return `${buddyName} is having a great day in the garden 🌿`;
}
