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
   * control). No two routes may share one; enforced by marketingRegistry.test.
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
  overview: string;
  checks: string[];
  likelyCauses: string[];
  recovery: string[];
  mistakesToAvoid: string[];
  whenToAskForHelp: string[];
  drPlantPrompt: string;
  relatedLinks: MarketingInternalLink[];
}

export interface SpeciesGuide {
  slug: string;
  commonName: string;
  scientificName: string;
  title: string;
  description: string;
  light: string;
  watering: string;
  firstWeek: string[];
  careRhythm: string[];
  beginnerRisks: string[];
  symptomsToWatch: string[];
  relatedProblemSlugs: string[];
  petSafetyNote: string;
}

export interface MarketingInternalLink {
  to: string;
  label: string;
  description: string;
}

const SOCIAL_IMAGE = '/marketing/og-dr-plant.png';
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
    overview:
      'Yellow leaves are a signal, not a diagnosis. Beginners usually need to compare watering, light, leaf age, and recent care changes before deciding what to do.',
    checks: ['Recent watering frequency', 'Soil moisture below the surface', 'Lower leaves versus new growth'],
    likelyCauses: ['Overwatering or slow-drying soil', 'Normal older-leaf turnover', 'Low light stress', 'A recent move, repot, or fertilizer change'],
    recovery: ['Pause fertilizing until the cause is clear', 'Check drainage before watering again', 'Photograph the full plant and the affected leaves'],
    mistakesToAvoid: ['Watering again without checking the soil', 'Cutting every yellowing leaf at once', 'Adding fertilizer to a stressed plant'],
    whenToAskForHelp: ['Several leaves yellow quickly', 'Stems feel soft near the soil', 'Yellowing appears with pests, odor, or black spots'],
    drPlantPrompt:
      'Tell Dr. Plant when the leaf changed, how wet the soil feels two inches down, and whether yellowing is on old leaves or new growth.',
    relatedLinks: [
      {
        to: '/plant-diagnosis-app',
        label: 'Plant diagnosis app',
        description: 'Turn yellow leaves, photos, and recent care changes into a recovery plan.',
      },
      {
        to: '/plant-watering-reminder-app',
        label: 'Watering reminders',
        description: 'Use watering tasks as a check-in instead of a blind calendar.',
      },
    ],
  },
  {
    slug: 'brown-tips',
    symptom: 'Brown tips',
    title: 'Brown Leaf Tips: What Your Houseplant Is Telling You',
    description:
      'A beginner-friendly guide to brown tips, dry edges, humidity stress, watering swings, and mineral buildup.',
    overview:
      'Brown tips often show stress at the oldest or thinnest part of a leaf. They can come from dry air, inconsistent watering, mineral buildup, or old damage that will not turn green again.',
    checks: ['Dry air or heat vents', 'Watering swings', 'Crispy edges versus soft brown tissue'],
    likelyCauses: ['Dry indoor air', 'Watering swings from too dry to too wet', 'Mineral-heavy water or fertilizer buildup', 'Old leaf damage from a previous care issue'],
    recovery: ['Trim only fully dry tissue', 'Stabilize watering before making big changes', 'Compare older and newer leaves over a week'],
    mistakesToAvoid: ['Treating every brown tip as disease', 'Misting once and expecting recovery', 'Removing healthy green leaf tissue'],
    whenToAskForHelp: ['Brown areas are soft or spreading', 'Several leaves decline at the same time', 'Brown tips appear with webbing, sticky residue, or black spots'],
    drPlantPrompt:
      'Show Dr. Plant a close-up of the tip, the full plant, and where it sits in the room so it can compare air, water, and light clues.',
    relatedLinks: [
      {
        to: '/houseplant-care-for-beginners',
        label: 'Beginner care basics',
        description: 'Learn the light, water, and observation habits that prevent most tip damage.',
      },
      {
        to: '/plant-diagnosis-app',
        label: 'Ask Dr. Plant',
        description: 'Use photos and context to decide whether brown tips are stable or spreading.',
      },
    ],
  },
  {
    slug: 'drooping-leaves',
    symptom: 'Drooping leaves',
    title: 'Drooping Houseplant Leaves: Overwatered, Underwatered, or Shocked?',
    description:
      'Sort through the common causes of drooping leaves and turn symptoms into the next best care step.',
    overview:
      'Drooping can mean thirst, too much water, heat stress, cold stress, or transplant shock. The safest first step is to check conditions before adding more water.',
    checks: ['Pot weight and soil moisture', 'Recent move, repot, or temperature change', 'Stem firmness'],
    likelyCauses: ['Dry soil and thirst', 'Wet soil limiting oxygen around roots', 'A recent move or repot', 'Temperature swings near a vent or window'],
    recovery: ['Avoid adding water until soil is checked', 'Move the plant out of harsh sun while it recovers', 'Track whether leaves rebound by evening'],
    mistakesToAvoid: ['Assuming droop always means underwatering', 'Moving the plant repeatedly in one day', 'Repotting a stressed plant before checking soil moisture'],
    whenToAskForHelp: ['Droop does not improve after conditions stabilize', 'Leaves feel mushy or translucent', 'The stem collapses near the soil line'],
    drPlantPrompt:
      'Tell Dr. Plant whether the soil is dry or wet, when the plant last moved, and whether leaves rebound at night or stay limp.',
    relatedLinks: [
      {
        to: '/plant-problems/root-rot',
        label: 'Root rot warning signs',
        description: 'Check whether drooping is paired with slow-drying soil or soft stems.',
      },
      {
        to: '/plant-diagnosis-app',
        label: 'Diagnose drooping leaves',
        description: 'Compare watering, light, and recent changes before choosing a fix.',
      },
    ],
  },
  {
    slug: 'root-rot',
    symptom: 'Root rot',
    title: 'Root Rot Warning Signs and First Steps',
    description:
      'Learn the root rot warning signs beginners can spot before a plant declines too far.',
    overview:
      'Root rot is usually a moisture and oxygen problem. Beginners should watch for slow-drying soil, odor, soft stems, and decline that does not match normal thirst.',
    checks: ['Sour smell from soil', 'Soft stems near the soil line', 'Wet soil that stays wet for days'],
    likelyCauses: ['Watering before the pot dries enough', 'A pot without working drainage', 'Dense soil that holds water too long', 'A pot that is too large for the root system'],
    recovery: ['Stop watering immediately', 'Inspect drainage and roots if symptoms are severe', 'Ask Dr. Plant before cutting roots if you are unsure'],
    mistakesToAvoid: ['Adding more water to a wilting plant in wet soil', 'Fertilizing damaged roots', 'Cutting roots without a plan for aftercare'],
    whenToAskForHelp: ['Stems are mushy or collapsing', 'Soil smells sour', 'The plant is declining quickly despite wet soil'],
    drPlantPrompt:
      'Show Dr. Plant the pot, soil surface, leaf symptoms, and any soft stem areas before deciding whether to inspect roots.',
    relatedLinks: [
      {
        to: '/plant-watering-reminder-app',
        label: 'Watering reminder app',
        description: 'Build reminders around soil checks so root rot is less likely to repeat.',
      },
      {
        to: '/plant-problems/drooping-leaves',
        label: 'Drooping leaves',
        description: 'Compare root rot with underwatering and shock symptoms.',
      },
    ],
  },
];

export const speciesGuides: SpeciesGuide[] = [
  {
    slug: 'pothos',
    commonName: 'Pothos',
    scientificName: 'Epipremnum aureum',
    title: 'Pothos Care for Beginners',
    description: 'Simple pothos watering, light, pruning, and rescue tips for new houseplant owners.',
    light: 'Bright indirect light keeps pothos fuller, but it can tolerate medium light while growing more slowly.',
    watering: 'Water after the upper soil dries; do not water only because a calendar says it is time.',
    firstWeek: ['Place it in bright indirect light', 'Check soil moisture before watering', 'Photograph one healthy leaf and one older leaf for a baseline'],
    careRhythm: ['Let the top soil dry before watering', 'Bright indirect light keeps growth fuller', 'Trim long vines to encourage branching'],
    beginnerRisks: ['Watering on a fixed calendar', 'Leaving the pot in standing water', 'Ignoring yellowing lower leaves'],
    symptomsToWatch: ['Yellow lower leaves', 'Limp vines', 'Brown tips after watering swings'],
    relatedProblemSlugs: ['yellow-leaves', 'drooping-leaves', 'brown-tips'],
    petSafetyNote:
      'Pothos is commonly treated as unsafe for pets to chew; confirm pet safety with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'monstera',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    title: 'Monstera Care for Beginners',
    description: 'A beginner guide to monstera light, watering, support, leaf splits, and recovery signals.',
    light: 'Bright indirect light helps monstera grow larger leaves and stronger stems.',
    watering: 'Water deeply after the upper soil dries, then let extra water drain away.',
    firstWeek: ['Choose a bright spot away from harsh direct sun', 'Check whether the pot drains freely', 'Add a support plan before stems lean heavily'],
    careRhythm: ['Use bright indirect light', 'Water after the upper soil dries', 'Add support as stems get heavy'],
    beginnerRisks: ['Low light that slows fenestration', 'Oversized pots that hold too much moisture', 'Letting dust block leaf light'],
    symptomsToWatch: ['Yellow leaves after wet soil', 'Drooping after a move', 'Brown patches from harsh sun'],
    relatedProblemSlugs: ['yellow-leaves', 'drooping-leaves', 'root-rot'],
    petSafetyNote:
      'Monstera is commonly treated as unsafe for pets to chew; use ASPCA, your veterinarian, or a local expert for pet-specific guidance.',
  },
  {
    slug: 'snake-plant',
    commonName: 'Snake plant',
    scientificName: 'Dracaena trifasciata',
    title: 'Snake Plant Care for Beginners',
    description: 'Keep a snake plant healthy with low-water routines and simple light checks.',
    light: 'Snake plants tolerate low light but stay sturdier in medium to bright indirect light.',
    watering: 'Let soil dry deeply before watering again; this plant is more forgiving of dry soil than wet soil.',
    firstWeek: ['Put it in a stable warm spot', 'Check that the pot drains', 'Wait to water if the soil is still damp'],
    careRhythm: ['Water sparingly and let soil dry well', 'Tolerates low light but grows faster in brighter rooms', 'Use a draining potting mix'],
    beginnerRisks: ['Frequent small waterings', 'Cold drafts', 'Dense soil that never dries'],
    symptomsToWatch: ['Soft leaf bases', 'Yellowing after wet soil', 'Leaning leaves in low light'],
    relatedProblemSlugs: ['root-rot', 'yellow-leaves', 'drooping-leaves'],
    petSafetyNote:
      'Snake plant is commonly treated as unsafe for pets to chew; verify risk with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'peace-lily',
    commonName: 'Peace lily',
    scientificName: 'Spathiphyllum',
    title: 'Peace Lily Care for Beginners',
    description: 'Understand peace lily droop, watering, light, blooms, and leaf browning without panic.',
    light: 'Medium to bright indirect light helps peace lilies hold leaves upright and rebloom more reliably.',
    watering: 'Water when the plant begins to soften slightly, but avoid repeatedly letting it fully collapse.',
    firstWeek: ['Keep it out of direct sun', 'Learn its normal leaf posture', 'Check soil before reacting to a small droop'],
    careRhythm: ['Water when leaves begin to soften slightly', 'Use medium to bright indirect light', 'Remove spent blooms at the base'],
    beginnerRisks: ['Letting the plant fully collapse often', 'Direct sun scorch', 'Assuming every brown tip means disease'],
    symptomsToWatch: ['Repeated severe droop', 'Brown tips', 'Yellow leaves after staying wet'],
    relatedProblemSlugs: ['drooping-leaves', 'brown-tips', 'yellow-leaves'],
    petSafetyNote:
      'Peace lily is commonly treated as unsafe for pets to chew; confirm pet safety with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'spider-plant',
    commonName: 'Spider plant',
    scientificName: 'Chlorophytum comosum',
    title: 'Spider Plant Care for Beginners',
    description: 'A simple beginner guide to spider plant watering, pups, brown tips, and light.',
    light: 'Bright indirect light supports fuller growth and more plantlets.',
    watering: 'Keep moisture steady but never soggy; let the surface dry before watering again.',
    firstWeek: ['Place it where it gets bright filtered light', 'Check whether water exits the pot', 'Do not remove pups until they have roots or a plan'],
    careRhythm: ['Keep soil lightly moist, not soggy', 'Use bright indirect light for more pups', 'Trim brown tips for appearance only'],
    beginnerRisks: ['Mineral-heavy water', 'Overcrowded pots', 'Treating pups before they have roots'],
    symptomsToWatch: ['Brown tips', 'Pale stretched leaves', 'Droop after drying too far'],
    relatedProblemSlugs: ['brown-tips', 'drooping-leaves', 'yellow-leaves'],
    petSafetyNote:
      'Spider plant is often considered a friendlier houseplant choice, but always confirm pet-specific concerns with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'philodendron',
    commonName: 'Philodendron',
    scientificName: 'Philodendron hederaceum',
    title: 'Philodendron Care for Beginners',
    description: 'Beginner care for heartleaf philodendron watering, vines, yellow leaves, and light.',
    light: 'Bright filtered light keeps heartleaf philodendron vines fuller and less stretched.',
    watering: 'Let the upper soil dry before watering; avoid keeping the pot constantly wet.',
    firstWeek: ['Choose a bright indirect spot', 'Check the nursery pot for drainage', 'Watch whether vines stretch toward a window'],
    careRhythm: ['Let upper soil dry between waterings', 'Give bright filtered light', 'Pinch leggy vines for fuller growth'],
    beginnerRisks: ['Dark corners that stretch growth', 'Constantly wet soil', 'Skipping pest checks under leaves'],
    symptomsToWatch: ['Yellow leaves', 'Long gaps between leaves', 'Soft drooping vines'],
    relatedProblemSlugs: ['yellow-leaves', 'drooping-leaves', 'root-rot'],
    petSafetyNote:
      'Philodendron is commonly treated as unsafe for pets to chew; use ASPCA, your veterinarian, or a local expert for pet-specific guidance.',
  },
  {
    slug: 'fiddle-leaf-fig',
    commonName: 'Fiddle leaf fig',
    scientificName: 'Ficus lyrata',
    title: 'Fiddle Leaf Fig Care for Beginners',
    description: 'A calmer beginner path for fiddle leaf fig light, watering consistency, leaf drop, and brown spots.',
    light: 'Fiddle leaf figs want bright consistent light and dislike abrupt room changes.',
    watering: 'Water thoroughly after the top soil dries, then keep the rhythm stable.',
    firstWeek: ['Pick one bright location and avoid moving it repeatedly', 'Photograph the canopy as a baseline', 'Check for drafts near windows or vents'],
    careRhythm: ['Keep light bright and consistent', 'Water deeply after the top soil dries', 'Rotate gradually for even growth'],
    beginnerRisks: ['Moving it repeatedly', 'Cold windows', 'Small frequent waterings'],
    symptomsToWatch: ['Leaf drop after moves', 'Brown patches', 'Droop with wet soil'],
    relatedProblemSlugs: ['brown-tips', 'drooping-leaves', 'root-rot'],
    petSafetyNote:
      'Fiddle leaf fig can be irritating if chewed; confirm pet safety with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'aloe',
    commonName: 'Aloe',
    scientificName: 'Aloe vera',
    title: 'Aloe Care for Beginners',
    description: 'A beginner guide to aloe light, watering, soft leaves, pups, and potting mix.',
    light: 'Aloe needs bright light to stay compact and strong.',
    watering: 'Let the pot dry thoroughly before watering again; soft leaves often mean conditions need review.',
    firstWeek: ['Move it into bright light gradually', 'Check that soil is gritty and drains fast', 'Wait to water if leaves feel firm and soil is damp'],
    careRhythm: ['Use bright light', 'Let soil dry thoroughly', 'Choose gritty, fast-draining mix'],
    beginnerRisks: ['Watering like a tropical plant', 'Low light stretching', 'Pots without drainage'],
    symptomsToWatch: ['Soft translucent leaves', 'Stretching toward light', 'Yellowing after wet soil'],
    relatedProblemSlugs: ['root-rot', 'yellow-leaves', 'drooping-leaves'],
    petSafetyNote:
      'Aloe may be unsafe for pets to chew; verify pet safety with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'zz-plant',
    commonName: 'ZZ plant',
    scientificName: 'Zamioculcas zamiifolia',
    title: 'ZZ Plant Care for Beginners',
    description: 'Low-maintenance ZZ plant care for watering, light, yellow stems, and slow growth.',
    light: 'ZZ plants tolerate low light, but medium indirect light supports stronger growth.',
    watering: 'Water only after the soil dries deeply; rhizomes store water and dislike soggy conditions.',
    firstWeek: ['Place it away from cold drafts', 'Check drainage before watering', 'Expect slow growth and avoid overreacting'],
    careRhythm: ['Water only after soil dries deeply', 'Accepts low light but prefers medium indirect light', 'Wipe leaves to keep them glossy'],
    beginnerRisks: ['Overwatering rhizomes', 'Expecting fast growth', 'Repotting too often'],
    symptomsToWatch: ['Yellow stems', 'Mushy base', 'Droop after staying wet'],
    relatedProblemSlugs: ['root-rot', 'yellow-leaves', 'drooping-leaves'],
    petSafetyNote:
      'ZZ plant is commonly treated as unsafe for pets to chew; confirm pet safety with ASPCA, your veterinarian, or a local expert.',
  },
  {
    slug: 'orchid',
    commonName: 'Orchid',
    scientificName: 'Phalaenopsis',
    title: 'Orchid Care for Beginners',
    description: 'Beginner phalaenopsis orchid care for watering, roots, reblooming, and light.',
    light: 'Phalaenopsis orchids prefer bright indirect light, not hot direct sun.',
    watering: 'Water when roots look silvery and bark is approaching dry, then let water drain completely.',
    firstWeek: ['Keep water out of the crown', 'Check root color before watering', 'Leave healthy green flower spikes alone while you learn the plant'],
    careRhythm: ['Water when roots turn silvery', 'Use bright indirect light', 'Let bark drain fully'],
    beginnerRisks: ['Letting water sit in the crown', 'Treating bark like soil', 'Cutting healthy green spikes too early'],
    symptomsToWatch: ['Wrinkled leaves', 'Mushy roots', 'Yellow leaves after crown water'],
    relatedProblemSlugs: ['root-rot', 'yellow-leaves', 'drooping-leaves'],
    petSafetyNote:
      'Many common phalaenopsis orchids are considered lower risk than some houseplants, but confirm pet-specific concerns with ASPCA, your veterinarian, or a local expert.',
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
  // Specific long-tail symptom term only; never the `/plant-problems` head term.
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
  // Specific species term only; never the `/plant-care-guides` head term.
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
