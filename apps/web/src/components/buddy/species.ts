import type { BuddyTrait } from '../../hooks/buddy/types';

export const BUDDY_SPECIES = [
  {
    id: 'monstera',
    name: 'Monty',
    label: 'Monstera',
    emoji: '🌿',
    blurb: 'Cheerful and dramatic — loves attention.',
  },
  {
    id: 'cactus',
    name: 'Spike',
    label: 'Cactus',
    emoji: '🌵',
    blurb: 'Stoic and independent — slow to wilt.',
  },
  {
    id: 'succulent',
    name: 'Rosie',
    label: 'Succulent',
    emoji: '🪴',
    blurb: 'Bright and compact — celebrates small wins.',
  },
  {
    id: 'snake_plant',
    name: 'Sage',
    label: 'Snake plant',
    emoji: '🐍',
    blurb: 'Calm and steady — perfect for busy weeks.',
  },
  {
    id: 'fern',
    name: 'Fernie',
    label: 'Fern',
    emoji: '🌱',
    blurb: 'Gentle and curious — loves humidity checks.',
  },
  {
    id: 'rose',
    name: 'Rosalind',
    label: 'Rose',
    emoji: '🌹',
    blurb: 'Earn Bloom Tokens when every due task is done.',
  },
] as const;

export const BUDDY_TRAITS: { value: BuddyTrait; label: string; hint: string }[] = [
  { value: 'RESILIENT', label: 'Resilient', hint: 'Bounces back after missed days' },
  { value: 'SUN_SEEKER', label: 'Sun seeker', hint: 'Extra cheer on light-related care' },
  { value: 'TENDER', label: 'Tender', hint: 'Gentle reminders and soft dialogue' },
  { value: 'WILD', label: 'Wild', hint: 'Playful discoveries on journeys' },
  { value: 'NIGHT_BLOOMER', label: 'Night bloomer', hint: 'Quiet energy for evening care' },
];

export const GROWTH_STAGE_LABEL: Record<string, string> = {
  SEED: 'Seed',
  SPROUT: 'Sprout',
  SEEDLING: 'Seedling',
  YOUNG_PLANT: 'Young plant',
  ESTABLISHED: 'Established',
  ANCIENT: 'Ancient',
};

export function speciesEmoji(speciesId: string): string {
  return BUDDY_SPECIES.find((s) => s.id === speciesId)?.emoji ?? '🌱';
}
