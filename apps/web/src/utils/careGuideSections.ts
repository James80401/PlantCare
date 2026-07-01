export interface CareGuideSectionLike {
  heading: string;
  body: string;
}

export type PlantCareTopicId =
  | 'water'
  | 'season'
  | 'light'
  | 'soil'
  | 'humidity'
  | 'temperature'
  | 'fertilizer'
  | 'pruning'
  | 'repotting'
  | 'propagation'
  | 'pests'
  | 'troubleshooting'
  | 'toxicity'
  | 'notes';

const TOPIC_META: Record<PlantCareTopicId, CareSectionMeta> = {
  water: {
    label: 'Water',
    intent: 'How often and how much to water this plant.',
    tone: 'action',
  },
  season: {
    label: 'Season',
    intent: 'How daylight, weather, and plant age change care right now.',
    tone: 'seasonal',
  },
  light: {
    label: 'Light',
    intent: 'Placement and sun exposure for healthy growth.',
    tone: 'why',
  },
  soil: {
    label: 'Soil',
    intent: 'Mix, drainage, and pH for strong roots.',
    tone: 'reference',
  },
  humidity: {
    label: 'Humidity',
    intent: 'Where it grows and moisture in the air.',
    tone: 'seasonal',
  },
  temperature: {
    label: 'Temperature',
    intent: 'Avoid drafts and cold or heat stress.',
    tone: 'reference',
  },
  fertilizer: {
    label: 'Feed',
    intent: 'When and how to fertilize during active growth.',
    tone: 'action',
  },
  pruning: {
    label: 'Prune',
    intent: 'Trim damaged growth and shape the plant.',
    tone: 'action',
  },
  repotting: {
    label: 'Repot',
    intent: 'When to move up a pot size and refresh soil.',
    tone: 'seasonal',
  },
  propagation: {
    label: 'Propagate',
    intent: 'Start new plants from healthy material.',
    tone: 'reference',
  },
  pests: {
    label: 'Pests',
    intent: 'Spot problems early before they spread.',
    tone: 'warning',
  },
  troubleshooting: {
    label: 'Troubleshoot',
    intent: 'Stabilize symptoms and ask Dr. Plant with context.',
    tone: 'warning',
  },
  toxicity: {
    label: 'Safety',
    intent: 'Pet, child, and handling safety.',
    tone: 'warning',
  },
  notes: {
    label: 'Your notes',
    intent: 'Personal reminders for this plant.',
    tone: 'reference',
  },
};

export function getStructuredCareSectionMeta(
  topicId: PlantCareTopicId,
  heading: string,
): CareSectionMeta {
  return TOPIC_META[topicId] ?? getCareSectionMeta(heading);
}

export interface CareSectionMeta {
  label: string;
  intent: string;
  tone: 'action' | 'why' | 'warning' | 'seasonal' | 'reference';
}

export function getCareSectionMeta(heading: string): CareSectionMeta {
  const normalized = heading.toLowerCase();

  if (
    normalized.includes('before') ||
    normalized.includes('how') ||
    normalized.includes('step') ||
    normalized.includes('technique') ||
    normalized.includes('application') ||
    normalized.includes('checklist') ||
    normalized.includes('when to')
  ) {
    return {
      label: 'What to do now',
      intent: 'Actionable steps for this care task.',
      tone: 'action',
    };
  }

  if (
    normalized.includes('why') ||
    normalized.includes('signs') ||
    normalized.includes('symptoms') ||
    normalized.includes('trouble')
  ) {
    return {
      label: 'Why this matters',
      intent: 'Signals to watch so you can adjust care with confidence.',
      tone: 'why',
    };
  }

  if (
    normalized.includes('mistake') ||
    normalized.includes('skip') ||
    normalized.includes('over') ||
    normalized.includes('treatment')
  ) {
    return {
      label: 'Avoid this',
      intent: 'Common pitfalls and warning signs for this plant.',
      tone: 'warning',
    };
  }

  if (normalized.includes('season') || normalized.includes('after-care')) {
    return {
      label: 'Adjust over time',
      intent: 'How this care changes by season or after recent work.',
      tone: 'seasonal',
    };
  }

  return {
    label: 'Reference',
    intent: 'Helpful details for this plant and care task.',
    tone: 'reference',
  };
}

export function sectionLead(section: CareGuideSectionLike): string {
  const lines = section.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const firstUsefulLine = lines[0] ?? '';
  const withoutListMarker = firstUsefulLine
    .replace(/^\d+\.\s+/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .trim();

  if (withoutListMarker.length <= 150) return withoutListMarker;
  return `${withoutListMarker.slice(0, 147).trim()}...`;
}

export function careSectionToneClasses(tone: CareSectionMeta['tone']) {
  const classes = {
    action: {
      card: 'border-emerald-100 bg-emerald-50/35',
      badge: 'bg-emerald-700 text-white',
    },
    why: {
      card: 'border-sky-100 bg-sky-50/45',
      badge: 'bg-sky-700 text-white',
    },
    warning: {
      card: 'border-amber-100 bg-amber-50/55',
      badge: 'bg-amber-700 text-white',
    },
    seasonal: {
      card: 'border-lime-100 bg-lime-50/45',
      badge: 'bg-lime-700 text-white',
    },
    reference: {
      card: 'border-gray-100 bg-gray-50/70',
      badge: 'bg-gray-700 text-white',
    },
  };

  return classes[tone];
}
