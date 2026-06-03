import { Card } from '../ui/Card';
import type { BuddyTrait } from '../../hooks/buddy/types';
import type { SceneActionId } from './BuddySceneActions';

export type BuddyPersonalityProfile = {
  trait: BuddyTrait;
  label: string;
  tagline: string;
  homeStyle: string;
  journeyStyle: string;
  styleHint: string;
  pokeHint: string;
  choiceTone: string;
  preferredHomeActions: SceneActionId[];
  preferredTravelActions: SceneActionId[];
};

const PERSONALITY_PROFILES: Record<BuddyTrait, BuddyPersonalityProfile> = {
  RESILIENT: {
    trait: 'RESILIENT',
    label: 'Resilient',
    tagline: 'Brave, steady, and quick to bounce back.',
    homeStyle: 'Checks the home, celebrates progress, then settles in with a proud little wiggle.',
    journeyStyle: 'Scouts carefully and keeps moving even when the trail gets odd.',
    styleHint: 'Likes dependable homes, useful gear, and anything that feels ready for weather.',
    pokeHint: 'Pokes become determined pop-ups, high-fives, and tiny victory poses.',
    choiceTone: 'responds with practical courage',
    preferredHomeActions: ['inspect-home', 'celebrate', 'idle', 'wander'],
    preferredTravelActions: ['travel-scout', 'travel-walk', 'travel-rest'],
  },
  SUN_SEEKER: {
    trait: 'SUN_SEEKER',
    label: 'Sun seeker',
    tagline: 'Bright, warm, and happiest in a good patch of light.',
    homeStyle: 'Drifts toward windows, sparkles after care, and turns sunny moments into little parties.',
    journeyStyle: 'Follows bright paths and gets excited by glowing discoveries.',
    styleHint: 'Likes sunny outfits, bright homes, and items that boost light or celebration.',
    pokeHint: 'Pokes turn into sunbeam jumps, happy glows, and photosynthesis poses.',
    choiceTone: 'responds with bright optimism',
    preferredHomeActions: ['weather-watch', 'celebrate', 'wander', 'object-play'],
    preferredTravelActions: ['travel-walk', 'travel-find', 'travel-scout'],
  },
  NIGHT_BLOOMER: {
    trait: 'NIGHT_BLOOMER',
    label: 'Night bloomer',
    tagline: 'Soft-spoken, observant, and quietly magical.',
    homeStyle: 'Keeps watch, naps in cozy corners, and notices tiny details other buddies miss.',
    journeyStyle: 'Moves slowly, studies signs, and treats discoveries like little moonlit secrets.',
    styleHint: 'Likes cozy homes, lanterns, quiet furniture, and gentle evening colors.',
    pokeHint: 'Pokes become shy giggles, moon sways, and soft star-gazing reactions.',
    choiceTone: 'responds with quiet curiosity',
    preferredHomeActions: ['nap', 'weather-watch', 'inspect-home', 'idle'],
    preferredTravelActions: ['travel-scout', 'travel-rest', 'travel-find'],
  },
  WILD: {
    trait: 'WILD',
    label: 'Wild',
    tagline: 'Chaotic, playful, and deeply committed to doing a little bit too much.',
    homeStyle: 'Zooms around the room, plays with objects, and treats treasure checks like sport.',
    journeyStyle: 'Runs toward surprises, pokes weird things, and finds trouble before trouble finds them.',
    styleHint: 'Likes bold accessories, adventure gear, and furniture they can invent games around.',
    pokeHint: 'Pokes become zooms, cartwheels, bouncy wiggles, and delighted nonsense.',
    choiceTone: 'responds with playful mischief',
    preferredHomeActions: ['object-play', 'wander', 'treasure', 'celebrate'],
    preferredTravelActions: ['travel-find', 'travel-walk', 'travel-scout'],
  },
  TENDER: {
    trait: 'TENDER',
    label: 'Tender',
    tagline: 'Gentle, affectionate, and happiest when everyone feels safe.',
    homeStyle: 'Naps near the door, checks favorite things, and turns care into a soft thank-you.',
    journeyStyle: 'Takes gentle routes, rests often, and befriends almost anything with a face.',
    styleHint: 'Likes soft homes, comforting items, and accessories that feel sweet rather than flashy.',
    pokeHint: 'Pokes become hugs, happy sighs, shy blooms, and grateful little smiles.',
    choiceTone: 'responds with gentle empathy',
    preferredHomeActions: ['nap', 'object-play', 'inspect-home', 'celebrate'],
    preferredTravelActions: ['travel-rest', 'travel-scout', 'travel-find'],
  },
};

export function personalityForTrait(trait?: BuddyTrait | null): BuddyPersonalityProfile {
  if (!trait) return PERSONALITY_PROFILES.RESILIENT;
  return PERSONALITY_PROFILES[trait] ?? PERSONALITY_PROFILES.RESILIENT;
}

export function BuddyPersonalityCard({
  trait,
  mode = 'home',
  compact = false,
}: {
  trait: BuddyTrait;
  mode?: 'home' | 'journey' | 'style';
  compact?: boolean;
}) {
  const personality = personalityForTrait(trait);
  const body =
    mode === 'journey'
      ? personality.journeyStyle
      : mode === 'style'
        ? personality.styleHint
        : personality.homeStyle;

  return (
    <Card className={compact ? 'space-y-2 p-4' : 'space-y-3'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Personality
          </p>
          <h2 className="text-lg font-bold text-emerald-950">{personality.label}</h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
          {personality.choiceTone}
        </span>
      </div>
      <p className="text-sm font-medium text-emerald-900">{personality.tagline}</p>
      <p className="text-sm text-gray-600">{body}</p>
      {!compact ? <p className="text-xs text-gray-500">{personality.pokeHint}</p> : null}
    </Card>
  );
}
