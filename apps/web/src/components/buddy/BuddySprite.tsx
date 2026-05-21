import { speciesEmoji } from './species';

interface BuddySpriteProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg';
  traveling?: boolean;
}

const sizeClass = {
  sm: 'text-5xl',
  md: 'text-7xl',
  lg: 'text-8xl',
};

export default function BuddySprite({ speciesId, size = 'md', traveling }: BuddySpriteProps) {
  return (
    <div
      className={`flex items-center justify-center ${traveling ? 'animate-pulse' : ''}`}
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
