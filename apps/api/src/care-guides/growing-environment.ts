export type GrowingEnvironment = 'indoor' | 'outdoor' | 'semi_outdoor';

export type PlantCategory =
  | 'succulent'
  | 'cactus'
  | 'herb'
  | 'vegetable'
  | 'fruit'
  | 'vine'
  | 'aroid'
  | 'fern'
  | 'palm'
  | 'citrus'
  | 'orchid'
  | 'flowering'
  | 'moisture'
  | 'houseplant';

const OUTDOOR_KEYWORDS =
  /outdoor|garden|yard|backyard|front yard|plot|allotment|field|ground|in.?ground|landscape|vegetable bed|flower bed/i;
const SEMI_OUTDOOR_KEYWORDS =
  /balcony|patio|porch|deck|terrace|greenhouse|sunroom|conservatory|shed|garage/i;

const SUCCULENT_KEYWORDS =
  /succulent|aloe|agave|sedum|echeveria|crassula|haworthia|kalanchoe|jade|string of|lithops|sempervivum|aeonium|senecio|portulacaria|gasteria|zz plant|snake plant|sansevieria|hoya/i;
const AROID_KEYWORDS =
  /monstera|philodendron|scindapsus|anthurium|spathiphyllum|alocasia|colocasia|syngonium|dieffenbachia|aglaonema/i;
const VINE_KEYWORDS =
  /pothos|ivy|vine|trailing|ceropegia|grape|cucumber|bean|pea|melon|squash|pumpkin|clematis/i;
const FERN_KEYWORDS = /fern|calathea|maranta|prayer|moss|maidenhair|bird.?s nest fern|fittonia/i;
const PALM_KEYWORDS =
  /palm|areca|kentia|majesty|parlor palm|chamaedorea|cycad|ravenea|howea/i;
const CITRUS_KEYWORDS = /citrus|lemon|lime|orange|grapefruit|calamondin|kumquat/i;
const ORCHID_KEYWORDS = /orchid|phalaenopsis|dendrobium|cattleya|oncidium/i;
const HERB_KEYWORDS =
  /basil|mint|thyme|oregano|sage|rosemary|parsley|cilantro|dill|chive|lavender|lemongrass|chamomile|tarragon|fennel|catnip|stevia|marjoram|bay laurel/i;
const VEG_KEYWORDS =
  /tomato|pepper|lettuce|spinach|kale|broccoli|cauliflower|carrot|beet|radish|onion|garlic|potato|eggplant|corn|celery|asparagus|cabbage|chard|arugula|bok choy|brussels|squash|zucchini|cucumber/i;
const FRUIT_KEYWORDS =
  /strawberry|blueberry|raspberry|blackberry|fig|avocado|pineapple|banana|pomegranate|apple|cherry|berry/i;
const FLOWERING_KEYWORDS =
  /rose|hydrangea|azalea|camellia|gardenia|begonia|hibiscus|bougainvillea|lilac|peony|tulip|daffodil|marigold|petunia|geranium|impatiens|pansy|viola|zinnia|dahlia|chrysanthemum|african violet/i;

export function inferGrowingEnvironment(location?: string | null): GrowingEnvironment {
  const loc = (location ?? '').trim();
  if (!loc) return 'indoor';
  if (OUTDOOR_KEYWORDS.test(loc)) return 'outdoor';
  if (SEMI_OUTDOOR_KEYWORDS.test(loc)) return 'semi_outdoor';
  return 'indoor';
}

export function growingEnvironmentLabel(env: GrowingEnvironment): string {
  switch (env) {
    case 'outdoor':
      return 'Outdoors';
    case 'semi_outdoor':
      return 'Covered outdoor (balcony, patio, greenhouse)';
    default:
      return 'Indoors';
  }
}

export function classifySpeciesForCare(species: {
  commonName: string;
  scientificName?: string | null;
  careNotes?: string | null;
  wateringFreqDays: number;
}): PlantCategory {
  const text = `${species.commonName} ${species.scientificName ?? ''} ${species.careNotes ?? ''}`;
  if (ORCHID_KEYWORDS.test(text)) return 'orchid';
  if (species.wateringFreqDays >= 18 || /cactus|lithops|agave/i.test(text)) return 'cactus';
  if (species.wateringFreqDays >= 12 || SUCCULENT_KEYWORDS.test(text)) return 'succulent';
  if (HERB_KEYWORDS.test(species.commonName)) return 'herb';
  if (VEG_KEYWORDS.test(species.commonName)) return 'vegetable';
  if (CITRUS_KEYWORDS.test(text)) return 'citrus';
  if (FRUIT_KEYWORDS.test(species.commonName)) return 'fruit';
  if (AROID_KEYWORDS.test(text)) return 'aroid';
  if (VINE_KEYWORDS.test(text)) return 'vine';
  if (FERN_KEYWORDS.test(text)) return 'fern';
  if (PALM_KEYWORDS.test(text)) return 'palm';
  if (FLOWERING_KEYWORDS.test(text)) return 'flowering';
  if (species.wateringFreqDays <= 4) return 'moisture';
  return 'houseplant';
}

const HIGH_HUMIDITY_CATEGORIES: PlantCategory[] = ['fern', 'palm', 'moisture', 'orchid', 'aroid'];

export function shouldScheduleMist(
  env: GrowingEnvironment,
  category: PlantCategory,
): boolean {
  if (env === 'outdoor') return false;
  if (category === 'succulent' || category === 'cactus') return false;
  if (env === 'semi_outdoor') {
    return HIGH_HUMIDITY_CATEGORIES.includes(category);
  }
  return true;
}

export function buildLocationCareParagraph(
  env: GrowingEnvironment,
  location: string,
  plantName: string,
): string {
  const place = location.trim() || 'your space';
  switch (env) {
    case 'outdoor':
      return `**${plantName}** is marked as growing **outdoors** (${place}). Rain, wind, and sun will drive watering more than a fixed calendar — adjust after heat waves, frost, or heavy rain. We skip indoor-style misting reminders for outdoor plants.`;
    case 'semi_outdoor':
      return `**${plantName}** is in a **covered outdoor** spot (${place}). It may dry out faster than indoor plants in summer and cool faster in winter — watch soil moisture and bring frost-sensitive plants inside when needed.`;
    default:
      return `**${plantName}** is growing **indoors** (${place}). Stable room humidity and lower light than outdoors mean watering on schedule matters; use a bright window or grow light if leaves look stretched or pale.`;
  }
}

export function buildMistCareParagraph(
  env: GrowingEnvironment,
  category: PlantCategory,
  plantName: string,
): string {
  if (env === 'outdoor') {
    return `**Misting:** Not recommended for **${plantName}** outdoors. Open air already provides airflow; extra leaf wetness can encourage fungal spots. Water the soil or rely on rain instead.`;
  }
  if (category === 'succulent' || category === 'cactus') {
    return `**Misting:** Usually **not needed** for **${plantName}**. Succulent and cactus leaves prefer dry air; misting can cause spots or rot.`;
  }
  if (env === 'semi_outdoor') {
    if (HIGH_HUMIDITY_CATEGORIES.includes(category)) {
      return `**Misting:** Optional for **${plantName}** on your balcony or patio if leaves look dry in hot, windy weather. Morning is best so leaves dry before night.`;
    }
    return `**Misting:** Usually **optional** for **${plantName}** in a covered outdoor spot. Natural humidity is often enough unless you see crispy leaf tips in dry heat.`;
  }
  if (HIGH_HUMIDITY_CATEGORIES.includes(category)) {
    return `**Misting:** Can help **${plantName}** when indoor air is dry (winter heating, AC). A pebble tray or humidifier is often more effective than frequent misting.`;
  }
  return `**Misting:** Optional for **${plantName}** indoors. If leaf edges crisp up, try higher humidity first; avoid misting fuzzy or succulent leaves.`;
}
