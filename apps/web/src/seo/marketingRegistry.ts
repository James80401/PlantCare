import type { PublicSiteConfig, PublicSiteMode } from './siteConfig';

export type MarketingRouteKind =
  | 'landing'
  | 'waitlist'
  | 'app'
  | 'beginner'
  | 'problem-index'
  | 'problem'
  | 'guide-index'
  | 'species';

export type StructuredDataKind = 'organization' | 'softwareApplication' | 'breadcrumb' | 'article';

export interface MarketingRouteMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  summary: string;
  kind: MarketingRouteKind;
  ctaLabel: string;
  /**
   * The single head/long-tail term this page is allowed to own (cannibalization
   * control). No two routes may share one — enforced by marketingRegistry.test.
   */
  primaryKeyword: string;
  sitemapPriority: number;
  indexableByMode: Record<PublicSiteMode, boolean>;
  structuredData: StructuredDataKind[];
  socialImage?: string;
  lastmod?: string;
}

export interface ProblemGuide {
  slug: string;
  symptom: string;
  title: string;
  description: string;
  checks: string[];
  recovery: string[];
}

export interface SpeciesGuide {
  slug: string;
  commonName: string;
  scientificName: string;
  title: string;
  description: string;
  careRhythm: string[];
  beginnerRisks: string[];
}

const SOCIAL_IMAGE = '/icons/icon.svg';
const LAUNCH_INDEX: Record<PublicSiteMode, boolean> = {
  private: false,
  teaser: false,
  launch: true,
};
const TEASER_INDEX: Record<PublicSiteMode, boolean> = {
  private: false,
  teaser: true,
  launch: true,
};

export const problemGuides: ProblemGuide[] = [
  {
    slug: 'yellow-leaves',
    symptom: 'Yellow leaves',
    title: 'Yellow Leaves on Houseplants: Beginner Diagnosis Guide',
    description:
      'Learn the common reasons houseplant leaves turn yellow and when to ask Dr. Plant for a recovery plan.',
    checks: ['Recent watering frequency', 'Soil moisture below the surface', 'Lower leaves versus new growth'],
    recovery: ['Pause fertilizing until the cause is clear', 'Check drainage before watering again', 'Photograph the full plant and the affected leaves'],
  },
  {
    slug: 'brown-tips',
    symptom: 'Brown tips',
    title: 'Brown Leaf Tips: What Your Houseplant Is Telling You',
    description:
      'A beginner-friendly guide to brown tips, dry edges, humidity stress, watering swings, and mineral buildup.',
    checks: ['Dry air or heat vents', 'Watering swings', 'Crispy edges versus soft brown tissue'],
    recovery: ['Trim only fully dry tissue', 'Stabilize watering before making big changes', 'Compare older and newer leaves over a week'],
  },
  {
    slug: 'drooping-leaves',
    symptom: 'Drooping leaves',
    title: 'Drooping Houseplant Leaves: Overwatered, Underwatered, or Shocked?',
    description:
      'Sort through the common causes of drooping leaves and turn symptoms into the next best care step.',
    checks: ['Pot weight and soil moisture', 'Recent move, repot, or temperature change', 'Stem firmness'],
    recovery: ['Avoid adding water until soil is checked', 'Move the plant out of harsh sun while it recovers', 'Track whether leaves rebound by evening'],
  },
  {
    slug: 'root-rot',
    symptom: 'Root rot',
    title: 'Root Rot Warning Signs and First Steps',
    description:
      'Learn the root rot warning signs beginners can spot before a plant declines too far.',
    checks: ['Sour smell from soil', 'Soft stems near the soil line', 'Wet soil that stays wet for days'],
    recovery: ['Stop watering immediately', 'Inspect drainage and roots if symptoms are severe', 'Ask Dr. Plant before cutting roots if you are unsure'],
  },
];

export const speciesGuides: SpeciesGuide[] = [
  {
    slug: 'pothos',
    commonName: 'Pothos',
    scientificName: 'Epipremnum aureum',
    title: 'Pothos Care for Beginners',
    description: 'Simple pothos watering, light, pruning, and rescue tips for new houseplant owners.',
    careRhythm: ['Let the top soil dry before watering', 'Bright indirect light keeps growth fuller', 'Trim long vines to encourage branching'],
    beginnerRisks: ['Watering on a fixed calendar', 'Leaving the pot in standing water', 'Ignoring yellowing lower leaves'],
  },
  {
    slug: 'monstera',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    title: 'Monstera Care for Beginners',
    description: 'A beginner guide to monstera light, watering, support, leaf splits, and recovery signals.',
    careRhythm: ['Use bright indirect light', 'Water after the upper soil dries', 'Add support as stems get heavy'],
    beginnerRisks: ['Low light that slows fenestration', 'Oversized pots that hold too much moisture', 'Letting dust block leaf light'],
  },
  {
    slug: 'snake-plant',
    commonName: 'Snake plant',
    scientificName: 'Dracaena trifasciata',
    title: 'Snake Plant Care for Beginners',
    description: 'Keep a snake plant healthy with low-water routines and simple light checks.',
    careRhythm: ['Water sparingly and let soil dry well', 'Tolerates low light but grows faster in brighter rooms', 'Use a draining potting mix'],
    beginnerRisks: ['Frequent small waterings', 'Cold drafts', 'Dense soil that never dries'],
  },
  {
    slug: 'peace-lily',
    commonName: 'Peace lily',
    scientificName: 'Spathiphyllum',
    title: 'Peace Lily Care for Beginners',
    description: 'Understand peace lily droop, watering, light, blooms, and leaf browning without panic.',
    careRhythm: ['Water when leaves begin to soften slightly', 'Use medium to bright indirect light', 'Remove spent blooms at the base'],
    beginnerRisks: ['Letting the plant fully collapse often', 'Direct sun scorch', 'Assuming every brown tip means disease'],
  },
  {
    slug: 'spider-plant',
    commonName: 'Spider plant',
    scientificName: 'Chlorophytum comosum',
    title: 'Spider Plant Care for Beginners',
    description: 'A simple beginner guide to spider plant watering, pups, brown tips, and light.',
    careRhythm: ['Keep soil lightly moist, not soggy', 'Use bright indirect light for more pups', 'Trim brown tips for appearance only'],
    beginnerRisks: ['Mineral-heavy water', 'Overcrowded pots', 'Treating pups before they have roots'],
  },
  {
    slug: 'philodendron',
    commonName: 'Philodendron',
    scientificName: 'Philodendron hederaceum',
    title: 'Philodendron Care for Beginners',
    description: 'Beginner care for heartleaf philodendron watering, vines, yellow leaves, and light.',
    careRhythm: ['Let upper soil dry between waterings', 'Give bright filtered light', 'Pinch leggy vines for fuller growth'],
    beginnerRisks: ['Dark corners that stretch growth', 'Constantly wet soil', 'Skipping pest checks under leaves'],
  },
  {
    slug: 'fiddle-leaf-fig',
    commonName: 'Fiddle leaf fig',
    scientificName: 'Ficus lyrata',
    title: 'Fiddle Leaf Fig Care for Beginners',
    description: 'A calmer beginner path for fiddle leaf fig light, watering consistency, leaf drop, and brown spots.',
    careRhythm: ['Keep light bright and consistent', 'Water deeply after the top soil dries', 'Rotate gradually for even growth'],
    beginnerRisks: ['Moving it repeatedly', 'Cold windows', 'Small frequent waterings'],
  },
  {
    slug: 'aloe',
    commonName: 'Aloe',
    scientificName: 'Aloe vera',
    title: 'Aloe Care for Beginners',
    description: 'A beginner guide to aloe light, watering, soft leaves, pups, and potting mix.',
    careRhythm: ['Use bright light', 'Let soil dry thoroughly', 'Choose gritty, fast-draining mix'],
    beginnerRisks: ['Watering like a tropical plant', 'Low light stretching', 'Pots without drainage'],
  },
  {
    slug: 'zz-plant',
    commonName: 'ZZ plant',
    scientificName: 'Zamioculcas zamiifolia',
    title: 'ZZ Plant Care for Beginners',
    description: 'Low-maintenance ZZ plant care for watering, light, yellow stems, and slow growth.',
    careRhythm: ['Water only after soil dries deeply', 'Accepts low light but prefers medium indirect light', 'Wipe leaves to keep them glossy'],
    beginnerRisks: ['Overwatering rhizomes', 'Expecting fast growth', 'Repotting too often'],
  },
  {
    slug: 'orchid',
    commonName: 'Orchid',
    scientificName: 'Phalaenopsis',
    title: 'Orchid Care for Beginners',
    description: 'Beginner phalaenopsis orchid care for watering, roots, reblooming, and light.',
    careRhythm: ['Water when roots turn silvery', 'Use bright indirect light', 'Let bark drain fully'],
    beginnerRisks: ['Letting water sit in the crown', 'Treating bark like soil', 'Cutting healthy green spikes too early'],
  },
];

const coreRoutes: MarketingRouteMeta[] = [
  {
    path: '/',
    title: 'Dr. Plant - AI Plant Doctor and Houseplant Care Assistant',
    description:
      'Dr. Plant helps beginner plant parents diagnose symptoms, build recovery plans, and keep houseplants on a calmer care routine.',
    h1: 'Dr. Plant',
    eyebrow: 'Private pre-launch preview',
    summary:
      'An AI plant doctor for beginners who need a clear next step when leaves yellow, stems droop, or watering gets confusing.',
    kind: 'landing',
    ctaLabel: 'Start with your first plant',
    primaryKeyword: 'dr plant',
    sitemapPriority: 1,
    indexableByMode: TEASER_INDEX,
    structuredData: ['organization', 'softwareApplication', 'breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/waitlist',
    title: 'Join the Dr. Plant Private Testing List',
    description:
      'Request private access to Dr. Plant before public launch and help shape the beginner houseplant care experience.',
    h1: 'Join the private Dr. Plant preview',
    eyebrow: 'Invite-only testing',
    summary:
      'Dr. Plant is staying private until launch, but this page is ready for a controlled teaser or testing phase.',
    kind: 'waitlist',
    ctaLabel: 'Request access',
    primaryKeyword: 'dr plant waitlist',
    sitemapPriority: 0.8,
    indexableByMode: TEASER_INDEX,
    structuredData: ['organization', 'breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/plant-diagnosis-app',
    title: 'Plant Diagnosis App for Beginner Houseplant Owners',
    description:
      'Describe symptoms, add photos, and turn Dr. Plant diagnosis into a practical recovery plan for each houseplant.',
    h1: 'Plant diagnosis that turns symptoms into next steps',
    eyebrow: 'Dr. Plant diagnosis',
    summary:
      'Use a guided plant health chat to organize symptoms, photos, likely causes, and follow-up care tasks.',
    kind: 'app',
    ctaLabel: 'Diagnose this plant',
    primaryKeyword: 'plant diagnosis app',
    sitemapPriority: 0.9,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['softwareApplication', 'breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/plant-care-app',
    title: 'Plant Care App for Houseplant Beginners',
    description:
      'Track plants, care tasks, health notes, and beginner-friendly guidance in one private plant care app.',
    h1: 'A calmer plant care app for beginners',
    eyebrow: 'Plant care routines',
    summary:
      'Dr. Plant keeps care simple: add a plant, follow the schedule, and ask for help when something looks off.',
    kind: 'app',
    ctaLabel: 'Create your care routine',
    primaryKeyword: 'plant care app',
    sitemapPriority: 0.9,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['softwareApplication', 'breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/plant-watering-reminder-app',
    title: 'Plant Watering Reminder App That Avoids Overwatering',
    description:
      'Build watering reminders around each plant, pot, and recovery state instead of guessing from a calendar.',
    h1: 'Watering reminders that respect the plant',
    eyebrow: 'Watering without panic',
    summary:
      'Use reminders as a care checkpoint, not a blind calendar. Dr. Plant helps beginners notice when a plant needs a different rhythm.',
    kind: 'app',
    ctaLabel: 'Build a watering routine',
    primaryKeyword: 'plant watering reminder app',
    sitemapPriority: 0.85,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['softwareApplication', 'breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/houseplant-care-for-beginners',
    title: 'Houseplant Care for Beginners: A Simple Recovery-First Guide',
    description:
      'A beginner guide to watering, light, yellow leaves, brown tips, and using Dr. Plant when your houseplant needs help.',
    h1: 'Houseplant care for beginners',
    eyebrow: 'Beginner care guide',
    summary:
      'Start with the basics that prevent most plant problems: light, water, drainage, observation, and patient recovery.',
    kind: 'beginner',
    ctaLabel: 'Start with your first plant',
    primaryKeyword: 'houseplant care for beginners',
    sitemapPriority: 0.85,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['breadcrumb', 'article'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/plant-problems',
    title: 'Houseplant Problem Guides for Beginners',
    description:
      'Browse beginner-friendly guides for yellow leaves, brown tips, drooping leaves, root rot, and other houseplant symptoms.',
    h1: 'Houseplant problem guides',
    eyebrow: 'Symptom library',
    summary:
      'Start with the symptom you can see, then use Dr. Plant to narrow down what changed and what to do next.',
    kind: 'problem-index',
    ctaLabel: 'Diagnose this plant',
    primaryKeyword: 'plant problems',
    sitemapPriority: 0.8,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
  {
    path: '/plant-care-guides',
    title: 'Beginner Plant Care Guides by Species',
    description:
      'Browse beginner care guides for pothos, monstera, snake plant, peace lily, spider plant, philodendron, and more.',
    h1: 'Plant care guides by species',
    eyebrow: 'Beginner species guides',
    summary:
      'Learn the care rhythm, common beginner mistakes, and recovery clues for popular houseplants.',
    kind: 'guide-index',
    ctaLabel: 'Create a care schedule',
    primaryKeyword: 'plant care guides',
    sitemapPriority: 0.8,
    indexableByMode: LAUNCH_INDEX,
    structuredData: ['breadcrumb'],
    socialImage: SOCIAL_IMAGE,
  },
];

const problemRoutes: MarketingRouteMeta[] = problemGuides.map((guide) => ({
  path: `/plant-problems/${guide.slug}`,
  title: guide.title,
  description: guide.description,
  h1: guide.symptom,
  eyebrow: 'Plant problem guide',
  summary: guide.description,
  kind: 'problem',
  ctaLabel: 'Diagnose this plant with Dr. Plant',
  // Specific long-tail symptom term only — never the `/plant-problems` head term.
  primaryKeyword: `${guide.symptom.toLowerCase()} on houseplant`,
  sitemapPriority: 0.7,
  indexableByMode: LAUNCH_INDEX,
  structuredData: ['breadcrumb', 'article'],
  socialImage: SOCIAL_IMAGE,
}));

const speciesRoutes: MarketingRouteMeta[] = speciesGuides.map((guide) => ({
  path: `/plant-care-guides/${guide.slug}`,
  title: guide.title,
  description: guide.description,
  h1: guide.title,
  eyebrow: `${guide.commonName} care guide`,
  summary: guide.description,
  kind: 'species',
  ctaLabel: 'Create a care schedule for this plant',
  // Specific species term only — never the `/plant-care-guides` head term.
  primaryKeyword: `${guide.commonName.toLowerCase()} care`,
  sitemapPriority: 0.65,
  indexableByMode: LAUNCH_INDEX,
  structuredData: ['breadcrumb', 'article'],
  socialImage: SOCIAL_IMAGE,
}));

export const marketingRoutes: MarketingRouteMeta[] = [
  ...coreRoutes,
  ...problemRoutes,
  ...speciesRoutes,
];

export const authAndProtectedPathPrefixes = [
  '/admin',
  '/garden',
  '/login',
  '/register',
  '/verify-email',
  '/resend-verification',
  '/forgot-password',
  '/reset-password',
];

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export function findMarketingRoute(pathname: string) {
  const normalized = normalizePathname(pathname);
  return marketingRoutes.find((route) => route.path === normalized) ?? null;
}

export function findProblemGuide(pathname: string) {
  const route = findMarketingRoute(pathname);
  if (route?.kind !== 'problem') return null;
  return problemGuides.find((guide) => `/plant-problems/${guide.slug}` === route.path) ?? null;
}

export function findSpeciesGuide(pathname: string) {
  const route = findMarketingRoute(pathname);
  if (route?.kind !== 'species') return null;
  return speciesGuides.find((guide) => `/plant-care-guides/${guide.slug}` === route.path) ?? null;
}

export function isAuthOrProtectedPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return authAndProtectedPathPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function isMarketingRouteIndexable(route: MarketingRouteMeta, config: PublicSiteConfig) {
  return config.marketingIndexable && route.indexableByMode[config.mode];
}

export function indexableMarketingRoutes(config: PublicSiteConfig) {
  return marketingRoutes.filter((route) => isMarketingRouteIndexable(route, config));
}
