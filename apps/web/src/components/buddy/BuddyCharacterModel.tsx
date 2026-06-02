import type { BuddyFaceExpression } from './buddyFaces';

type BuddyCharacterModelProps = {
  speciesId: string;
  expression: BuddyFaceExpression;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'companion';
};

type SpeciesModel = {
  skin: string;
  skinDark: string;
  leaf: string;
  leafDark: string;
  accent: string;
  cheek: string;
  eye: string;
  crown: 'monstera' | 'cactus' | 'succulent' | 'snake' | 'fern' | 'rose' | 'sprout';
  pose: 'open' | 'stoic' | 'gentle' | 'curious' | 'proud';
};

const SIZE_CLASS = {
  sm: 'h-16 w-16',
  md: 'h-28 w-28',
  lg: 'h-36 w-36',
};

const COMPANION_SIZE_CLASS = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

const SPECIES_MODELS: Record<string, SpeciesModel> = {
  monstera: {
    skin: '#8ed081',
    skinDark: '#2f8f52',
    leaf: '#166534',
    leafDark: '#0f4f32',
    accent: '#f5d46b',
    cheek: '#f5a9a0',
    eye: '#14342b',
    crown: 'monstera',
    pose: 'open',
  },
  cactus: {
    skin: '#8fca75',
    skinDark: '#4f8b4d',
    leaf: '#3b7f4a',
    leafDark: '#27613a',
    accent: '#ffd166',
    cheek: '#f6b48f',
    eye: '#17321f',
    crown: 'cactus',
    pose: 'stoic',
  },
  succulent: {
    skin: '#a8d8b0',
    skinDark: '#5a9a72',
    leaf: '#86b7c9',
    leafDark: '#447b91',
    accent: '#f7a65a',
    cheek: '#f0a6b7',
    eye: '#18363c',
    crown: 'succulent',
    pose: 'gentle',
  },
  snake_plant: {
    skin: '#9fd37e',
    skinDark: '#5a9b48',
    leaf: '#2f7d3e',
    leafDark: '#1f5d32',
    accent: '#e5d766',
    cheek: '#f3a391',
    eye: '#18331e',
    crown: 'snake',
    pose: 'proud',
  },
  fern: {
    skin: '#9bd68a',
    skinDark: '#4f9d4f',
    leaf: '#228b55',
    leafDark: '#16623c',
    accent: '#b8e986',
    cheek: '#f3a6a1',
    eye: '#123323',
    crown: 'fern',
    pose: 'curious',
  },
  rose: {
    skin: '#94d483',
    skinDark: '#4e9b50',
    leaf: '#2e7d4f',
    leafDark: '#195c36',
    accent: '#f06f8f',
    cheek: '#f4a2b4',
    eye: '#331622',
    crown: 'rose',
    pose: 'open',
  },
};

function modelFor(speciesId: string): SpeciesModel {
  return SPECIES_MODELS[speciesId] ?? {
    skin: '#9bd68a',
    skinDark: '#4f9d4f',
    leaf: '#228b55',
    leafDark: '#16623c',
    accent: '#f5d46b',
    cheek: '#f3a6a1',
    eye: '#123323',
    crown: 'sprout',
    pose: 'open',
  };
}

function Crown({ model }: { model: SpeciesModel }) {
  switch (model.crown) {
    case 'monstera':
      return (
        <g className="buddy-model-crown">
          <path d="M57 25 C40 13 36 31 45 42 C32 35 25 48 36 58 C46 66 56 54 61 43" fill={model.leaf} />
          <path d="M75 25 C94 13 97 33 87 43 C101 38 108 51 96 60 C85 68 75 55 70 43" fill={model.leafDark} />
          <path d="M62 19 C56 30 58 40 66 51 C76 41 78 29 70 18 Z" fill={model.leaf} />
          <path d="M49 31 C51 38 54 43 60 47 M82 31 C79 38 75 43 69 48" fill="none" stroke="#e7f7d9" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
        </g>
      );
    case 'cactus':
      return (
        <g className="buddy-model-crown">
          <path d="M45 48 C36 38 38 24 48 19 C58 25 58 39 51 50 Z" fill={model.leaf} />
          <path d="M83 49 C93 39 91 25 81 20 C70 26 71 40 78 51 Z" fill={model.leafDark} />
          <path d="M50 28 L46 31 M54 36 L49 38 M80 30 L85 33 M76 39 L82 41" stroke="#f6f1bf" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'succulent':
      return (
        <g className="buddy-model-crown">
          <path d="M66 20 C54 31 56 45 66 52 C78 44 78 31 66 20 Z" fill={model.leaf} />
          <path d="M50 30 C48 43 55 52 66 53 C66 40 60 32 50 30 Z" fill={model.leafDark} />
          <path d="M82 30 C72 32 66 40 66 53 C77 52 84 43 82 30 Z" fill={model.leafDark} />
          <path d="M42 45 C50 56 60 58 66 53 C58 45 49 42 42 45 Z" fill={model.leaf} />
          <path d="M90 45 C82 56 72 58 66 53 C74 45 83 42 90 45 Z" fill={model.leaf} />
        </g>
      );
    case 'snake':
      return (
        <g className="buddy-model-crown">
          <path d="M47 56 C41 36 42 18 52 10 C62 26 60 43 55 58 Z" fill={model.leaf} />
          <path d="M66 55 C60 32 63 15 70 7 C80 28 75 45 70 59 Z" fill={model.leafDark} />
          <path d="M83 56 C76 36 78 20 88 13 C98 31 94 47 88 60 Z" fill={model.leaf} />
          <path d="M52 17 C54 31 54 44 52 54 M70 15 C70 31 69 44 67 55 M88 21 C88 35 87 48 85 57" stroke={model.accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        </g>
      );
    case 'fern':
      return (
        <g className="buddy-model-crown">
          <path d="M64 53 C49 43 43 30 44 17" stroke={model.leafDark} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M68 53 C85 43 91 30 90 17" stroke={model.leafDark} strokeWidth="4" strokeLinecap="round" fill="none" />
          {[50, 54, 58].map((x, index) => (
            <ellipse key={`left-${x}`} cx={x} cy={27 + index * 7} rx="11" ry="4.5" fill={model.leaf} transform={`rotate(${-32 + index * 8} ${x} ${27 + index * 7})`} />
          ))}
          {[83, 79, 74].map((x, index) => (
            <ellipse key={`right-${x}`} cx={x} cy={27 + index * 7} rx="11" ry="4.5" fill={model.leaf} transform={`rotate(${32 - index * 8} ${x} ${27 + index * 7})`} />
          ))}
        </g>
      );
    case 'rose':
      return (
        <g className="buddy-model-crown">
          <path d="M52 51 C38 40 41 24 55 26 C57 13 75 13 77 26 C91 24 94 40 80 51 Z" fill={model.accent} />
          <path d="M57 43 C57 34 64 29 67 39 C70 29 78 35 74 44 C68 51 62 50 57 43 Z" fill="#c72f62" opacity="0.78" />
          <path d="M46 52 C37 49 34 40 38 33 M85 52 C95 48 97 39 92 33" stroke={model.leafDark} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'sprout':
    default:
      return (
        <g className="buddy-model-crown">
          <path d="M64 54 C53 40 54 27 65 18 C75 29 75 42 64 54 Z" fill={model.leaf} />
          <path d="M67 54 C77 42 88 39 96 47 C87 59 77 61 67 54 Z" fill={model.leafDark} />
        </g>
      );
  }
}

function Face({ expression, model }: { expression: BuddyFaceExpression; model: SpeciesModel }) {
  const eye = model.eye;
  const strokeProps = {
    stroke: eye,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (expression) {
    case 'wink':
      return (
        <g>
          <circle cx="55" cy="73" r="4" fill={eye} />
          <path d="M76 72 Q82 75 87 72" {...strokeProps} />
          <path d="M58 88 Q68 96 80 88" {...strokeProps} />
        </g>
      );
    case 'blink':
    case 'sleepy':
    case 'cozy':
      return (
        <g>
          <path d="M51 73 Q56 76 61 73" {...strokeProps} />
          <path d="M75 73 Q80 76 85 73" {...strokeProps} />
          <path d="M59 88 Q68 93 78 88" {...strokeProps} />
        </g>
      );
    case 'love':
      return (
        <g>
          <path d="M54 70 C51 66 45 68 46 73 C47 77 54 80 55 82 C57 79 63 76 63 72 C63 67 57 66 54 70 Z" fill="#db2777" />
          <path d="M80 70 C77 66 71 68 72 73 C73 77 80 80 81 82 C83 79 89 76 89 72 C89 67 83 66 80 70 Z" fill="#db2777" />
          <path d="M57 88 Q68 98 81 88" {...strokeProps} />
        </g>
      );
    case 'surprised':
      return (
        <g>
          <circle cx="55" cy="73" r="4.5" fill={eye} />
          <circle cx="81" cy="73" r="4.5" fill={eye} />
          <ellipse cx="68" cy="90" rx="5" ry="6.5" fill={eye} opacity="0.88" />
        </g>
      );
    case 'thinking':
    case 'focused':
      return (
        <g>
          <circle cx="55" cy="73" r="4" fill={eye} />
          <circle cx="82" cy="72" r="4" fill={eye} />
          <path d="M59 89 Q68 85 78 89" {...strokeProps} />
          <path d="M48 66 Q55 63 62 66 M75 65 Q83 62 89 66" {...strokeProps} strokeWidth={2.4} opacity="0.75" />
        </g>
      );
    case 'shy':
      return (
        <g>
          <circle cx="55" cy="74" r="3.4" fill={eye} />
          <circle cx="81" cy="74" r="3.4" fill={eye} />
          <path d="M61 89 Q68 92 76 89" {...strokeProps} />
        </g>
      );
    case 'cheer':
    case 'excited':
    case 'giggle':
      return (
        <g>
          <path d="M50 72 Q55 68 61 72" {...strokeProps} />
          <path d="M75 72 Q81 68 87 72" {...strokeProps} />
          <path d="M55 86 Q68 101 83 86" fill="#7f1d1d" opacity="0.9" />
          <path d="M60 89 Q68 95 78 89" stroke="#fff7ed" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
        </g>
      );
    case 'proud':
      return (
        <g>
          <circle cx="55" cy="73" r="3.7" fill={eye} />
          <circle cx="81" cy="73" r="3.7" fill={eye} />
          <path d="M56 88 Q68 96 82 88" {...strokeProps} />
          <path d="M49 67 L61 65 M75 65 L88 67" {...strokeProps} strokeWidth={2.4} opacity="0.8" />
        </g>
      );
    case 'curious':
      return (
        <g>
          <circle cx="54" cy="74" r="4" fill={eye} />
          <circle cx="82" cy="72" r="5" fill={eye} />
          <path d="M59 89 Q68 92 77 89" {...strokeProps} />
        </g>
      );
    case 'dizzy':
      return (
        <g>
          <path d="M50 70 L61 79 M61 70 L50 79 M76 70 L87 79 M87 70 L76 79" {...strokeProps} strokeWidth={2.6} />
          <path d="M60 89 Q68 92 76 89" {...strokeProps} />
        </g>
      );
    case 'happy':
    default:
      return (
        <g>
          <circle cx="55" cy="73" r="4" fill={eye} />
          <circle cx="81" cy="73" r="4" fill={eye} />
          <path d="M57 88 Q68 97 81 88" {...strokeProps} />
        </g>
      );
  }
}

function Arms({ model }: { model: SpeciesModel }) {
  const common = {
    fill: 'none',
    stroke: model.skinDark,
    strokeWidth: 8,
    strokeLinecap: 'round' as const,
  };

  if (model.pose === 'stoic') {
    return (
      <g className="buddy-model-arms">
        <path d="M43 91 C31 91 27 82 31 74" {...common} />
        <path d="M91 91 C103 91 107 82 103 74" {...common} />
      </g>
    );
  }

  if (model.pose === 'proud') {
    return (
      <g className="buddy-model-arms">
        <path d="M43 90 C31 82 30 70 38 65" {...common} />
        <path d="M91 90 C103 82 104 70 96 65" {...common} />
      </g>
    );
  }

  if (model.pose === 'curious') {
    return (
      <g className="buddy-model-arms">
        <path d="M43 91 C32 94 28 105 35 111" {...common} />
        <path d="M91 88 C104 82 107 68 99 61" {...common} />
      </g>
    );
  }

  return (
    <g className="buddy-model-arms">
      <path d="M44 89 C31 84 25 73 30 62" {...common} />
      <path d="M90 89 C103 84 109 73 104 62" {...common} />
    </g>
  );
}

export default function BuddyCharacterModel({
  speciesId,
  expression,
  size = 'md',
  variant = 'default',
}: BuddyCharacterModelProps) {
  const model = modelFor(speciesId);
  const dimensions = variant === 'companion' ? COMPANION_SIZE_CLASS[size] : SIZE_CLASS[size];
  const gradientId = `buddyBody-${speciesId}`;
  const highlightId = `buddyHighlight-${speciesId}`;

  return (
    <svg
      viewBox="0 0 132 150"
      className={`buddy-character-model ${dimensions}`}
      role="img"
      aria-label="Plant Buddy character"
    >
      <defs>
        <linearGradient id={gradientId} x1="38" y1="52" x2="92" y2="127" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={model.skin} />
          <stop offset="1" stopColor={model.skinDark} />
        </linearGradient>
        <radialGradient id={highlightId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(55 63) rotate(55) scale(70 44)">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="66" cy="139" rx="34" ry="7" fill="#064e3b" opacity="0.14" />
      <Crown model={model} />
      <Arms model={model} />
      <path d="M56 116 C50 126 47 134 41 140" stroke={model.skinDark} strokeWidth="8" strokeLinecap="round" fill="none" className="buddy-model-leg buddy-model-leg-left" />
      <path d="M77 116 C84 126 88 134 95 140" stroke={model.skinDark} strokeWidth="8" strokeLinecap="round" fill="none" className="buddy-model-leg buddy-model-leg-right" />
      <path d="M40 79 C40 51 55 43 66 43 C82 43 96 54 96 82 C96 112 84 128 67 128 C50 128 40 110 40 79 Z" fill={`url(#${gradientId})`} />
      <path d="M44 78 C45 56 57 49 67 49 C80 49 91 59 91 82 C91 106 81 121 68 121 C54 121 44 106 44 78 Z" fill={`url(#${highlightId})`} />
      <path d="M48 61 C58 52 76 51 87 64" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
      <circle cx="48" cy="85" r="5" fill={model.cheek} opacity="0.52" />
      <circle cx="90" cy="85" r="5" fill={model.cheek} opacity="0.52" />
      <Face expression={expression} model={model} />
      <path d="M43 111 C56 123 81 123 94 111" stroke="#064e3b" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.18" />
      <path d="M31 62 C28 57 29 52 34 49" stroke={model.leafDark} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M102 62 C106 57 105 52 100 49" stroke={model.leafDark} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );
}
