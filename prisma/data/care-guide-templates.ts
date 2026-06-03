import { TaskType } from '@prisma/client';
import type { CareGuideSection } from './care-guide-types';
import type { PlantCategory } from './care-guide-classify';
import { getSpeciesSnippet } from './care-guide-species-snippets';

function snippetBlock(speciesId: string, taskType: TaskType): string {
  const s = getSpeciesSnippet(speciesId, taskType);
  return s ? `\n\n${s}` : '';
}

function structuredSection(input: {
  heading: string;
  whyItMatters: string;
  beginnerBody: string;
  advancedBody: string;
  warnings?: string[];
  imageKeys?: string[];
}): CareGuideSection {
  return {
    heading: input.heading,
    body: input.beginnerBody,
    whyItMatters: input.whyItMatters,
    beginnerBody: input.beginnerBody,
    advancedBody: input.advancedBody,
    warnings: input.warnings,
    imageKeys: input.imageKeys,
  };
}

function waterSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const dry = cat === 'succulent' || cat === 'cactus';
  const wet = cat === 'moisture' || cat === 'herb' || cat === 'vegetable' || cat === 'fern';

  const howMuchBeginner = dry
    ? `{wateringStyle}\n\nFor {speciesName}, a light pass through the soil is usually enough. Stop when a little drains out — avoid soaking unless you are flushing salts.`
    : wet
      ? `{wateringStyle}\n\n1. Water slowly at the soil surface.\n2. Continue until a little drains from the bottom.\n3. Empty the saucer within 30 minutes.`
      : `{wateringStyle}\n\n1. Moisten the full root zone.\n2. Allow slight drainage, then stop.\n3. Let the top inch dry before the next watering.`;

  const howMuchAdvanced = dry
    ? `${howMuchBeginner}\n\n**Advanced:** Succulent roots rot quickly in cold, wet soil. In winter, extend dry periods. A deep soak followed by full dry-out works better than frequent sips for many desert types.`
    : wet
      ? `${howMuchBeginner}\n\n**Advanced:** Herbs and moisture-lovers may need more volume in heat. Split watering if soil surfaces too fast — a second pass 10 minutes later improves saturation without runoff waste.`
      : `${howMuchBeginner}\n\n**Advanced:** Lift the pot after watering — note the weight when properly moist. Use that heft as a quick check between finger tests. Avoid watering on a rigid calendar alone.`;

  return [
    structuredSection({
      heading: 'Before you water',
      whyItMatters:
        'Soil moisture — not the calendar — decides when {speciesName} needs water. Checking first prevents root rot and underwater stress.',
      beginnerBody: `1. Stick your finger **1–2 inches** into the soil.\n2. If dry at that depth, water {plantName} ({speciesName}).\n3. If still cool and damp, wait 1–2 days.\n\nBaseline: about every **{wateringFreqDays}** days; your **{potSize}** pot adjusts that to roughly **{waterIntervalDays}** days.\n\n☀️ Light: {sunlight}`,
      advancedBody: `1. Finger-test **1–2 inches** down (deeper for large pots).\n2. Optional: lift the pot — light weight usually means dry.\n3. Water only when dry at test depth; wait if cool and damp.\n\nCadence baseline: **{wateringFreqDays}** days catalog / **{waterIntervalDays}** days for your **{potSize}** pot.\n\n☀️ {sunlight} — brighter light often means faster drying.`,
      imageKeys: ['water-soil-check', 'photo-soil-check'],
    }),
    structuredSection({
      heading: 'How much water',
      whyItMatters:
        'The right volume reaches roots without drowning them. Too little causes drought stress; too much suffocates roots.',
      beginnerBody: howMuchBeginner,
      advancedBody: howMuchAdvanced,
      warnings: dry ? ['Never leave {speciesName} sitting in water — rot develops quickly.'] : undefined,
      imageKeys: dry
        ? ['water-light', 'water-underwater-signs']
        : ['water-thorough', 'photo-water-drainage'],
    }),
    structuredSection({
      heading: 'Drainage & saucer',
      whyItMatters:
        'Drainage holes let excess water escape. Standing water at the bottom is the fastest path to root rot.',
      beginnerBody: `{drainageNote}\n\n- Pot must have drainage holes.\n- Use mix appropriate for {speciesName} ({scientificName}).\n- Never leave standing water in the saucer overnight.`,
      advancedBody: `{drainageNote}\n\n- Confirm holes are open — not blocked by roots or mesh.\n- Match mix to {speciesName}: fast drainage for succulents; more retention for ferns.\n- Empty saucers within 30 minutes; use pot feet if the saucer holds water on a tray.\n- After repotting, expect a different dry-down rate for 2–3 weeks.`,
      warnings: ['Empty the saucer after watering — roots should not sit in water.'],
      imageKeys: ['water-thorough', 'water-overwater-signs'],
    }),
    structuredSection({
      heading: 'Signs of trouble',
      whyItMatters:
        'Leaf and soil cues tell you whether to water less, more, or adjust drainage before damage spreads.',
      beginnerBody: `**Overwatering:** yellow leaves, mushy stems, mold on soil, sour smell.\n\n**Underwatering:** crispy tips, wilting that recovers after water, soil pulling away from pot edges.\n\nPreferred pH: **{phRange}**.`,
      advancedBody: `**Overwatering:** yellow lower leaves, edema (blisters), mushy base, fungus gnats, sour soil.\n\n**Underwatering:** limp leaves that perk after water, brown crispy edges, hydrophobic soil that repels water.\n\n**pH:** target **{phRange}** — wrong pH can mimic watering problems.\n\nLog symptoms with a photo when adjusting your routine.`,
      imageKeys: ['water-overwater-signs', 'water-underwater-signs'],
    }),
    structuredSection({
      heading: 'Seasonal adjustments',
      whyItMatters:
        'Light and temperature change how fast soil dries. Seasonal tweaks keep {speciesName} on rhythm without guesswork.',
      beginnerBody: `- **Spring/summer:** growth may need more frequent checks.\n- **Fall/winter:** slow down; many plants need less water when light is lower.\n- **After repotting:** soil dries on a different schedule — recheck weekly.`,
      advancedBody: `- **Spring/summer:** shorter intervals in heat and active growth; watch outdoor rain.\n- **Fall/winter:** extend intervals; cold + wet soil is risky for most houseplants.\n- **After repotting:** fresh mix dries differently for 2–4 weeks.\n- **Heat waves / AC:** indoor humidity and airflow shift drying time — recheck, don't assume.`,
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters:
        'Catalog notes and toxicity info help you water {speciesName} safely for your household and environment.',
      beginnerBody: `{careNotes}\n\n{toxicityWarning}${snippetBlock(speciesId, TaskType.WATER)}`,
      advancedBody: `{careNotes}\n\n{toxicityWarning}${snippetBlock(speciesId, TaskType.WATER)}\n\nCross-check with your **{potSize}** pot and **{waterIntervalDays}**-day schedule — adjust when soil or weather says otherwise.`,
    }),
    structuredSection({
      heading: 'Common mistakes',
      whyItMatters: 'Most watering problems come from habit, not neglect. Avoiding these saves {speciesName} from repeat stress.',
      beginnerBody: `- Watering on a rigid calendar instead of checking soil.\n- Misting leaves as a substitute for root watering.\n- Using cold tap water on sensitive tropicals (let it sit overnight if needed).`,
      advancedBody: `- Calendar watering without a soil check.\n- Misting instead of watering roots.\n- Cold shock from icy tap water on tropical roots.\n- Watering at night when leaves stay wet in cool rooms.\n- Reusing saucer water or bottom-watering without ever flushing salts.`,
    }),
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
    structuredSection({
      heading: 'Why prune {speciesName}',
      whyItMatters:
        'Pruning shapes {speciesName}, improves airflow, and redirects energy into healthy new growth.',
      beginnerBody: `Pruning improves shape, airflow, and new growth for **{plantName}**. Active growth season is safest for most cuts.`,
      advancedBody: `Pruning removes competing growth, opens the canopy for light, and triggers branching at nodes.\n\nFor **{plantName}**, time heavy cuts to active growth — avoid major pruning when the plant is stressed or dormant unless removing dead tissue.`,
      imageKeys: ['prune-dead'],
    }),
    structuredSection({
      heading: 'Where and how to cut',
      whyItMatters:
        'Cutting above the right node directs new growth and avoids stubs that rot or fail to heal.',
      beginnerBody: technique[cat],
      advancedBody: `${technique[cat]}\n\n**Advanced:** Sterilize blades between plants; angle cuts slightly above nodes so water runs off. On woody stems, cut just outside the branch collar when removing whole branches.`,
      imageKeys: keys[cat],
    }),
    structuredSection({
      heading: 'Tools & sanitizing',
      whyItMatters: 'Clean, sharp tools make precise cuts that heal faster and reduce disease spread.',
      beginnerBody: `1. Use sharp bypass pruners or scissors.\n2. Wipe blades with rubbing alcohol between plants.\n3. Dull tools crush stems and invite disease.`,
      advancedBody: `1. Bypass pruners for live stems; anvil pruners only for dead wood.\n2. Disinfect between plants and after diseased tissue.\n3. Sharpen or replace blades that crush rather than slice.`,
      imageKeys: ['prune-cut', 'photo-prune-cut'],
    }),
    structuredSection({
      heading: 'How much to remove',
      whyItMatters: 'Removing too much at once stresses {speciesName} and can stall growth or cause dieback.',
      beginnerBody: `- Maximum **one-third** of healthy growth per session.\n- Spread heavy pruning across weeks if needed.\n- Stop if the plant looks stressed — wait for recovery.`,
      advancedBody: `- Never remove more than **one-third** of live foliage in one session.\n- For rejuvenation pruning, spread across 2–3 sessions weeks apart.\n- Pause if wilt, leaf drop, or sap bleeding persists beyond 48 hours.`,
      warnings: ['Do not remove more than one-third of healthy growth in a single session.'],
    }),
    structuredSection({
      heading: 'After-care',
      whyItMatters: 'Fresh cuts need stable conditions while {speciesName} seals wounds and pushes new growth.',
      beginnerBody: `- Water normally unless you removed a large portion of roots/leaves.\n- Avoid direct hot sun on freshly cut tropicals for a few days.\n- Resume fertilizer after you see new growth.`,
      advancedBody: `- Maintain normal watering unless you removed substantial foliage.\n- Keep out of harsh direct sun for 3–5 days on tropicals.\n- Hold fertilizer 2–4 weeks; resume when new buds appear.\n- Watch cut sites for oozing or blackening — trim back to healthy tissue if needed.`,
    }),
    structuredSection({
      heading: 'Species tips',
      whyItMatters: 'Species-specific notes help you prune {speciesName} at the right time and intensity.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.PRUNE)}\n\n{toxicityWarning}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.PRUNE)}\n\n{toxicityWarning}\n\nWhen in doubt, remove less — you can always prune again next month.`,
    }),
  ];
}

function fertilizeSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const heavy = cat === 'vegetable' || cat === 'fruit' || cat === 'citrus';
  return [
    structuredSection({
      heading: 'When to feed',
      whyItMatters:
        'Fertilizer supports growth when {speciesName} is actively producing leaves — not when it is dormant or stressed.',
      beginnerBody: heavy
        ? `Feed **{speciesName}** during active growth and fruiting. Pause or halve strength in low light or winter unless under grow lights.`
        : `Feed **{speciesName}** in spring and summer when you see new leaves. Reduce or stop in fall/winter dormancy.`,
      advancedBody: heavy
        ? `Feed during vegetative growth and fruit set. Pause in dormancy, after repot (4–6 weeks), or when soil is dry/cold.\n\nHeavy feeders may need weekly half-strength doses in peak season vs. monthly full doses — watch leaf color.`
        : `Feed when new growth appears (spring–summer). Stop or halve in fall/winter or when light drops below ~10 hours.\n\nNever feed a dry, wilted, or recently repotted plant until it shows recovery.`,
    }),
    structuredSection({
      heading: 'Product & dilution',
      whyItMatters:
        'Half-strength liquid feed reduces salt burn while still delivering nutrients {speciesName} needs at pH **{phRange}**.',
      beginnerBody: `1. Use balanced liquid fertilizer (e.g. 10-10-10).\n2. Mix at **half** label strength.\n3. Target soil pH **{phRange}** for nutrient uptake.`,
      advancedBody: `1. Balanced liquid (10-10-10) or species-appropriate blend.\n2. **Half** label strength; quarter strength for seedlings or stressed plants.\n3. pH **{phRange}** — test if leaves stay pale despite feeding.\n4. Alternate organic and synthetic if building long-term soil biology in containers.`,
      imageKeys: ['fertilize-dilute', 'fertilize-apply'],
    }),
    structuredSection({
      heading: 'Application steps',
      whyItMatters:
        'Applying to moist soil distributes nutrients evenly and avoids root burn on dry roots.',
      beginnerBody: `1. Water soil lightly first if it is bone dry.\n2. Apply fertilizer to **moist** soil only.\n3. Never foliar-feed edibles unless product is labeled food-safe.`,
      advancedBody: `1. Pre-moisten if soil is dry — never feed bone-dry roots.\n2. Pour evenly over soil surface, not the crown or fuzzy leaves.\n3. Flush with plain water monthly in containers to prevent salt buildup.\n4. Edibles: soil drench only unless product is explicitly food-safe for foliar use.`,
      warnings: ['Do not fertilize bone-dry soil — water first.'],
      imageKeys: ['fertilize-apply', 'photo-fertilize'],
    }),
    structuredSection({
      heading: 'pH interaction',
      whyItMatters:
        'Even perfect fertilizer fails if pH locks out nutrients. {speciesName} needs **{phRange}** for uptake.',
      beginnerBody: `Wrong pH locks out nutrients even when you fertilize. Test pH if leaves stay pale despite feeding.`,
      advancedBody: `Iron and manganese lock out above ~7.0 for many acid-lovers; phosphorus locks out below ~5.5.\n\nIf feeding does not green new growth within 2–3 weeks, test pH before increasing dose.`,
      imageKeys: ['ph-test'],
    }),
    structuredSection({
      heading: 'Signs of over-fertilizing',
      whyItMatters:
        'Salt burn damages roots quickly. Catching early signs lets you flush and recover {speciesName}.',
      beginnerBody: `Crispy leaf edges, white crust on soil, stunted growth, or sudden leaf drop. Flush pot with plain water if you suspect burn.`,
      advancedBody: `Crispy margins, white mineral crust, leaf tip burn, sudden drop, or no new growth despite feeding.\n\n**Recovery:** flush with plain water 2–3 times (let drain fully); hold fertilizer 4–6 weeks.`,
      warnings: ['White crust on soil often means salt buildup — flush before feeding again.'],
      imageKeys: ['fertilize-burn-signs'],
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Catalog care notes tailor feeding cadence and product choice for {speciesName}.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.FERTILIZE)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.FERTILIZE)}\n\nPause feed after repotting or diagnosis recovery until you see stable new growth.`,
    }),
  ];
}

function mistSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  const skip = cat === 'succulent' || cat === 'cactus';
  const needs = ['fern', 'palm', 'moisture', 'orchid', 'aroid'].includes(cat);

  const needsMistBeginner = skip
    ? `**Usually no.** {speciesName} prefers correct watering over wet leaves. Low humidity? Use a **pebble tray** or humidifier instead.`
    : needs
      ? `**Often helpful.** {speciesName} benefits from higher humidity. Misting supplements other methods but does not replace watering.`
      : `**Optional.** Mist only if you see crisp leaf edges or tips. Consistent soil moisture matters more.`;

  const needsMistAdvanced = skip
    ? `${needsMistBeginner}\n\n**Advanced:** Wet leaves on succulents invite rot and sunburn spots. Raise humidity around the pot, not on the leaf surface.`
    : needs
      ? `${needsMistBeginner}\n\n**Advanced:** Pair misting with a humidifier for ferns and calatheas — brief mist alone rarely shifts room RH enough.`
      : `${needsMistBeginner}\n\n**Advanced:** If crisp tips persist with good watering, check airflow and heat — mist is a band-aid, not the fix.`;

  return [
    structuredSection({
      heading: 'Does {speciesName} need misting?',
      whyItMatters:
        'Misting only helps certain plants in certain conditions. Using it on the wrong species can cause fungal problems.',
      beginnerBody: needsMistBeginner,
      advancedBody: needsMistAdvanced,
    }),
    structuredSection({
      heading: 'Technique',
      whyItMatters:
        'Fine spray and timing keep leaves from staying wet too long — wet foliage overnight is a common cause of mildew.',
      beginnerBody: `1. Use room-temperature water in a fine spray.\n2. Mist in the **morning** so leaves dry by evening.\n3. Avoid soaking fuzzy leaves, flowers, or crown of rosette plants.`,
      advancedBody: `1. Fine mist at room temperature — not cold tap shock.\n2. Morning only; leaves should dry before evening.\n3. Skip fuzzy leaves, blooms, and rosette crowns.\n4. Mist the air around the plant, not a heavy drench on foliage.`,
      imageKeys: ['mist-leaves', 'photo-mist'],
    }),
    structuredSection({
      heading: 'Better alternatives',
      whyItMatters:
        'Raising ambient humidity around {speciesName} often works better than wetting leaves directly.',
      beginnerBody: `- **Pebble tray:** pot sits above water, not in it.\n- **Grouping plants** raises local humidity.\n- **Humidifier:** best for ferns, calatheas, orchids indoors.`,
      advancedBody: `- **Pebble tray:** water below pot level; refill when low.\n- **Grouping:** microclimate bump of a few percent RH.\n- **Humidifier:** target 50–60% for tropicals; place near plants, not blasting one leaf.\n- **Bathroom / kitchen:** temporary boost during dry winter months.`,
      imageKeys: ['humidity-pebble-tray'],
    }),
    structuredSection({
      heading: 'When to skip',
      whyItMatters: 'Skipping mist when conditions are wrong prevents leaf spot and rot on {speciesName}.',
      beginnerBody: `- Succulents and plants with powdery leaves.\n- When fungal spots or mildew are present.\n- Cold rooms where water sits on leaves overnight.`,
      advancedBody: `- Succulents, cacti, and powdery or fuzzy-leaved species.\n- Active fungal spots, mildew, or recent pest treatment on leaves.\n- Cold rooms (<65°F / 18°C) where water lingers overnight.\n- During flowering if blooms are sensitive to moisture.`,
      warnings: skip ? ['Do not mist {speciesName} — use humidity around the pot instead.'] : undefined,
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Light and catalog notes tell you whether misting fits {speciesName} in your setup.',
      beginnerBody: `☀️ {sunlight}\n\n{careNotes}${snippetBlock(speciesId, TaskType.MIST)}`,
      advancedBody: `☀️ {sunlight}\n\n{careNotes}${snippetBlock(speciesId, TaskType.MIST)}\n\nIf humidity is chronically low, a humidifier beats daily misting for {speciesName}.`,
    }),
  ];
}

function phSections(speciesId: string): CareGuideSection[] {
  return [
    structuredSection({
      heading: 'Target pH for {speciesName}',
      whyItMatters:
        'Soil pH controls which nutrients {speciesName} can absorb. Wrong pH mimics fertilizer and watering problems.',
      beginnerBody: `**{speciesName}** prefers pH **{phRange}**. Outside this range, nutrients may be unavailable and leaves can yellow despite feeding.`,
      advancedBody: `**{speciesName}** target: **{phRange}**.\n\nNutrient lockout at wrong pH shows as yellowing, purple stems, or stunted tips even when you feed and water correctly.`,
      imageKeys: ['ph-test', 'photo-ph-test'],
    }),
    structuredSection({
      heading: 'How to test',
      whyItMatters:
        'Accurate sampling reflects what roots experience — surface-only tests can mislead on large pots.',
      beginnerBody: `1. Take samples from several spots near the root ball.\n2. Use a meter or kit on **moist** (not soggy) soil.\n3. For slurry tests, follow kit directions with distilled water.`,
      advancedBody: `1. Sample 2–3 inches down near the root ball, not just the surface.\n2. Test moist soil — dry pockets skew readings.\n3. Slurry/kits: use distilled water per label.\n4. Calibrate meters monthly; replace probe batteries as needed.\n5. Log date and reading — track drift after repot or fertilizer changes.`,
      imageKeys: ['ph-test'],
    }),
    structuredSection({
      heading: 'Adjusting pH',
      whyItMatters:
        'Small, measured corrections are safer than large swings that shock {speciesName} roots.',
      beginnerBody: `- **Too high (alkaline):** acidifying fertilizer, sulfur products (label rates), or acid-loving mix for blueberries/azaleas.\n- **Too low (acidic):** lime products sparingly — retest in 2 weeks.`,
      advancedBody: `- **Too high:** acidifying fertilizer, elemental sulfur (label rate), or repot into acid-loving mix for ericaceous plants.\n- **Too low:** dolomitic lime in small doses — retest in 2 weeks.\n- Change one variable at a time; flush salts if you over-corrected.\n- Tap water pH affects soil over time — note your water report if problems recur.`,
      warnings: ['Adjust slowly — large pH swings stress roots. Retest before a second correction.'],
    }),
    structuredSection({
      heading: 'Symptoms of wrong pH',
      whyItMatters:
        'Recognizing pH-related symptoms avoids treating the wrong problem with more fertilizer or water.',
      beginnerBody: `Interveinal yellowing, stunted new growth, or poor flowering when water and light are otherwise correct.`,
      advancedBody: `Interveinal chlorosis, stunted new growth, poor bloom, or leaf edge burn when watering and light look fine.\n\nRule out overwatering first — then test pH before increasing fertilizer.`,
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Some species are especially sensitive to pH drift — catalog notes flag {speciesName} specifics.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.PH_TEST)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.PH_TEST)}\n\nRetest 4–6 weeks after repotting — fresh mix changes pH and nutrient availability.`,
    }),
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
    structuredSection({
      heading: 'Inspection checklist',
      whyItMatters:
        'Early detection on {speciesName} keeps pests from spreading to your whole collection.',
      beginnerBody: `1. Leaf **undersides** and stem joints.\n2. New growth tips.\n3. Soil surface for fungus gnats.\n4. Sticky residue (honeydew) or fine webbing.\n\nCommon on {speciesName}: ${pests}.`,
      advancedBody: `1. Undersides, axils, and soil line — pests hide in joints.\n2. New growth and flower buds first.\n3. Soil surface and saucer for gnats and larvae.\n4. Honeydew, webbing, stippling, or cast skins.\n5. Use a magnifier for thrips and mites.\n\nCommon on {speciesName}: ${pests}.`,
      imageKeys: ['pest-inspect', 'pest-common-spots', 'photo-pest-underside'],
    }),
    structuredSection({
      heading: 'Treatment ladder',
      whyItMatters:
        'Escalating treatments in order protects {speciesName} and avoids unnecessary harsh chemicals.',
      beginnerBody: `1. Isolate from other plants.\n2. Rinse foliage with lukewarm water.\n3. Insecticidal soap or neem oil — full coverage, weekly repeats.\n4. Escalate only per label if infestation persists.`,
      advancedBody: `1. Isolate immediately; inspect neighbors.\n2. Shower or wipe leaves — dislodge adults and eggs.\n3. Insecticidal soap or neem — coat undersides; repeat weekly × 3.\n4. Systemics or stronger products only per label if still present.\n5. Replace top soil if fungus gnats persist after drying out.`,
      warnings: ['Always follow product labels — some treatments harm sensitive foliage on {speciesName}.'],
    }),
    structuredSection({
      heading: 'Prevention',
      whyItMatters: 'Most infestations arrive on new plants or stressed, overwatered {speciesName}.',
      beginnerBody: `- Quarantine new plants 2 weeks.\n- Avoid overwatering (fungus gnats).\n- Increase airflow between dense foliage.`,
      advancedBody: `- Quarantine newcomers 14 days minimum.\n- Let soil surface dry between waterings — breaks gnat cycles.\n- Airflow between pots; don't pack collections tight.\n- Inspect weekly on high-risk species (herbs, succulents in dry heat).`,
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Toxicity and species habits affect which treatments are safe for {speciesName}.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.PEST_CONTROL)}\n\n{toxicityWarning}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.PEST_CONTROL)}\n\n{toxicityWarning}\n\nPhoto pests before treatment — helps ID if the problem returns.`,
    }),
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
    structuredSection({
      heading: 'When to repot',
      whyItMatters:
        'Repotting at the right time gives {speciesName} fresh mix and room without shocking roots unnecessarily.',
      beginnerBody: `Repot **{speciesName}** when:\n- Roots circle the bottom or exit drainage holes.\n- Water runs straight through dry soil.\n- Growth stalled despite good care.\n\nMove up only **1–2 inches** in pot diameter.`,
      advancedBody: `Repot when roots are circling, top-heavy, or water channels through dry soil.\n\n**Wait if:** plant is flowering, recently stressed, or in peak summer heat outdoors.\n\nSize up **1–2 inches** only — oversized pots stay wet too long.`,
      imageKeys: ['repot-root', 'photo-repot'],
    }),
    structuredSection({
      heading: 'Soil mix',
      whyItMatters:
        'The right mix balances drainage and moisture for {speciesName} — wrong mix causes watering problems for months.',
      beginnerBody: `Use **${mix[cat]}** for {speciesName}.`,
      advancedBody: `Use **${mix[cat]}** for {speciesName}.\n\nRefresh at least one-third of volume even if staying in the same pot. Avoid garden soil alone in containers.`,
    }),
    structuredSection({
      heading: 'Step-by-step',
      whyItMatters:
        'Gentle handling and correct depth prevent rot and transplant shock after repotting {speciesName}.',
      beginnerBody: `1. Water lightly the day before.\n2. Slide plant out; loosen outer circling roots.\n3. Place at the **same depth** as before.\n4. Fill gaps with fresh mix; tamp lightly.\n5. Water thoroughly once; empty saucer.`,
      advancedBody: `1. Water lightly 24h before — easier removal, less root tear.\n2. Tease circling roots; trim only mushy or dead tissue.\n3. Same depth as before — burying the stem invites rot.\n4. Backfill in layers; tamp lightly — don't compact.\n5. One thorough water; no fertilizer for 4–6 weeks.`,
      warnings: ['Do not bury the stem deeper than before — keep the same soil line.'],
      imageKeys: ['repot-step-sequence', 'repot-root'],
    }),
    structuredSection({
      heading: 'After repot care',
      whyItMatters:
        'Roots need time to explore new mix. Over-care (sun, feed, water) after repot is a common cause of decline.',
      beginnerBody: `- Keep out of harsh direct sun 1–2 weeks.\n- Hold fertilizer 4–6 weeks while roots settle.\n- Expect mild wilt — normal while roots establish.`,
      advancedBody: `- Bright indirect light; no harsh direct sun for 1–2 weeks.\n- Hold fertilizer 4–6 weeks.\n- Mild wilt is normal — avoid overwatering "to help."\n- Recheck watering cadence; fresh mix dries differently.`,
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Species-specific timing and mix preferences help {speciesName} recover faster after repot.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.REPOT)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.REPOT)}\n\nLog repot date in your journal — schedules and dry-down rates change afterward.`,
    }),
  ];
}

function rotateSections(speciesId: string): CareGuideSection[] {
  return [
    structuredSection({
      heading: 'Why rotate',
      whyItMatters:
        'Plants grow toward light. Rotating {speciesName} keeps growth even and prevents a lopsided shape.',
      beginnerBody: 'Even light prevents leaning and encourages balanced growth on {speciesName}.',
      advancedBody:
        'Phototropism pulls new growth toward the window. Regular rotation prevents permanent lean and uneven canopy on {speciesName}.',
    }),
    structuredSection({
      heading: 'How to rotate',
      whyItMatters: 'A consistent quarter turn each time is easier to remember than ad-hoc adjustments.',
      beginnerBody:
        'Turn the pot a quarter turn each time. Mark the side facing the window so you rotate consistently.',
      advancedBody:
        'Quarter turn clockwise each watering or weekly. Mark pot or saucer with tape facing the window.\n\nLarge heavy pots: rotate less often but more degrees, or supplement with a grow light on the dark side.',
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Some species lean faster or need rotation less often — check notes for {speciesName}.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.ROTATE)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.ROTATE)}\n\nAfter rotating, expect new growth to reorient within 1–2 weeks.`,
    }),
  ];
}

function cleanLeavesSections(speciesId: string): CareGuideSection[] {
  return [
    structuredSection({
      heading: 'When to clean',
      whyItMatters:
        'Dust reduces photosynthesis on {speciesName}. Clean leaves absorb more light and look healthier.',
      beginnerBody:
        'Dust blocks light on {speciesName}. Wipe leaves when they look dull or every few weeks indoors.',
      advancedBody:
        'Clean when leaves look matte or every 2–4 weeks indoors. Near vents, roads, or kitchens — dust accumulates faster on {speciesName}.',
    }),
    structuredSection({
      heading: 'How to clean',
      whyItMatters: 'Gentle technique avoids tearing leaves or leaving residue that blocks stomata.',
      beginnerBody:
        'Use a damp soft cloth; support the leaf from underneath. Avoid leaf shine products on fuzzy or succulent leaves.',
      advancedBody:
        'Damp microfiber; support leaf from below. Wipe both sides on broad leaves.\n\nSkip leaf shine — it clogs pores. Fuzzy and succulent leaves: soft brush or rinse briefly, then dry.\n\nNever scrub hard or use soap unless labeled safe for plants.',
      warnings: ['Do not use leaf shine on fuzzy or succulent {speciesName} leaves.'],
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Some {speciesName} varieties have sensitive foliage — catalog notes flag what to avoid.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.CLEAN_LEAVES)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.CLEAN_LEAVES)}\n\nClean in the morning so leaves dry before cooler evening temps.`,
    }),
  ];
}

function inspectPestsSections(cat: PlantCategory, speciesId: string): CareGuideSection[] {
  return pestSections(cat, speciesId);
}

function checkMoistureSections(speciesId: string): CareGuideSection[] {
  return [
    structuredSection({
      heading: 'Finger test',
      whyItMatters:
        'Checking soil before watering prevents the most common cause of {speciesName} decline — wrong moisture.',
      beginnerBody:
        'Stick your finger 1–2 inches into the soil. Water {speciesName} only when the top feels dry for most houseplants.',
      advancedBody:
        'Finger 1–2 inches deep (deeper for large pots). Dry at that depth → OK to water soon.\n\nOptional: lift the pot — lighter weight usually means drier soil on {speciesName}.',
    }),
    structuredSection({
      heading: 'Signs to adjust',
      whyItMatters: 'Leaf and soil cues together tell you whether to water more or less on {speciesName}.',
      beginnerBody:
        'Yellowing lower leaves with wet soil may mean overwatering. Crispy tips with dry soil may mean underwatering.',
      advancedBody:
        '**Too wet:** yellow lower leaves, mushy base, gnats, sour soil smell.\n\n**Too dry:** limp leaves that perk after water, crispy edges, soil pulling from pot sides.\n\nAdjust interval — do not wait for severe symptoms on {speciesName}.',
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Dry-down rate varies by species, pot size, and season for {speciesName}.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.CHECK_MOISTURE)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.CHECK_MOISTURE)}\n\nBaseline schedule: about every **{waterIntervalDays}** days — always confirm with a soil check.`,
    }),
  ];
}

function healthCheckSections(speciesId: string): CareGuideSection[] {
  return [
    structuredSection({
      heading: 'Recovery check',
      whyItMatters:
        'Tracking progress after a problem helps you know if {speciesName} is recovering or needs a different fix.',
      beginnerBody:
        'Note new growth, leaf color, and soil moisture for {speciesName}. Compare to before your diagnosis or treatment.',
      advancedBody:
        'Compare today to your last journal entry: new leaves, color, firmness, soil moisture, pest signs.\n\nRecovery is often slow — look for **stopped decline** before expecting full bounce-back on {speciesName}.',
    }),
    structuredSection({
      heading: 'What to log',
      whyItMatters: 'Photos and notes make patterns visible when {speciesName} has recurring issues.',
      beginnerBody:
        'Take a photo, jot symptoms that improved or worsened, and adjust watering or light if needed.',
      advancedBody:
        'Same angle and lighting for photos. Log: symptoms better/worse/same, watering changes, light moves, treatments applied.\n\nIf unchanged after 2 weeks, revisit diagnosis — not every problem is watering.',
    }),
    structuredSection({
      heading: 'Species notes',
      whyItMatters: 'Species-specific recovery timelines help set realistic expectations for {speciesName}.',
      beginnerBody: `{careNotes}${snippetBlock(speciesId, TaskType.HEALTH_CHECK)}`,
      advancedBody: `{careNotes}${snippetBlock(speciesId, TaskType.HEALTH_CHECK)}\n\nSchedule the next health check when symptoms are still evolving — usually 7–14 days out.`,
    }),
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
