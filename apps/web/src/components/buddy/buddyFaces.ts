/** Face overlay expressions (SVG drawn in BuddyCuteFace). */
export type BuddyFaceExpression =
  | 'happy'
  | 'blink'
  | 'wink'
  | 'sleepy'
  | 'love'
  | 'surprised'
  | 'thinking'
  | 'shy'
  | 'cheer'
  | 'giggle'
  | 'proud'
  | 'curious'
  | 'cozy'
  | 'excited'
  | 'dizzy'
  | 'focused';

export const BUDDY_FACE_BY_MOOD: Partial<Record<string, BuddyFaceExpression>> = {
  WILTING: 'sleepy',
  THIRSTY: 'shy',
  DORMANT: 'sleepy',
};

/** Subtle cheek tint per species (hex). */
export const BUDDY_SPECIES_FACE_TINT: Record<string, string> = {
  monstera: '#15803d',
  cactus: '#4d7c0f',
  succulent: '#b45309',
  snake_plant: '#047857',
  fern: '#166534',
};

export function faceExpressionForMood(mood?: string): BuddyFaceExpression | undefined {
  if (!mood) return undefined;
  return BUDDY_FACE_BY_MOOD[mood];
}
