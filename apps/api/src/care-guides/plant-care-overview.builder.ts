import { PotSize } from '@prisma/client';
import type { WeatherAdvicePayload } from '../weather/weather-advice.types';
import {
  buildLocationCareParagraph,
  buildMistCareParagraph,
  classifySpeciesForCare,
  growingEnvironmentLabel,
  inferGrowingEnvironment,
  type GrowingEnvironment,
  type PlantCategory,
} from './growing-environment';
import {
  buildGrowthStageNote,
  buildSeasonCareNote,
  buildWeatherCareHint,
  getSeason,
  inferPlantGrowthStage,
  type PlantGrowthStage,
  type Season,
} from './plant-care-season.util';

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
  | 'toxicity'
  | 'notes';

export interface PlantCareOverviewContext {
  speciesName: string;
  scientificName: string;
  plantName: string;
  careNotes: string;
  sunlight: string;
  phRange: string;
  wateringFreqDays: number;
  waterIntervalDays: number;
  potSize: string;
  wateringStyle: string;
  drainageNote: string;
  toxicity: string;
  toxicityWarning: string;
  location: string;
  growingEnvironment: GrowingEnvironment;
  environmentLabel: string;
  locationNote: string;
  mistNote: string;
  plantNotes?: string;
  category: PlantCategory;
  season: Season;
  growthStage: PlantGrowthStage;
  seasonNote: string;
  growthNote: string;
  weatherHint?: string;
}

export interface StructuredCareSection {
  id: PlantCareTopicId;
  heading: string;
  whyItMatters: string;
  beginnerBody: string;
  advancedBody: string;
  warnings: string[];
}

export function buildStructuredPlantCareSections(
  ctx: PlantCareOverviewContext,
): StructuredCareSection[] {
  const sections: StructuredCareSection[] = [
    buildWaterSection(ctx),
    buildSeasonSection(ctx),
    buildLightSection(ctx),
    buildSoilSection(ctx),
    buildHumiditySection(ctx),
    buildTemperatureSection(ctx),
    buildFertilizerSection(ctx),
    buildPruningSection(ctx),
    buildRepottingSection(ctx),
    buildPropagationSection(ctx),
    buildPestsSection(ctx),
    buildToxicitySection(ctx),
  ];

  if (ctx.plantNotes?.trim()) {
    sections.push({
      id: 'notes',
      heading: 'Your notes',
      whyItMatters: 'Personal notes help Dr. Plant and future you remember what worked.',
      beginnerBody: ctx.plantNotes.trim(),
      advancedBody: ctx.plantNotes.trim(),
      warnings: [],
    });
  }

  return sections;
}

function buildWaterSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'water',
    heading: 'Water',
    whyItMatters:
      'Most houseplant problems start with too much or too little water. Matching rhythm to pot size and light prevents root stress.',
    beginnerBody: [
      `Water **${ctx.plantName}** about every **${ctx.waterIntervalDays} days** in a **${ctx.potSize}** pot.`,
      '',
      '**Simple check:** stick your finger 1–2 inches into the soil. If it feels dry, water; if damp, wait.',
      '',
      ctx.wateringStyle,
      '',
      ctx.drainageNote,
      '',
      ctx.growthNote,
    ].join('\n\n'),
    advancedBody: [
      `Target interval: **${ctx.waterIntervalDays} days** (catalog base ${ctx.wateringFreqDays} days, adjusted for **${ctx.potSize}** pot).`,
      '',
      `**${ctx.wateringStyle}**`,
      '',
      `At **${ctx.environmentLabel}** (${ctx.location}), evaporation differs — shorten intervals in hot/dry spots, lengthen in cool shade.`,
      '',
      ctx.drainageNote,
      '',
      'Weigh the pot after watering once to learn the “just watered” vs “needs water” feel.',
      '',
      ctx.seasonNote,
    ].join('\n\n'),
    warnings: [
      'Never leave the pot sitting in a full saucer for more than 30 minutes.',
      'Yellow leaves + wet soil often mean overwatering, not thirst.',
    ],
  };
}

function buildSeasonSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  const lines = [ctx.seasonNote, ctx.growthNote];
  if (ctx.weatherHint) lines.push(`**This week:** ${ctx.weatherHint}`);
  const body = lines.join('\n\n');
  const warnings: string[] = [];
  if (ctx.growingEnvironment === 'outdoor' && ctx.season === 'winter') {
    warnings.push('Bring frost-sensitive pots indoors before overnight lows drop below freezing.');
  }
  if (ctx.weatherHint && /frost|freeze|cold tonight/i.test(ctx.weatherHint)) {
    warnings.push('Act on frost warnings the same day — damage can happen overnight.');
  }

  return {
    id: 'season',
    heading: 'Season & weather',
    whyItMatters:
      'Care needs shift with daylight, temperature, and forecast — not just the calendar on the watering app.',
    beginnerBody: body,
    advancedBody: [
      body,
      '',
      ctx.weatherHint
        ? 'Weather hints refresh from your dashboard when you fetch daily advice.'
        : 'Turn on **Weather advice** on the garden home screen for a 7-day forecast tied to your plants.',
    ].join('\n\n'),
    warnings,
  };
}

function buildLightSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  const lowLight =
    /low|shade|indirect/i.test(ctx.sunlight) && !/direct|full sun/i.test(ctx.sunlight);
  return {
    id: 'light',
    heading: 'Light',
    whyItMatters:
      'Light drives how fast **{plant}** uses water and food. Wrong light shows up as pale, stretched, or scorched leaves.'.replace(
        '{plant}',
        ctx.plantName,
      ),
    beginnerBody: [
      `**${ctx.plantName}** prefers: **${ctx.sunlight}**.`,
      '',
      lowLight
        ? 'If leaves look pale or stems stretch toward the window, move closer to bright indirect light.'
        : 'If leaves bleach or crisp at the edges, pull back from harsh direct sun.',
      '',
      'Rotate the pot a quarter turn each week for even growth.',
    ].join('\n\n'),
    advancedBody: [
      `Species guidance: **${ctx.sunlight}** for **${ctx.speciesName}**.`,
      '',
      `Match window exposure to category (**${ctx.category}**): adjust distance seasonally as sun angle changes.`,
      '',
      'Use a light meter or phone lux app: most foliage houseplants stay happiest at bright indirect (roughly 2,000–5,000 lux).',
      '',
      'Pair light changes with watering — more light = faster drying.',
    ].join('\n\n'),
    warnings: lowLight
      ? ['Sudden move to intense sun can burn leaves acclimated to shade.']
      : ['South-facing glass can scorch leaves even through a window.'],
  };
}

function buildSoilSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'soil',
    heading: 'Soil & drainage',
    whyItMatters:
      'Roots need air as much as water. Heavy soil stays wet and invites rot; the right mix keeps oxygen around roots.',
    beginnerBody: [
      `Use **houseplant potting mix** with perlite or bark for **${ctx.plantName}**.`,
      '',
      `Target soil pH: **${ctx.phRange}**.`,
      '',
      'Repot into a container only 1–2 inches wider than the root ball when needed.',
    ].join('\n\n'),
    advancedBody: [
      `Aim for pH **${ctx.phRange}** for **${ctx.speciesName}**.`,
      '',
      ctx.category === 'succulent' || ctx.category === 'cactus'
        ? 'Blend: 50% cactus/succulent mix + 50% perlite/pumice for fast drainage.'
        : ctx.category === 'orchid'
          ? 'Use orchid bark mix — never standard peat-heavy potting soil alone.'
          : 'Aim for ~20–30% perlite or bark chunks in a quality peat or coco-based mix.',
      '',
      ctx.drainageNote,
    ].join('\n\n'),
    warnings: [
      'Garden soil alone compacts in pots and often causes root rot.',
      'A pot without drainage holes is only suitable for very experienced growers.',
    ],
  };
}

function buildHumiditySection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'humidity',
    heading: 'Humidity',
    whyItMatters:
      'Dry indoor air browns leaf tips on many tropical plants; excess humidity without airflow can encourage fungus.',
    beginnerBody: [
      ctx.locationNote,
      '',
      ctx.mistNote,
      '',
      'Grouping plants or a shallow pebble tray with water (pot above the water line) raises humidity slightly.',
    ].join('\n\n'),
    advancedBody: [
      ctx.locationNote,
      '',
      ctx.mistNote,
      '',
      `**${ctx.environmentLabel}** at **${ctx.location}**: heated winter air may need a humidifier nearby for ferns, calatheas, and aroids.`,
      '',
      'Misting briefly raises surface moisture but does not replace ambient humidity — focus on consistent room levels (40–60% for many tropicals).',
    ].join('\n\n'),
    warnings:
      ctx.growingEnvironment === 'outdoor'
        ? []
        : ['Do not mist late evening — leaves staying wet overnight invites mildew.'],
  };
}

function buildTemperatureSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'temperature',
    heading: 'Temperature',
    whyItMatters:
      'Cold drafts and heat spikes stress plants faster than gradual seasonal shifts indoors.',
    beginnerBody: [
      `Keep **${ctx.plantName}** away from AC vents, radiators, and drafty doors.`,
      '',
      'Most houseplants are comfortable in normal home temperatures (65–75°F / 18–24°C).',
    ].join('\n\n'),
    advancedBody: [
      `**${ctx.speciesName}** (${ctx.category}): avoid sustained below 55°F (13°C) for tropical species.`,
      '',
      ctx.growingEnvironment === 'semi_outdoor'
        ? 'On patios, bring pots in before frost; transition over a week to reduce shock.'
        : 'Indoor microclimates near single-pane winter glass can be colder than the room — use a thermometer at leaf height.',
    ].join('\n\n'),
    warnings: [
      'Sudden temperature swings after repotting or shipping increase leaf drop.',
    ],
  };
}

function buildFertilizerSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  const dormant =
    ctx.category === 'succulent' || ctx.category === 'cactus' || ctx.wateringFreqDays >= 14;
  return {
    id: 'fertilizer',
    heading: 'Fertilizer',
    whyItMatters:
      'Food supports new growth when the plant is actively growing and well lit — not when stressed or dormant.',
    beginnerBody: [
      `Feed **${ctx.plantName}** lightly during spring and summer with balanced houseplant fertilizer (half strength on the label).`,
      '',
      dormant
        ? 'Pause or reduce feed in winter when growth slows.'
        : 'Skip feeding for two weeks after repotting.',
      '',
      ctx.growthStage === 'new' ? ctx.growthNote : '',
    ].join('\n\n'),
    advancedBody: [
      `Use a balanced liquid fertilizer (e.g. 10-10-10 or 20-20-20) at **½ label strength** every 4–6 weeks in active growth.`,
      '',
      'Flush soil occasionally if salt crust appears on the surface.',
      '',
      ctx.category === 'orchid'
        ? 'Use orchid-specific fertilizer during active growth; many orchids rest after blooming.'
        : 'Organic slow-release top dressings work for outdoor containers; indoors prefer liquid for control.',
      '',
      ctx.seasonNote,
      ctx.growthNote,
    ].join('\n\n'),
    warnings: [
      'Over-fertilizing burns roots and shows as brown leaf tips.',
      'Never feed a dry, wilted plant — water first.',
    ],
  };
}

function buildPruningSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'pruning',
    heading: 'Pruning',
    whyItMatters:
      'Removing damaged or leggy growth redirects energy to healthy leaves and improves airflow.',
    beginnerBody: [
      `Trim yellow or brown leaves on **${ctx.plantName}** at the base of the leaf stem with clean scissors.`,
      '',
      'Remove spent flowers to encourage new buds on blooming plants.',
    ].join('\n\n'),
    advancedBody: [
      'Sterilize blades with alcohol between cuts on diseased tissue.',
      '',
      'Never remove more than ~25% of healthy foliage at once.',
      '',
      ctx.category === 'vine'
        ? 'Pinch growing tips to encourage branching on trailing plants.'
        : 'Cut just above a node at an angle away from the bud for woody stems.',
    ].join('\n\n'),
    warnings: ['Milky sap from cuts may irritate skin on some species — wear gloves.'],
  };
}

function buildRepottingSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'repotting',
    heading: 'Repotting',
    whyItMatters:
      'Fresh mix and slightly more room prevent roots from circling and drying out too fast in old, depleted soil.',
    beginnerBody: [
      `Repot **${ctx.plantName}** when roots poke from drainage holes or water runs straight through.`,
      '',
      'Choose a pot only 1–2 inches wider; too large stays wet too long.',
    ].join('\n\n'),
    advancedBody: [
      'Best in spring as growth resumes. Tease circling roots gently; trim black mushy roots.',
      '',
      `After repotting a **${ctx.potSize}** plant, expect watering rhythm to shift — monitor soil moisture closely for 2 weeks.`,
      '',
      'Bottom watering once after repotting helps settle mix without compacting the surface.',
      '',
      ctx.growthStage === 'new'
        ? '**New plant:** wait unless roots are clearly root-bound — settling in matters more than fresh soil.'
        : ctx.growthNote,
    ].join('\n\n'),
    warnings: [
      'Repotting during peak stress (mid-winter low light) can stall growth.',
    ],
  };
}

function buildPropagationSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  const easy =
    ctx.category === 'vine' ||
    ctx.category === 'succulent' ||
    ctx.category === 'herb' ||
    /pothos|snake|spider/i.test(ctx.speciesName);
  return {
    id: 'propagation',
    heading: 'Propagation',
    whyItMatters:
      'Starting new plants from healthy material is a low-cost way to backup favorites or share with friends.',
    beginnerBody: easy
      ? [
          `Many growers propagate **${ctx.speciesName}** from stem cuttings in water or moist soil.`,
          '',
          'Take a 4–6 inch cutting with 2–3 leaves, remove lower leaves, place in water until roots are 1–2 inches, then pot up.',
        ].join('\n\n')
      : [
          `Propagation for **${ctx.speciesName}** varies — check species-specific guides before taking cuttings.`,
          '',
          'Start with healthy, pest-free growth only.',
        ].join('\n\n'),
    advancedBody: [
      ctx.category === 'succulent'
        ? 'Allow cut ends to callus 2–3 days before placing on dry succulent mix; mist lightly after roots form.'
        : ctx.category === 'orchid'
          ? 'Division is common when pseudobulbs fill the pot — split with sterile tool during repot.'
          : 'Use rooting hormone on woody cuttings; maintain high humidity with a loose dome until rooted.',
    ].join('\n\n'),
    warnings: ['Do not propagate from pest-infested or recently treated plants.'],
  };
}

function buildPestsSection(ctx: PlantCareOverviewContext): StructuredCareSection {
  return {
    id: 'pests',
    heading: 'Pests & diseases',
    whyItMatters:
      'Early detection keeps problems local — inspect before they spread to the rest of your collection.',
    beginnerBody: [
      `Each week, check **${ctx.plantName}** leaf undersides and new growth for dots, webbing, or stickiness.`,
      '',
      'Isolate new plants for two weeks before placing near others.',
    ].join('\n\n'),
    advancedBody: [
      'Common issues: spider mites (fine webbing), mealybugs (cottony clusters), scale (brown bumps), fungus gnats (soil larvae).',
      '',
      'Identify before spraying — horticultural soap or neem works on many soft-bodied pests; repeat weekly.',
      '',
      'Improve airflow and avoid wet foliage overnight for mildew prevention.',
    ].join('\n\n'),
    warnings: [
      'Systemic pesticides may be toxic to pets — read labels and isolate treated plants.',
    ],
  };
}

function buildToxicitySection(ctx: PlantCareOverviewContext): StructuredCareSection {
  const warnings: string[] = [];
  if (ctx.toxicityWarning) {
    warnings.push(ctx.toxicity.replace(/^⚠️\s*/, '').replace(/\*\*/g, ''));
  }
  return {
    id: 'toxicity',
    heading: 'Toxicity & safety',
    whyItMatters:
      'Knowing pet and child safety helps you choose placement and handling habits before problems occur.',
    beginnerBody: [
      `**${ctx.speciesName}:** ${ctx.toxicity}`,
      '',
      ctx.toxicityWarning || 'Wash hands after pruning if sap or dust irritates skin.',
    ].join('\n\n'),
    advancedBody: [
      `Catalog toxicity: ${ctx.toxicity}`,
      '',
      'Keep cuttings and fallen leaves off floors accessible to pets.',
      '',
      'When in doubt, consult ASPCA or poison-control resources for your specific species.',
    ].join('\n\n'),
    warnings,
  };
}

export function buildOverviewContext(
  plantName: string,
  species: {
    commonName: string;
    scientificName: string | null;
    careNotes: string | null;
    sunlight: string | null;
    phMin: number | null;
    phMax: number | null;
    wateringFreqDays: number;
    toxicity: string | null;
  },
  potSize: PotSize,
  location?: string | null,
  plantNotes?: string | null,
  waterIntervalDaysFn?: (freq: number, pot: PotSize) => number,
  timing?: {
    datePlanted?: Date | null;
    createdAt?: Date;
    plantId?: string;
    weatherAdvice?: WeatherAdvicePayload | null;
    now?: Date;
  },
): PlantCareOverviewContext {
  const now = timing?.now ?? new Date();
  const waterIntervalDays = waterIntervalDaysFn
    ? waterIntervalDaysFn(species.wateringFreqDays, potSize)
    : Math.max(
        2,
        Math.round(
          species.wateringFreqDays *
            (potSize === PotSize.SMALL ? 0.8 : potSize === PotSize.LARGE ? 1.2 : 1),
        ),
      );
  const phRange =
    species.phMin != null && species.phMax != null
      ? `${species.phMin}–${species.phMax}`
      : '6.0–7.0 (typical for most houseplants)';
  const toxicity = species.toxicity?.trim() || 'Check toxicity for your pets and children.';
  const toxicityWarning = /non-toxic/i.test(toxicity)
    ? ''
    : `⚠️ **Safety:** ${toxicity}. Wash hands after handling.`;
  const freq = species.wateringFreqDays;
  let wateringStyle: string;
  let drainageNote: string;
  if (freq >= 12) {
    wateringStyle =
      '**Light watering** suits this plant: add a modest amount evenly through the soil.';
    drainageNote =
      'Use a pot with drainage holes and a fast-draining mix. Empty the saucer after watering.';
  } else if (freq <= 5) {
    wateringStyle =
      '**Thorough watering**: water until it flows from drainage holes, then stop.';
    drainageNote =
      'Good drainage is essential — never leave standing water in the saucer.';
  } else {
    wateringStyle =
      '**Moderate watering**: moisten the full root zone, then let the top inch dry.';
    drainageNote = 'Drainage holes and quality potting mix prevent waterlogged roots.';
  }
  const loc = location?.trim() || 'Not set';
  const growingEnvironment = inferGrowingEnvironment(location);
  const category = classifySpeciesForCare(species);
  const season = getSeason(now);
  const growthStage = inferPlantGrowthStage(
    timing?.datePlanted,
    timing?.createdAt ?? now,
    now,
  );
  const seasonNote = buildSeasonCareNote(season, category, growingEnvironment, plantName);
  const growthNote = buildGrowthStageNote(growthStage, plantName, category);
  const weatherHint =
    timing?.plantId && timing.weatherAdvice
      ? buildWeatherCareHint(timing.weatherAdvice, timing.plantId) ?? undefined
      : undefined;

  const ctx: PlantCareOverviewContext = {
    speciesName: species.commonName,
    scientificName: species.scientificName?.trim() || species.commonName,
    plantName,
    careNotes: species.careNotes?.trim() || 'No additional species notes in our catalog yet.',
    sunlight: species.sunlight?.trim() || 'Bright indirect light',
    phRange,
    wateringFreqDays: species.wateringFreqDays,
    waterIntervalDays,
    potSize: potSize.toLowerCase(),
    wateringStyle,
    drainageNote,
    toxicity,
    toxicityWarning,
    location: loc,
    growingEnvironment,
    environmentLabel: growingEnvironmentLabel(growingEnvironment),
    locationNote: buildLocationCareParagraph(growingEnvironment, loc, plantName),
    mistNote: buildMistCareParagraph(growingEnvironment, category, plantName),
    plantNotes: plantNotes?.trim() || undefined,
    category,
    season,
    growthStage,
    seasonNote,
    growthNote,
    weatherHint,
  };

  return ctx;
}
