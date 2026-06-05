import BuddyCharacterModel from './BuddyCharacterModel';
import { faceExpressionForMood, type BuddyFaceExpression } from './buddyFaces';
import type { EquippedItems } from './buddyClothingSvg';

interface BuddySpriteProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg';
  traveling?: boolean;
  mood?: string;
  /** Compact floating companion chip */
  variant?: 'default' | 'companion';
  /** Override face expression (e.g. from animation catalog). */
  face?: BuddyFaceExpression;
  /** Equipped cosmetics, rendered as SVG layers anchored to the character. */
  equipped?: EquippedItems | null;
}

export default function BuddySprite({
  speciesId,
  size = 'md',
  traveling,
  mood,
  variant = 'default',
  face,
  equipped,
}: BuddySpriteProps) {
  // Buddy always looks bright and happy — no grey/desaturated "neglected" state.
  const moodEffect = '';
  const motionClass = traveling
    ? variant === 'companion'
      ? 'buddy-travel-walk'
      : 'buddy-travel-walk buddy-travel-walk--slow'
    : 'buddy-idle-bob';

  const faceExpression: BuddyFaceExpression =
    face ?? faceExpressionForMood(mood) ?? (traveling ? 'cozy' : 'happy');

  return (
    <div
      className={`flex items-center justify-center ${motionClass} ${moodEffect}`}
      aria-hidden
    >
      <BuddyCharacterModel
        speciesId={speciesId}
        expression={faceExpression}
        size={size}
        variant={variant}
        equipped={equipped}
      />
    </div>
  );
}
