import type { JourneyDiscovery } from '../../hooks/buddy/types';

type BiomeVisual = {
  sky: string;
  ground: string;
  path: string;
  landmark: string;
  encounter: string;
  tone: string;
};

const BIOME_VISUALS: Record<string, BiomeVisual> = {
  seed_garden: {
    sky: 'from-sky-200 via-lime-100 to-emerald-300',
    ground: 'bg-emerald-700/25',
    path: 'bg-amber-100/55',
    landmark: 'sprout arches',
    encounter: 'Beetle keeper',
    tone: 'text-emerald-950',
  },
  forest_floor: {
    sky: 'from-emerald-900 via-lime-300 to-amber-200',
    ground: 'bg-emerald-950/35',
    path: 'bg-lime-100/45',
    landmark: 'mossy trail',
    encounter: 'Moss friend',
    tone: 'text-emerald-950',
  },
  desert_oasis: {
    sky: 'from-orange-200 via-yellow-100 to-cyan-200',
    ground: 'bg-orange-600/25',
    path: 'bg-yellow-100/60',
    landmark: 'oasis stones',
    encounter: 'Sun-skipper',
    tone: 'text-amber-950',
  },
};

export function biomeVisual(biomeId?: string | null): BiomeVisual {
  return BIOME_VISUALS[biomeId ?? ''] ?? BIOME_VISUALS.seed_garden;
}

export function encounterForDiscovery(discovery?: Pick<JourneyDiscovery, 'id' | 'biomeId'> | null) {
  const explicit = discovery as
    | (Pick<JourneyDiscovery, 'id' | 'biomeId'> &
        Partial<Pick<JourneyDiscovery, 'encounterName' | 'encounterRole'>>)
    | null
    | undefined;
  if (explicit?.encounterName) {
    return {
      name: explicit.encounterName,
      role: explicit.encounterRole ?? 'new encounter',
      face: explicit.encounterRole === 'frenemy' ? 'o_o' : '*-*',
      body: explicit.encounterRole === 'frenemy' ? 'bg-yellow-700' : 'bg-emerald-500',
      shell: explicit.encounterRole === 'guide' ? 'bg-sky-100' : 'bg-lime-200',
    };
  }

  const id = discovery?.id ?? '';
  if (id.includes('beetle') || id.includes('mushroom')) {
    return {
      name: 'Buttoncap Beetle',
      role: 'curious friend',
      face: '•ᴗ•',
      body: 'bg-amber-500',
      shell: 'bg-red-500',
    };
  }
  if (id.includes('dew')) {
    return {
      name: 'Dewdrop Sprite',
      role: 'shimmering friend',
      face: '✦',
      body: 'bg-sky-300',
      shell: 'bg-cyan-100',
    };
  }
  if (id.includes('moss')) {
    return {
      name: 'Moss Mender',
      role: 'gentle guide',
      face: '–ᴗ–',
      body: 'bg-lime-600',
      shell: 'bg-emerald-300',
    };
  }
  if (id.includes('trail') || id.includes('woodland')) {
    return {
      name: 'Acorn Trickster',
      role: 'possible frenemy',
      face: '•⩊•',
      body: 'bg-yellow-700',
      shell: 'bg-amber-300',
    };
  }
  if (discovery?.biomeId === 'desert_oasis') {
    return {
      name: 'Sun-skipper',
      role: 'bright wanderer',
      face: '•◡•',
      body: 'bg-orange-400',
      shell: 'bg-yellow-200',
    };
  }
  return {
    name: 'Garden Stranger',
    role: 'new encounter',
    face: '•ᴗ•',
    body: 'bg-emerald-500',
    shell: 'bg-lime-200',
  };
}

export function EncounterFigure({
  discovery,
  biomeId,
  size = 'md',
  className = '',
}: {
  discovery?: Pick<JourneyDiscovery, 'id' | 'biomeId'> | null;
  biomeId?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const encounter = encounterForDiscovery(discovery ?? (biomeId ? { id: '', biomeId } : null));
  const dimensions = size === 'sm' ? 'h-14 w-14 text-xs' : 'h-20 w-20 text-sm';

  return (
    <div className={`relative ${dimensions} ${className}`} title={`${encounter.name}, ${encounter.role}`}>
      <div className={`absolute inset-x-2 bottom-0 h-[72%] rounded-full ${encounter.body} shadow-md ring-2 ring-white/60`} />
      <div className={`absolute left-1/2 top-0 h-[52%] w-[72%] -translate-x-1/2 rounded-t-full ${encounter.shell} shadow-sm ring-2 ring-white/60`} />
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full bg-white/80 px-1.5 py-0.5 font-bold text-emerald-950">
        {encounter.face}
      </div>
      <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-yellow-100 shadow-[0_0_12px_rgba(254,240,138,.9)]" />
    </div>
  );
}

export function TravelLandmarks({ biomeId }: { biomeId?: string | null }) {
  const key = biomeId ?? 'seed_garden';

  if (key === 'forest_floor') {
    return (
      <>
        <div className="absolute -left-8 bottom-20 h-44 w-20 rounded-t-full bg-emerald-950/45" />
        <div className="absolute left-3 bottom-36 h-20 w-32 rounded-full bg-emerald-800/65" />
        <div className="absolute right-5 bottom-28 h-16 w-28 rounded-full bg-lime-700/55" />
        <div className="absolute right-12 bottom-16 h-8 w-14 rounded-full bg-emerald-900/35" />
      </>
    );
  }

  if (key === 'desert_oasis') {
    return (
      <>
        <div className="absolute left-6 bottom-20 h-16 w-28 rounded-[50%] bg-cyan-300/65 shadow-inner" />
        <div className="absolute left-12 bottom-32 h-20 w-4 rounded-full bg-amber-800" />
        <div className="absolute left-4 bottom-44 h-12 w-16 rounded-full bg-emerald-500/80" />
        <div className="absolute right-8 bottom-16 h-10 w-20 rounded-full bg-orange-700/25" />
      </>
    );
  }

  return (
    <>
      <div className="absolute left-6 bottom-20 h-24 w-16 rounded-t-full border-4 border-emerald-600/40 border-b-0" />
      <div className="absolute right-10 bottom-24 h-20 w-20 rounded-full bg-lime-500/35" />
      <div className="absolute right-16 bottom-44 h-8 w-8 rounded-full bg-red-400/70" />
    </>
  );
}

export function DiscoveryEncounterCard({
  discovery,
  dewdropsEarned,
}: {
  discovery: JourneyDiscovery;
  dewdropsEarned: number;
}) {
  const encounter = encounterForDiscovery(discovery);
  const visual = biomeVisual(discovery.biomeId);

  return (
    <div className={`overflow-hidden rounded-3xl bg-gradient-to-b ${visual.sky} p-4 shadow-inner`}>
      <div className="flex items-center gap-4">
        <EncounterFigure discovery={discovery} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {discovery.title ?? 'Journey encounter'}
          </p>
          <p className={`text-sm font-bold ${visual.tone}`}>{encounter.name}</p>
          <p className="text-xs font-semibold text-emerald-900/80">
            {encounter.role}
            {discovery.encounterMood ? ` - ${discovery.encounterMood}` : ''}
          </p>
          <p className="mt-1 text-xs text-gray-700">Returned with +{dewdropsEarned} dewdrops.</p>
          {discovery.rewardFocus ? (
            <p className="mt-1 text-xs font-semibold text-amber-900">
              Focus: {discovery.rewardFocus}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function JourneyWorldStatus({
  biomeId,
  biomeName,
  tasksCompleted,
  minutesSaved,
}: {
  biomeId?: string | null;
  biomeName: string;
  tasksCompleted: number;
  minutesSaved: number;
}) {
  const visual = biomeVisual(biomeId);
  const encounter = encounterForDiscovery(biomeId ? { id: '', biomeId } : null);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Biome</p>
        <p className="mt-1 text-sm font-bold text-emerald-950">{biomeName}</p>
        <p className="mt-1 text-xs text-gray-500">{visual.landmark}</p>
      </div>
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Nearby</p>
        <p className="mt-1 text-sm font-bold text-amber-950">{encounter.name}</p>
        <p className="mt-1 text-xs text-gray-600">{encounter.role}</p>
      </div>
      <div className="rounded-3xl border border-sky-100 bg-sky-50 p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Care boost</p>
        <p className="mt-1 text-sm font-bold text-sky-950">{tasksCompleted} tasks</p>
        <p className="mt-1 text-xs text-gray-600">About {minutesSaved} min saved</p>
      </div>
    </div>
  );
}
