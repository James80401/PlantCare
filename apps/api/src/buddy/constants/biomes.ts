export interface BiomeDef {
  id: string;
  name: string;
  emoji: string;
  minStage: 'SEED' | 'SPROUT' | 'SEEDLING' | 'YOUNG_PLANT' | 'ESTABLISHED' | 'ANCIENT';
  durationHours: number;
  dewdropMin: number;
  dewdropMax: number;
}

const STAGE_ORDER = ['SEED', 'SPROUT', 'SEEDLING', 'YOUNG_PLANT', 'ESTABLISHED', 'ANCIENT'] as const;

export const BIOMES: BiomeDef[] = [
  {
    id: 'seed_garden',
    name: 'Seed Garden',
    emoji: '🌱',
    minStage: 'SEED',
    durationHours: 4,
    dewdropMin: 25,
    dewdropMax: 35,
  },
  {
    id: 'forest_floor',
    name: 'Forest Floor',
    emoji: '🌲',
    minStage: 'SPROUT',
    durationHours: 5,
    dewdropMin: 30,
    dewdropMax: 40,
  },
  {
    id: 'desert_oasis',
    name: 'Desert Oasis',
    emoji: '🏜️',
    minStage: 'SEEDLING',
    durationHours: 5,
    dewdropMin: 35,
    dewdropMax: 45,
  },
];

export function biomeById(id: string): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}

export function isBiomeUnlocked(biome: BiomeDef, growthStage: string): boolean {
  const idx = STAGE_ORDER.indexOf(growthStage as (typeof STAGE_ORDER)[number]);
  const minIdx = STAGE_ORDER.indexOf(biome.minStage);
  return idx >= minIdx && idx >= 0;
}

export function defaultBiomeForBuddy(unlockedBiomes: string[], growthStage: string): string {
  const unlocked = BIOMES.filter(
    (b) => unlockedBiomes.includes(b.id) && isBiomeUnlocked(b, growthStage),
  );
  return unlocked[unlocked.length - 1]?.id ?? 'seed_garden';
}
