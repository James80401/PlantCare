import { TaskType } from '@prisma/client';
import type { CareGuideSection } from './care-guide-types';
import type { PlantCategory } from './care-guide-classify';
import { getSpeciesSnippet } from './care-guide-species-snippets';

function snippetBlock(speciesId: string, taskType: TaskType): string {
  const s = getSpeciesSnippet(speciesId, taskType);
  return s ? `\n\n${s}` : '';
}

function waterSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const dry = cat === 'succulent' || cat === 'cactus';
  const wet = cat === 'moisture' || cat === 'herb' || cat === 'vegetable' || cat === 'fern';

  return [
    {
      heading: 'Before you water',
      body: `1. Stick your finger **1–2 inches** into the soil.\n2. If dry at that depth, it is time to water {plantName} ({speciesName}).\n3. If still cool and damp, wait 1–2 days.\n\nCatalog baseline: about every **{wateringFreqDays}** days; your **{potSize}** pot adjusts that to roughly **{waterIntervalDays}** days between sessions.\n\n☀️ Light: {sunlight}`,
      imageKeys: ['water-soil-check', 'photo-soil-check'],
    },
    {
      heading: 'How much water',
      body: dry
        ? `{wateringStyle}\n\nFor {speciesName}, a light pass through the soil is usually enough. Avoid soaking unless flushing accumulated salts after months without leaching.`
        : wet
          ? `{wateringStyle}\n\n1. Water slowly at the soil surface.\n2. Continue until a little drains from the bottom.\n3. Empty the saucer within 30 minutes.`
          : `{wateringStyle}\n\n1. Moisten the full root zone.\n2. Allow slight drainage, then stop.\n3. Let the top inch dry before the next watering.`,
      imageKeys: dry
        ? ['water-light', 'water-underwater-signs']
        : ['water-thorough', 'photo-water-drainage'],
    },
    {
      heading: 'Drainage & saucer',
      body: `{drainageNote}\n\n- Pot must have drainage holes.\n- Use mix appropriate for {speciesName} ({scientificName}).\n- Never leave standing water in the saucer overnight.`,
      imageKeys: ['water-thorough', 'water-overwater-signs'],
    },
    {
      heading: 'Signs of trouble',
      body: `**Overwatering:** yellow leaves, mushy stems, mold on soil, sour smell.\n\n**Underwatering:** crispy tips, wilting that recovers after water, soil pulling away from pot edges.\n\nPreferred pH: **{phRange}**.`,
      imageKeys: ['water-overwater-signs', 'water-underwater-signs'],
    },
    {
      heading: 'Seasonal adjustments',
      body: `- **Spring/summer:** growth may need more frequent checks.\n- **Fall/winter:** slow down; many plants need less water when light is lower.\n- **After repotting:** soil dries on a different schedule — recheck weekly.`,
    },
    {
      heading: 'Species notes',
      body: `{careNotes}\n\n{toxicityWarning}${snippetBlock(speciesId, TaskType.WATER)}`,
    },
    {
      heading: 'Common mistakes',
      body: `- Watering on a rigid calendar instead of checking soil.\n- Misting leaves as a substitute for root watering.\n- Using cold tap water on sensitive tropicals (let it sit overnight if needed).`,
    },
  ];
}

function pruneSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const technique: Record<PlantCategory, string> = {
    herb: `**Pinch or cut just above a leaf pair (node).**\n\n1. Remove the top 1–2 inches to encourage bushiness.\n2. Snip flower buds on leafy herbs to keep flavor.\n3. Harvest up to **one-third** of the plant at a time.\n\n{careNotes}`,
    vegetable: `1. Remove yellow or diseased leaves first.\n2. For fruiting crops, follow staking/suckering notes for your variety.\n3. Harvest-ready stems: cut above a node; leave enough foliage to support the plant.\n\n{careNotes}`,
    fruit: `1. Prune crossing branches and dead wood when dormant or after harvest.\n2. Keep an open center for light in containers.\n3. Never remove more than one-third of live growth at once.`,
    citrus: `1. Remove dead, weak, or inward-growing branches.\n2. Thin dense growth so light reaches inner leaves.\n3. Container citrus: maintain size with light tip pruning after harvest.`,
    vine: `1. Trim leggy stems back to a node facing the direction you want growth.\n2. Pinch soft tips; use pruners on woody parts.\n3. Remove yellow leaves at the soil line.\n\n{careNotes}`,
    aroid: `1. Cut leggy vines or stems **above a node with a healthy leaf**.\n2. Aerial roots can stay unless in the way.\n3. Remove only damaged leaves at the base.\n\n{careNotes}`,
    succulent: `**Minimal pruning only.**\n\n1. Remove dead, mushy, or dried leaves at the base.\n2. Do not cut into the main stem unless propagating.\n3. Allow cuts to callus before watering if you remove a stem.`,
    cactus: `Remove dead tissue only. Use tongs for spiny species. Let wounds dry several days before any water.`,
    fern: `Remove brown fronds at the base. Do not cut healthy green fronds — they will not regrow from that point.`,
    palm: `Trim only fully brown fronds. Cutting green fronds stresses the palm. Do not peel trunk skin.`,
    orchid: `Remove spent flower spikes near the base when brown. Trim dead roots during repot only.`,
    flowering: `1. Deadhead spent blooms to the next node or outward-facing bud.\n2. Remove brown leaves and weak stems.\n3. After bloom, light shaping only — avoid hard cutbacks unless species-specific.`,
    moisture: `Pinch tips above nodes to branch. Remove damaged leaves. Avoid stripping too much foliage in heat.`,
    houseplant: `1. Cut **just above a leaf node** at a slight angle.\n2. Remove yellow or brown leaves at the stem base.\n3. Never remove more than one-third of healthy foliage at once.\n\n{careNotes}`,
  };

  const keys: Record<PlantCategory, string[]> = {
    herb: ['prune-pinch', 'prune-herb-harvest', 'photo-prune-pinch'],
    vegetable: ['prune-cut', 'prune-dead'],
    fruit: ['prune-cut', 'prune-dead'],
    citrus: ['prune-cut', 'prune-dead'],
    vine: ['prune-vine-node', 'prune-pinch', 'prune-cut'],
    aroid: ['prune-vine-node', 'prune-cut'],
    succulent: ['prune-dead'],
    cactus: ['prune-dead'],
    fern: ['prune-dead'],
    palm: ['prune-dead'],
    orchid: ['prune-cut'],
    flowering: ['prune-dead', 'prune-cut'],
    moisture: ['prune-pinch', 'prune-cut'],
    houseplant: ['prune-cut', 'prune-pinch', 'prune-dead'],
  };

  return [
    {
      heading: 'Why prune {speciesName}',
      body: `Pruning improves shape, airflow, and new growth for **{plantName}**. Timing: active growth season is safest for most cuts.`,
      imageKeys: ['prune-dead'],
    },
    {
      heading: 'Where and how to cut',
      body: technique[cat],
      imageKeys: keys[cat],
    },
    {
      heading: 'Tools & sanitizing',
      body: `1. Use sharp bypass pruners or scissors.\n2. Wipe blades with rubbing alcohol between plants.\n3. Dull tools crush stems and invite disease.`,
      imageKeys: ['prune-cut', 'photo-prune-cut'],
    },
    {
      heading: 'How much to remove',
      body: `- Maximum **one-third** of healthy growth per session.\n- Spread heavy pruning across weeks if needed.\n- Stop if the plant looks stressed — wait for recovery.`,
    },
    {
      heading: 'After-care',
      body: `- Water normally unless you removed a large portion of roots/leaves.\n- Avoid direct hot sun on freshly cut tropicals for a few days.\n- Resume fertilizer after you see new growth.`,
    },
    {
      heading: 'Species tips',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.PRUNE)}\n\n{toxicityWarning}`,
    },
  ];
}

function fertilizeSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const heavy = cat === 'vegetable' || cat === 'fruit' || cat === 'citrus';
  return [
    {
      heading: 'When to feed',
      body: heavy
        ? `Feed **{speciesName}** during active growth and fruiting. Pause or halve strength in low light or winter unless under grow lights.`
        : `Feed **{speciesName}** in spring and summer when you see new leaves. Reduce or stop in fall/winter dormancy.`,
    },
    {
      heading: 'Product & dilution',
      body: `1. Use balanced liquid fertilizer (e.g. 10-10-10).\n2. Mix at **half** label strength.\n3. Target soil pH **{phRange}** for nutrient uptake.`,
      imageKeys: ['fertilize-dilute', 'fertilize-apply'],
    },
    {
      heading: 'Application steps',
      body: `1. Water soil lightly first if it is bone dry.\n2. Apply fertilizer to **moist** soil only.\n3. Never foliar-feed edibles unless product is labeled food-safe.`,
      imageKeys: ['fertilize-apply', 'photo-fertilize'],
    },
    {
      heading: 'pH interaction',
      body: `Wrong pH locks out nutrients even when you fertilize. Test pH if leaves stay pale despite feeding.`,
      imageKeys: ['ph-test'],
    },
    {
      heading: 'Signs of over-fertilizing',
      body: `Crispy leaf edges, white crust on soil, stunted growth, or sudden leaf drop. Flush pot with plain water if you suspect burn.`,
      imageKeys: ['fertilize-burn-signs'],
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.FERTILIZE)}`,
    },
  ];
}

function mistSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const skip = cat === 'succulent' || cat === 'cactus';
  const needs = ['fern', 'palm', 'moisture', 'orchid', 'aroid'].includes(cat);

  return [
    {
      heading: 'Does {speciesName} need misting?',
      body: skip
        ? `**Usually no.** {speciesName} prefers correct watering over wet leaves. Low humidity? Use a **pebble tray** or humidifier instead.`
        : needs
          ? `**Often helpful.** {speciesName} benefits from higher humidity. Misting supplements other methods but does not replace watering.`
          : `**Optional.** Mist only if you see crisp leaf edges or tips. Consistent soil moisture matters more.`,
    },
    {
      heading: 'Technique',
      body: `1. Use room-temperature water in a fine spray.\n2. Mist in the **morning** so leaves dry by evening.\n3. Avoid soaking fuzzy leaves, flowers, or crown of rosette plants.`,
      imageKeys: ['mist-leaves', 'photo-mist'],
    },
    {
      heading: 'Better alternatives',
      body: `- **Pebble tray:** pot sits above water, not in it.\n- **Grouping plants** raises local humidity.\n- **Humidifier:** best for ferns, calatheas, orchids indoors.`,
      imageKeys: ['humidity-pebble-tray'],
    },
    {
      heading: 'When to skip',
      body: `- Succulents and plants with powdery leaves.\n- When fungal spots or mildew are present.\n- Cold rooms where water sits on leaves overnight.`,
    },
    {
      heading: 'Species notes',
      body: `☀️ {sunlight}\n\n{careNotes}${snippetBlock(speciesId, TaskType.MIST)}`,
    },
  ];
}

function phSections(speciesId: string): CareGuideSection[] {
  return [
    {
      heading: 'Target pH for {speciesName}',
      body: `**{speciesName}** prefers pH **{phRange}**. Outside this range, nutrients may be unavailable and leaves can yellow despite feeding.`,
      imageKeys: ['ph-test', 'photo-ph-test'],
    },
    {
      heading: 'How to test',
      body: `1. Take samples from several spots near the root ball.\n2. Use a meter or kit on **moist** (not soggy) soil.\n3. For slurry tests, follow kit directions with distilled water.`,
      imageKeys: ['ph-test'],
    },
    {
      heading: 'Adjusting pH',
      body: `- **Too high (alkaline):** acidifying fertilizer, sulfur products (label rates), or acid-loving mix for blueberries/azaleas.\n- **Too low (acidic):** lime products sparingly — retest in 2 weeks.`,
    },
    {
      heading: 'Symptoms of wrong pH',
      body: `Interveinal yellowing, stunted new growth, or poor flowering when water and light are otherwise correct.`,
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.PH_TEST)}`,
    },
  ];
}

function pestSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const pests =
    cat === 'herb' || cat === 'vegetable'
      ? 'aphids, whiteflies, caterpillars, spider mites'
      : cat === 'succulent' || cat === 'cactus'
        ? 'mealybugs, scale, spider mites'
        : 'spider mites, aphids, scale, mealybugs, thrips';
  return [
    {
      heading: 'Inspection checklist',
      body: `1. Leaf **undersides** and stem joints.\n2. New growth tips.\n3. Soil surface for fungus gnats.\n4. Sticky residue (honeydew) or fine webbing.\n\nCommon on {speciesName}: ${pests}.`,
      imageKeys: ['pest-inspect', 'pest-common-spots', 'photo-pest-underside'],
    },
    {
      heading: 'Treatment ladder',
      body: `1. Isolate from other plants.\n2. Rinse foliage with lukewarm water.\n3. Insecticidal soap or neem oil — full coverage, weekly repeats.\n4. Escalate only per label if infestation persists.`,
    },
    {
      heading: 'Prevention',
      body: `- Quarantine new plants 2 weeks.\n- Avoid overwatering (fungus gnats).\n- Increase airflow between dense foliage.`,
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.PEST_CONTROL)}\n\n{toxicityWarning}`,
    },
  ];
}

function repotSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const mix: Record<PlantCategory, string> = {
    succulent: 'cactus/succulent mix with extra perlite',
    cactus: 'mineral-heavy cactus mix, very fast drainage',
    orchid: 'orchid bark mix — never standard potting soil alone',
    fern: 'peat-based mix with perlite; stays airy but moisture-retentive',
    palm: 'well-draining potting mix with perlite',
    herb: 'quality potting mix with perlite',
    vegetable: 'rich potting mix with compost and perlite',
    fruit: 'large-container mix with compost and drainage',
    citrus: 'citrus or acidic-friendly mix with perlite',
    vine: 'all-purpose mix with perlite',
    aroid: 'chunky aroid mix (bark, perlite, potting soil)',
    flowering: 'all-purpose mix with perlite',
    moisture: 'moisture-retentive but still airy mix',
    houseplant: 'all-purpose potting mix with perlite',
  };

  return [
    {
      heading: 'When to repot',
      body: `Repot **{speciesName}** when:\n- Roots circle the bottom or exit drainage holes.\n- Water runs straight through dry soil.\n- Growth stalled despite good care.\n\nMove up only **1–2 inches** in pot diameter.`,
      imageKeys: ['repot-root', 'photo-repot'],
    },
    {
      heading: 'Soil mix',
      body: `Use **${mix[cat]}** for {speciesName}.`,
    },
    {
      heading: 'Step-by-step',
      body: `1. Water lightly the day before.\n2. Slide plant out; loosen outer circling roots.\n3. Place at the **same depth** as before.\n4. Fill gaps with fresh mix; tamp lightly.\n5. Water thoroughly once; empty saucer.`,
      imageKeys: ['repot-step-sequence', 'repot-root'],
    },
    {
      heading: 'After repot care',
      body: `- Keep out of harsh direct sun 1–2 weeks.\n- Hold fertilizer 4–6 weeks while roots settle.\n- Expect mild wilt — normal while roots establish.`,
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.REPOT)}`,
    },
  ];
}

function rotateSections(speciesId: string): CareGuideSection[] {
  return [
    {
      heading: 'Why rotate',
      body: 'Even light prevents leaning and encourages balanced growth on {speciesName}.',
    },
    {
      heading: 'How to rotate',
      body: 'Turn the pot a quarter turn each time. Mark the side facing the window so you rotate consistently.',
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.ROTATE)}`,
    },
  ];
}

function cleanLeavesSections(speciesId: string): CareGuideSection[] {
  return [
    {
      heading: 'When to clean',
      body: 'Dust blocks light on {speciesName}. Wipe leaves when they look dull or every few weeks indoors.',
    },
    {
      heading: 'How to clean',
      body: 'Use a damp soft cloth; support the leaf from underneath. Avoid leaf shine products on fuzzy or succulent leaves.',
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.CLEAN_LEAVES)}`,
    },
  ];
}

function inspectPestsSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  return pestSections(cat, speciesId);
}

function checkMoistureSections(speciesId: string): CareGuideSection[] {
  return [
    {
      heading: 'Finger test',
      body: 'Stick your finger 1–2 inches into the soil. Water {speciesName} only when the top feels dry for most houseplants.',
    },
    {
      heading: 'Signs to adjust',
      body: 'Yellowing lower leaves with wet soil may mean overwatering. Crispy tips with dry soil may mean underwatering.',
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.CHECK_MOISTURE)}`,
    },
  ];
}

function healthCheckSections(speciesId: string): CareGuideSection[] {
  return [
    {
      heading: 'Recovery check',
      body: 'Note new growth, leaf color, and soil moisture for {speciesName}. Compare to before your diagnosis or treatment.',
    },
    {
      heading: 'What to log',
      body: 'Take a photo, jot symptoms that improved or worsened, and adjust watering or light if needed.',
    },
    {
      heading: 'Species notes',
      body: `{careNotes}${snippetBlock(speciesId, TaskType.HEALTH_CHECK)}`,
    },
  ];
}

export function buildTemplateSections(
  taskType: TaskType,
  cat: PlantCategory,
  speciesId: string,
): CareGuideSection[] {
  switch (taskType) {
    case TaskType.WATER:
      return waterSections(cat, speciesId);
    case TaskType.PRUNE:
      return pruneSections(cat, speciesId);
    case TaskType.FERTILIZE:
      return fertilizeSections(cat, speciesId);
    case TaskType.MIST:
      return mistSections(cat, speciesId);
    case TaskType.PH_TEST:
      return phSections(speciesId);
    case TaskType.PEST_CONTROL:
      return pestSections(cat, speciesId);
    case TaskType.REPOT:
      return repotSections(cat, speciesId);
    case TaskType.ROTATE:
      return rotateSections(speciesId);
    case TaskType.CLEAN_LEAVES:
      return cleanLeavesSections(speciesId);
    case TaskType.INSPECT_PESTS:
      return inspectPestsSections(cat, speciesId);
    case TaskType.CHECK_MOISTURE:
      return checkMoistureSections(speciesId);
    case TaskType.HEALTH_CHECK:
      return healthCheckSections(speciesId);
    default:
      return [];
  }
}

/** Generic fallback guides (no speciesId) */
export function buildGenericGuideSections(taskType: TaskType): CareGuideSection[] {
  return buildTemplateSections(taskType, 'houseplant', 'generic-none');
}

export function collectImageKeys(sections: CareGuideSection[]): string[] {
  const keys: string[] = [];
  for (const sec of sections) {
    if (sec.imageKeys) keys.push(...sec.imageKeys);
  }
  return [...new Set(keys)];
}
