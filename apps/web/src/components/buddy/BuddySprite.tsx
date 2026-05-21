import BuddyCuteFace from './BuddyCuteFace';
import { faceExpressionForMood, type BuddyFaceExpression } from './buddyFaces';
import { speciesEmoji } from './species';

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

const sizeClass = {
  sm: 'text-5xl',
  md: 'text-7xl',
  lg: 'text-8xl',
};

const companionSizeClass = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
};

const faceSizeMap = {
  sm: 'sm' as const,
  md: 'sm' as const,
  lg: 'sm' as const,
};

const companionFaceSizeMap = {
  sm: 'xs' as const,
  md: 'xs' as const,
  lg: 'sm' as const,
};

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
  const sizes = variant === 'companion' ? companionSizeClass : sizeClass;
  const motionClass = traveling
    ? variant === 'companion'
      ? 'buddy-travel-walk'
      : 'buddy-travel-walk buddy-travel-walk--slow'
    : 'buddy-idle-bob';

  const faceExpression: BuddyFaceExpression =
    face ?? faceExpressionForMood(mood) ?? (traveling ? 'cozy' : 'happy');
  const faceSize = variant === 'companion' ? companionFaceSizeMap[size] : faceSizeMap[size];

  return (
    <div
      className={`flex items-center justify-center ${motionClass} ${moodEffect}`}
      aria-hidden
    >
      <span className={`relative ${sizes[size]} select-none`} role="img">
        {speciesEmoji(speciesId)}
        <span className="absolute bottom-[6%] left-1/2 -translate-x-1/2">
          <BuddyCuteFace
            expression={faceExpression}
            speciesId={speciesId}
            size={faceSize}
          />
        </span>
      </span>
    </div>
  );
}
