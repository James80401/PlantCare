import { useId } from 'react';
import type { BuddyFaceExpression } from './buddyFaces';
import {
  BuddyClothingOverFace,
  BuddyClothingUnderFace,
  type EquippedItems,
} from './buddyClothingSvg';

type BuddyCharacterModelProps = {
  speciesId: string;
  expression: BuddyFaceExpression;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'companion';
  equipped?: EquippedItems | null;
};

const BODY_PATH =
  'M37 104 C37 58 60 42 82 42 C111 42 134 65 134 105 C134 148 112 166 82 166 C52 166 37 142 37 104 Z';

type SpeciesModel = {
  body: string;
  bodyDark: string;
  belly: string;
  wing: string;
  accent: string;
  cheek: string;
  eye: string;
  crest: 'monstera' | 'cactus' | 'succulent' | 'snake' | 'fern' | 'rose' | 'sprout';
  posture: 'open' | 'calm' | 'perky' | 'shy';
};

const SIZE_CLASS = {
  sm: 'h-16 w-16',
  md: 'h-28 w-28',
  lg: 'h-40 w-40',
};

const COMPANION_SIZE_CLASS = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

const SPECIES_MODELS: Record<string, SpeciesModel> = {
  monstera: {
    body: '#7bcf85',
    bodyDark: '#2f8f52',
    belly: '#e8f8d8',
    wing: '#4aa564',
    accent: '#19683e',
    cheek: '#f6aaa2',
    eye: '#17352c',
    crest: 'monstera',
    posture: 'open',
  },
  cactus: {
    body: '#86c66c',
    bodyDark: '#4f8b4d',
    belly: '#eef6c9',
    wing: '#4d9649',
    accent: '#f7d56b',
    cheek: '#f4ad8d',
    eye: '#17321f',
    crest: 'cactus',
    posture: 'calm',
  },
  succulent: {
    body: '#88c7ba',
    bodyDark: '#4f8890',
    belly: '#ecf7e8',
    wing: '#6aa3b7',
    accent: '#f19d61',
    cheek: '#eea6ba',
    eye: '#17333a',
    crest: 'succulent',
    posture: 'shy',
  },
  snake_plant: {
    body: '#8acb67',
    bodyDark: '#4f9444',
    belly: '#f4f5ca',
    wing: '#417e44',
    accent: '#e9dc61',
    cheek: '#f2a28f',
    eye: '#17331e',
    crest: 'snake',
    posture: 'perky',
  },
  fern: {
    body: '#78cf87',
    bodyDark: '#439d58',
    belly: '#eaf8d6',
    wing: '#2f9361',
    accent: '#b8e986',
    cheek: '#f1a7a1',
    eye: '#123323',
    crest: 'fern',
    posture: 'open',
  },
  rose: {
    body: '#88c978',
    bodyDark: '#4e9b50',
    belly: '#fff0f5',
    wing: '#3f8e5b',
    accent: '#ee668c',
    cheek: '#f4a2b4',
    eye: '#331622',
    crest: 'rose',
    posture: 'perky',
  },
};

function modelFor(speciesId: string): SpeciesModel {
  return SPECIES_MODELS[speciesId] ?? {
    body: '#78cf87',
    bodyDark: '#439d58',
    belly: '#eaf8d6',
    wing: '#2f9361',
    accent: '#b8e986',
    cheek: '#f1a7a1',
    eye: '#123323',
    crest: 'sprout',
    posture: 'open',
  };
}

function Crest({ model }: { model: SpeciesModel }) {
  switch (model.crest) {
    case 'monstera':
      return (
        <g className="buddy-model-crest">
          <path d="M76 36 C56 14 42 32 54 50 C39 42 30 58 43 70 C58 83 73 67 80 51 Z" fill={model.accent} />
          <path d="M87 36 C108 13 122 34 108 51 C124 43 132 60 118 72 C103 84 89 67 82 51 Z" fill="#0f5c35" />
          <path d="M81 28 C72 43 75 58 83 68 C96 55 96 40 87 28 Z" fill="#197144" />
          <path d="M60 42 C65 50 70 56 78 60 M105 42 C99 51 94 56 86 61" stroke="#dff4c8" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.85" />
        </g>
      );
    case 'cactus':
      return (
        <g className="buddy-model-crest">
          <path d="M59 60 C47 47 50 28 63 22 C77 32 75 48 66 62 Z" fill={model.wing} />
          <path d="M103 61 C116 48 112 29 99 23 C85 33 87 49 96 63 Z" fill={model.bodyDark} />
          <path d="M60 34 L55 37 M66 44 L60 47 M99 34 L105 38 M94 46 L101 48" stroke="#fff3b0" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'succulent':
      return (
        <g className="buddy-model-crest">
          <path d="M82 24 C67 36 69 55 82 65 C96 54 97 36 82 24 Z" fill="#75aeca" />
          <path d="M63 38 C60 54 69 66 82 66 C80 51 74 42 63 38 Z" fill="#5f98b0" />
          <path d="M101 38 C91 42 84 51 82 66 C96 66 105 54 101 38 Z" fill="#5f98b0" />
          <path d="M52 54 C62 69 75 72 82 66 C71 56 61 52 52 54 Z" fill="#8fc7c0" />
          <path d="M112 54 C102 69 89 72 82 66 C93 56 103 52 112 54 Z" fill="#8fc7c0" />
        </g>
      );
    case 'snake':
      return (
        <g className="buddy-model-crest">
          <path d="M61 66 C53 42 55 20 67 12 C79 31 76 51 69 68 Z" fill={model.wing} />
          <path d="M82 64 C76 37 80 17 88 9 C100 34 94 53 88 70 Z" fill={model.bodyDark} />
          <path d="M103 66 C94 42 98 23 110 15 C121 37 116 55 109 70 Z" fill={model.wing} />
          <path d="M67 22 C68 39 67 52 64 63 M88 19 C88 38 86 52 83 65 M110 26 C109 43 107 57 104 67" stroke={model.accent} strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
        </g>
      );
    case 'fern':
      return (
        <g className="buddy-model-crest">
          <path d="M80 65 C61 54 54 37 56 17" stroke={model.bodyDark} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M85 65 C105 54 113 37 111 17" stroke={model.bodyDark} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {[62, 67, 72].map((x, index) => (
            <ellipse key={`left-${x}`} cx={x} cy={29 + index * 8} rx="12" ry="5" fill={model.wing} transform={`rotate(${-34 + index * 8} ${x} ${29 + index * 8})`} />
          ))}
          {[105, 100, 94].map((x, index) => (
            <ellipse key={`right-${x}`} cx={x} cy={29 + index * 8} rx="12" ry="5" fill={model.wing} transform={`rotate(${34 - index * 8} ${x} ${29 + index * 8})`} />
          ))}
        </g>
      );
    case 'rose':
      return (
        <g className="buddy-model-crest">
          <path d="M66 62 C48 48 52 29 69 31 C72 15 93 15 96 31 C113 29 117 48 99 62 Z" fill={model.accent} />
          <path d="M73 53 C73 41 82 36 85 49 C89 36 99 43 94 54 C86 63 78 62 73 53 Z" fill="#c72f62" opacity="0.85" />
          <path d="M60 64 C47 60 42 49 47 38 M105 64 C118 60 122 49 116 38" stroke={model.bodyDark} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'sprout':
    default:
      return (
        <g className="buddy-model-crest">
          <path d="M78 64 C65 47 67 32 82 22 C95 36 94 52 78 64 Z" fill={model.wing} />
          <path d="M86 65 C100 50 115 48 124 59 C113 73 99 75 86 65 Z" fill={model.bodyDark} />
        </g>
      );
  }
}

function Face({ expression, model }: { expression: BuddyFaceExpression; model: SpeciesModel }) {
  const eye = model.eye;
  const strokeProps = {
    stroke: eye,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (expression) {
    case 'wink':
      return (
        <g>
          <circle cx="66" cy="83" r="5.2" fill={eye} />
          <path d="M96 82 Q102 86 108 82" {...strokeProps} />
          <path d="M72 106 Q84 114 99 106" {...strokeProps} />
        </g>
      );
    case 'blink':
    case 'sleepy':
    case 'cozy':
      return (
        <g>
          <path d="M60 83 Q67 87 74 83" {...strokeProps} />
          <path d="M94 83 Q101 87 108 83" {...strokeProps} />
          <path d="M73 105 Q84 111 98 105" {...strokeProps} />
        </g>
      );
    case 'love':
      return (
        <g>
          <path d="M64 79 C60 74 53 77 54 83 C56 88 64 92 66 95 C68 91 76 87 76 82 C76 76 68 74 64 79 Z" fill="#db2777" />
          <path d="M100 79 C96 74 89 77 90 83 C92 88 100 92 102 95 C104 91 112 87 112 82 C112 76 104 74 100 79 Z" fill="#db2777" />
          <path d="M71 105 Q84 116 101 105" {...strokeProps} />
        </g>
      );
    case 'surprised':
      return (
        <g>
          <circle cx="66" cy="83" r="5.7" fill={eye} />
          <circle cx="102" cy="83" r="5.7" fill={eye} />
          <ellipse cx="84" cy="107" rx="6.5" ry="8" fill={eye} opacity="0.9" />
        </g>
      );
    case 'thinking':
    case 'focused':
      return (
        <g>
          <circle cx="66" cy="83" r="5.2" fill={eye} />
          <circle cx="102" cy="82" r="5.2" fill={eye} />
          <path d="M73 107 Q84 102 98 107" {...strokeProps} />
          <path d="M58 74 Q67 70 76 74 M93 73 Q103 69 112 74" {...strokeProps} strokeWidth={3} opacity="0.75" />
        </g>
      );
    case 'shy':
      return (
        <g>
          <circle cx="66" cy="84" r="4.4" fill={eye} />
          <circle cx="102" cy="84" r="4.4" fill={eye} />
          <path d="M75 106 Q84 110 96 106" {...strokeProps} />
        </g>
      );
    case 'cheer':
    case 'excited':
    case 'giggle':
      return (
        <g>
          <path d="M58 82 Q66 76 75 82" {...strokeProps} />
          <path d="M93 82 Q102 76 111 82" {...strokeProps} />
          <path d="M68 102 Q84 121 104 102" fill="#7f1d1d" opacity="0.9" />
          <path d="M75 106 Q84 113 98 106" stroke="#fff7ed" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
        </g>
      );
    case 'proud':
      return (
        <g>
          <circle cx="66" cy="83" r="4.8" fill={eye} />
          <circle cx="102" cy="83" r="4.8" fill={eye} />
          <path d="M70 105 Q84 115 101 105" {...strokeProps} />
          <path d="M58 75 L76 72 M93 72 L112 75" {...strokeProps} strokeWidth={3} opacity="0.8" />
        </g>
      );
    case 'curious':
      return (
        <g>
          <circle cx="65" cy="84" r="5" fill={eye} />
          <circle cx="103" cy="81" r="6.2" fill={eye} />
          <path d="M74 106 Q84 110 97 106" {...strokeProps} />
        </g>
      );
    case 'dizzy':
      return (
        <g>
          <path d="M58 78 L75 90 M75 78 L58 90 M94 78 L111 90 M111 78 L94 90" {...strokeProps} strokeWidth={3.2} />
          <path d="M75 107 Q84 111 95 107" {...strokeProps} />
        </g>
      );
    case 'happy':
    default:
      return (
        <g>
          <circle cx="66" cy="83" r="5.2" fill={eye} />
          <circle cx="102" cy="83" r="5.2" fill={eye} />
          <path d="M70 105 Q84 116 101 105" {...strokeProps} />
        </g>
      );
  }
}

function Wings({ model }: { model: SpeciesModel }) {
  const left =
    model.posture === 'shy'
      ? 'M47 99 C24 100 17 119 33 131 C46 141 57 126 57 111'
      : model.posture === 'calm'
        ? 'M47 96 C25 99 18 114 29 126 C42 139 55 124 57 110'
        : 'M48 94 C23 84 12 98 20 115 C29 134 52 124 58 109';
  const right =
    model.posture === 'shy'
      ? 'M113 99 C136 100 143 119 127 131 C114 141 103 126 103 111'
      : model.posture === 'calm'
        ? 'M113 96 C135 99 142 114 131 126 C118 139 105 124 103 110'
        : 'M112 94 C137 84 148 98 140 115 C131 134 108 124 102 109';

  return (
    <g className="buddy-model-wings">
      <path d={left} fill={model.wing} stroke={model.bodyDark} strokeWidth="3" className="buddy-model-wing buddy-model-wing-left" />
      <path d={right} fill={model.wing} stroke={model.bodyDark} strokeWidth="3" className="buddy-model-wing buddy-model-wing-right" />
      <path d="M35 105 C42 110 48 115 53 122" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" fill="none" />
      <path d="M125 105 C118 110 112 115 107 122" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" fill="none" />
    </g>
  );
}

export default function BuddyCharacterModel({
  speciesId,
  expression,
  size = 'md',
  variant = 'default',
  equipped,
}: BuddyCharacterModelProps) {
  const equippedItems = (equipped ?? {}) as EquippedItems;
  const model = modelFor(speciesId);
  const dimensions = variant === 'companion' ? COMPANION_SIZE_CLASS[size] : SIZE_CLASS[size];
  const svgId = useId().replace(/:/g, '');
  const bodyGradientId = `buddyBody-${speciesId}-${svgId}`;
  const bellyGradientId = `buddyBelly-${speciesId}-${svgId}`;

  return (
    <svg
      viewBox="0 0 160 180"
      className={`buddy-character-model ${dimensions}`}
      role="img"
      aria-label="Plant Buddy character"
    >
      <defs>
        <linearGradient id={bodyGradientId} x1="34" y1="40" x2="118" y2="158" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={model.body} />
          <stop offset="1" stopColor={model.bodyDark} />
        </linearGradient>
        <radialGradient id={bellyGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78 115) rotate(70) scale(44 35)">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor={model.belly} />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="168" rx="43" ry="8" fill="#064e3b" opacity="0.16" />
      <Crest model={model} />
      <Wings model={model} />

      <g className="buddy-model-leg buddy-model-leg-left">
        <path d="M62 144 C54 152 51 160 48 168" stroke={model.bodyDark} strokeWidth="9" strokeLinecap="round" fill="none" />
        <ellipse cx="45" cy="168" rx="14" ry="6" fill={model.accent} stroke={model.bodyDark} strokeWidth="2" />
      </g>
      <g className="buddy-model-leg buddy-model-leg-right">
        <path d="M98 144 C106 152 109 160 112 168" stroke={model.bodyDark} strokeWidth="9" strokeLinecap="round" fill="none" />
        <ellipse cx="115" cy="168" rx="14" ry="6" fill={model.accent} stroke={model.bodyDark} strokeWidth="2" />
      </g>

      <path d={BODY_PATH} fill={`url(#${bodyGradientId})`} stroke={model.bodyDark} strokeWidth="3" />
      <ellipse cx="82" cy="124" rx="34" ry="39" fill={`url(#${bellyGradientId})`} opacity="0.95" />
      <BuddyClothingUnderFace equipped={equippedItems} bodyPath={BODY_PATH} />
      <path d="M50 72 C61 56 99 55 116 74" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.38" fill="none" />
      <circle cx="54" cy="99" r="7" fill={model.cheek} opacity="0.72" />
      <circle cx="116" cy="99" r="7" fill={model.cheek} opacity="0.72" />
      <Face expression={expression} model={model} />
      <path d="M80 91 L73 100 Q80 106 87 100 Z" fill={model.accent} stroke="#7c4a12" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M60 137 C73 148 99 148 114 137" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.16" />
      <BuddyClothingOverFace equipped={equippedItems} />
    </svg>
  );
}
