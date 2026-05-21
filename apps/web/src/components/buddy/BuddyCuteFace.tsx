import type { BuddyFaceExpression } from './buddyFaces';
import { BUDDY_SPECIES_FACE_TINT } from './buddyFaces';

interface BuddyCuteFaceProps {
  expression: BuddyFaceExpression;
  speciesId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizePx = { xs: 22, sm: 30, md: 44, lg: 56 };

/** SVG paths vary by expression — always rendered on top of the plant emoji body. */
function FacePaths({ expression }: { expression: BuddyFaceExpression }) {
  switch (expression) {
    case 'wink':
      return (
        <>
          <circle cx="8" cy="11" r="2.2" className="buddy-face-eye" />
          <path d="M14 11 Q16 11 16 12" className="buddy-face-eye-closed" strokeWidth="1.4" />
          <path d="M7 16 Q12 19 17 16" className="buddy-face-mouth-smile" />
        </>
      );
    case 'blink':
    case 'sleepy':
      return (
        <>
          <path d="M6 11 Q8 12 10 11" className="buddy-face-eye-closed" strokeWidth="1.4" />
          <path d="M14 11 Q16 12 18 11" className="buddy-face-eye-closed" strokeWidth="1.4" />
          <path d="M8 16 Q12 17 16 16" className="buddy-face-mouth-small" />
        </>
      );
    case 'love':
      return (
        <>
          <circle cx="8" cy="11" r="2.4" className="buddy-face-heart-eye" />
          <circle cx="16" cy="11" r="2.4" className="buddy-face-heart-eye" />
          <path d="M7 16 Q12 19 17 16" className="buddy-face-mouth-smile" />
          <circle cx="5" cy="14" r="1.4" className="buddy-face-blush" opacity="0.65" />
          <circle cx="19" cy="14" r="1.4" className="buddy-face-blush" opacity="0.65" />
        </>
      );
    case 'surprised':
      return (
        <>
          <circle cx="8" cy="11" r="2.5" className="buddy-face-eye" />
          <circle cx="16" cy="11" r="2.5" className="buddy-face-eye" />
          <circle cx="12" cy="17" r="2.2" className="buddy-face-mouth-o" />
        </>
      );
    case 'thinking':
      return (
        <>
          <circle cx="8" cy="11" r="2.2" className="buddy-face-eye" />
          <circle cx="16" cy="10" r="2.2" className="buddy-face-eye" />
          <path d="M9 17 Q12 16 15 17" className="buddy-face-mouth-small" />
        </>
      );
    case 'shy':
      return (
        <>
          <circle cx="8" cy="11" r="1.8" className="buddy-face-eye" />
          <circle cx="16" cy="11" r="1.8" className="buddy-face-eye" />
          <path d="M8 16 Q12 17.5 16 16" className="buddy-face-mouth-small" />
          <circle cx="5" cy="14" r="1.5" className="buddy-face-blush" opacity="0.55" />
          <circle cx="19" cy="14" r="1.5" className="buddy-face-blush" opacity="0.55" />
        </>
      );
    case 'cheer':
    case 'excited':
      return (
        <>
          <circle cx="8" cy="10" r="2.4" className="buddy-face-eye" />
          <circle cx="16" cy="10" r="2.4" className="buddy-face-eye" />
          <path d="M6 15 Q12 20 18 15" className="buddy-face-mouth-open" />
        </>
      );
    case 'giggle':
      return (
        <>
          <path d="M6 11 Q8 12 10 11" className="buddy-face-eye-closed" strokeWidth="1.5" />
          <path d="M14 11 Q16 12 18 11" className="buddy-face-eye-closed" strokeWidth="1.5" />
          <path d="M6 16 Q12 19 18 16" className="buddy-face-mouth-open" />
        </>
      );
    case 'proud':
      return (
        <>
          <circle cx="8" cy="10" r="2" className="buddy-face-eye" />
          <circle cx="16" cy="10" r="2" className="buddy-face-eye" />
          <path d="M7 15 Q12 18 17 15" className="buddy-face-mouth-smile" />
        </>
      );
    case 'curious':
      return (
        <>
          <circle cx="8" cy="11" r="2.2" className="buddy-face-eye" />
          <circle cx="16" cy="10" r="2.6" className="buddy-face-eye" />
          <path d="M8 16 Q12 17 16 16" className="buddy-face-mouth-small" />
        </>
      );
    case 'cozy':
      return (
        <>
          <path d="M7 11 Q9 10 11 11" className="buddy-face-eye-closed" strokeWidth="1.3" />
          <path d="M13 11 Q15 10 17 11" className="buddy-face-eye-closed" strokeWidth="1.3" />
          <path d="M8 16 Q12 18 16 16" className="buddy-face-mouth-smile" />
        </>
      );
    case 'dizzy':
      return (
        <>
          <path d="M6 10 L10 12 M10 10 L6 12" className="buddy-face-eye-closed" strokeWidth="1.2" />
          <path d="M14 10 L18 12 M18 10 L14 12" className="buddy-face-eye-closed" strokeWidth="1.2" />
          <path d="M8 16 Q12 17 16 16" className="buddy-face-mouth-small" />
        </>
      );
    case 'focused':
      return (
        <>
          <circle cx="8" cy="10" r="2.4" className="buddy-face-eye" />
          <circle cx="16" cy="10" r="2.4" className="buddy-face-eye" />
          <path d="M8 16 Q12 15 16 16" className="buddy-face-mouth-small" />
        </>
      );
    case 'happy':
    default:
      return (
        <>
          <circle cx="8" cy="11" r="2.2" className="buddy-face-eye" />
          <circle cx="16" cy="11" r="2.2" className="buddy-face-eye" />
          <path d="M7 15 Q12 18 17 15" className="buddy-face-mouth-smile" />
          <circle cx="5" cy="14" r="1.2" className="buddy-face-blush" opacity="0.4" />
          <circle cx="19" cy="14" r="1.2" className="buddy-face-blush" opacity="0.4" />
        </>
      );
  }
}

export default function BuddyCuteFace({
  expression,
  speciesId,
  size = 'xs',
  className = '',
}: BuddyCuteFaceProps) {
  const px = sizePx[size];
  const tint = speciesId ? BUDDY_SPECIES_FACE_TINT[speciesId] : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      className={`buddy-cute-face pointer-events-none ${className}`}
      aria-hidden
      style={tint ? { ['--buddy-face-tint' as string]: tint } : undefined}
    >
      <FacePaths expression={expression} />
    </svg>
  );
}
