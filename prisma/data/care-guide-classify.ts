import type { SpeciesSeed } from './species-catalog';

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

const SUCCULENT_KEYWORDS =
  /succulent|aloe|agave|sedum|echeveria|crassula|haworthia|kalanchoe|jade|string of|lithops|sempervivum|aeonium|senecio|portulacaria|gasteria|zz plant|snake plant|sansevieria|hoya/i;
const AROID_KEYWORDS = /monstera|philodendron|scindapsus|anthurium|spathiphyllum|alocasia|colocasia|syngonium|dieffenbachia|aglaonema/i;
const VINE_KEYWORDS =
  /pothos|ivy|vine|trailing|ceropegia|grape|cucumber|bean|pea|melon|squash|pumpkin|clematis/i;
const FERN_KEYWORDS = /fern|calathea|maranta|prayer|moss|maidenhair|bird.?s nest fern|fittonia/i;
const PALM_KEYWORDS = /palm|areca|kentia|majesty|parlor palm|chamaedorea|cycad|ravenea|howea/i;
const CITRUS_KEYWORDS = /citrus|lemon|lime|orange|grapefruit|calamondin|kumquat/i;
const ORCHID_KEYWORDS = /orchid|phalaenopsis|dendrobium|cattleya|oncidium/i;
const HERB_KEYWORDS =
  /basil|mint|thyme|oregano|sage|rosemary|parsley|cilantro|dill|chive|lavender|lemongrass|chamomile|tarragon|fennel|catnip|stevia|marjoram|bay laurel|borage|hyssop|shiso|epazote|culantro|sorrel|savory|verbena|calendula|leek|shallot|horseradish/i;
const VEG_KEYWORDS =
  /tomato|pepper|lettuce|spinach|kale|broccoli|cauliflower|carrot|beet|radish|onion|garlic|potato|eggplant|corn|celery|asparagus|cabbage|chard|arugula|bok choy|brussels|squash|zucchini|cucumber|okra|melon|tomatillo|kohlrabi|turnip|rutabaga|collard|mustard|mizuna|tatsoi|nasturtium|artichoke|rhubarb|pea|bean|edamame|fava/i;
const FRUIT_KEYWORDS =
  /strawberry|blueberry|raspberry|blackberry|fig|avocado|pineapple|banana|pomegranate|apple|cherry|berry/i;
const FLOWERING_KEYWORDS =
  /rose|hydrangea|azalea|camellia|gardenia|begonia|hibiscus|bougainvillea|lilac|peony|tulip|daffodil|marigold|petunia|geranium|impatiens|pansy|viola|zinnia|dahlia|chrysanthemum|african violet|salvia|monarda|milkweed|asclepias|echinacea|cosmos|phlox|gaillardia|coreopsis|aster|goldenrod|verbena|butterfly|liatris|joe-pye|lobelia|columbine|hollyhock|yarrow|alyssum|clover|penstemon|catmint|blanket flower|tickseed/i;

export function classifySpecies(s: SpeciesSeed): PlantCategory {
  const text = `${s.commonName} ${s.scientificName} ${s.careNotes}`;
  if (ORCHID_KEYWORDS.test(text)) return 'orchid';
  if (s.wateringFreqDays >= 18 || /cactus|lithops|agave/i.test(text)) return 'cactus';
  if (s.wateringFreqDays >= 12 || SUCCULENT_KEYWORDS.test(text)) return 'succulent';
  if (HERB_KEYWORDS.test(s.commonName)) return 'herb';
  if (VEG_KEYWORDS.test(s.commonName)) return 'vegetable';
  if (CITRUS_KEYWORDS.test(text)) return 'citrus';
  if (FRUIT_KEYWORDS.test(s.commonName)) return 'fruit';
  if (AROID_KEYWORDS.test(text)) return 'aroid';
  if (VINE_KEYWORDS.test(text)) return 'vine';
  if (FERN_KEYWORDS.test(text)) return 'fern';
  if (PALM_KEYWORDS.test(text)) return 'palm';
  if (FLOWERING_KEYWORDS.test(text)) return 'flowering';
  if (s.wateringFreqDays <= 4) return 'moisture';
  return 'houseplant';
}

export function phRangeTemplate(s: SpeciesSeed): string {
  return `${s.phMin}–${s.phMax}`;
}

export function toxicityWarning(s: SpeciesSeed): string {
  if (/non-toxic/i.test(s.toxicity)) return '';
  return `⚠️ **Safety:** ${s.toxicity}. Wash hands after handling; keep away from pets and children if toxic.`;
}
