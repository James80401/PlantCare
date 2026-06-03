import BuddyCharacterModel from './BuddyCharacterModel';
import { faceExpressionForMood, type BuddyFaceExpression } from './buddyFaces';

interface BuddySpriteProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg';
  traveling?: boolean;
  mood?: string;
  /** Compact floating companion chip */
  variant?: 'default' | 'companion';
  /** Override face expression (e.g. from animation catalog). */
  face?: BuddyFaceExpression;
}

const moodClass: Record<string, string> = {
  WILTING: 'opacity-80 saturate-50',
  THIRSTY: 'opacity-90',
  DORMANT: 'opacity-60 grayscale',
};

export default function BuddySprite({
  speciesId,
  size = 'md',
  traveling,
  mood,
  variant = 'default',
  face,
}: BuddySpriteProps) {
  const moodEffect = mood ? moodClass[mood] : '';
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
      />
    </div>
  );
}
