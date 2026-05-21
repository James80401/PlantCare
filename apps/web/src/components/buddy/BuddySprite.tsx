import { speciesEmoji } from './species';

interface BuddySpriteProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg';
  traveling?: boolean;
  mood?: string;
  /** Compact floating companion chip */
  variant?: 'default' | 'companion';
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
}: BuddySpriteProps) {
  const moodEffect = mood ? moodClass[mood] : '';
  const sizes = variant === 'companion' ? companionSizeClass : sizeClass;
  const motionClass = traveling
    ? variant === 'companion'
      ? 'buddy-travel-walk'
      : 'buddy-travel-walk buddy-travel-walk--slow'
    : 'buddy-idle-bob';

  return (
    <div
      className={`flex items-center justify-center ${motionClass} ${moodEffect}`}
      aria-hidden
    >
      <span className={sizes[size]} role="img">
        {speciesEmoji(speciesId)}
      </span>
    </div>
  );
}
