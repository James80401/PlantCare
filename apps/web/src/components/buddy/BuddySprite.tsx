import { speciesEmoji } from './species';

interface BuddySpriteProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg';
  traveling?: boolean;
  mood?: string;
}

const sizeClass = {
  sm: 'text-5xl',
  md: 'text-7xl',
  lg: 'text-8xl',
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
}: BuddySpriteProps) {
  const moodEffect = mood ? moodClass[mood] : '';
  return (
    <div
      className={`flex items-center justify-center ${traveling ? 'animate-pulse' : ''} ${moodEffect}`}
      style={
        traveling
          ? undefined
          : { animation: 'buddy-bob 3s ease-in-out infinite' }
      }
      aria-hidden
    >
      <span className={sizeClass[size]} role="img">
        {speciesEmoji(speciesId)}
      </span>
    </div>
  );
}
