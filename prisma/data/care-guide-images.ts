export interface ImageDef {
  imageKey: string;
  caption: string;
  altText: string;
  sortOrder: number;
  mediaType?: 'svg' | 'photo';
}

export const genericImages: Record<string, ImageDef> = {
  waterSoil: {
    imageKey: 'water-soil-check',
    caption: 'Check soil moisture before watering',
    altText: 'Finger inserted into potting soil to test dryness',
    sortOrder: 0,
    mediaType: 'svg',
  },
  waterLight: {
    imageKey: 'water-light',
    caption: 'Light watering for dry-loving plants',
    altText: 'Small amount of water around base of plant',
    sortOrder: 1,
    mediaType: 'svg',
  },
  waterThorough: {
    imageKey: 'water-thorough',
    caption: 'Thorough watering until drainage',
    altText: 'Water flowing through drainage holes at bottom of pot',
    sortOrder: 2,
    mediaType: 'svg',
  },
  waterOverwater: {
    imageKey: 'water-overwater-signs',
    caption: 'Signs of overwatering',
    altText: 'Diagram of yellow leaves and soggy soil from too much water',
    sortOrder: 3,
    mediaType: 'svg',
  },
  waterUnderwater: {
    imageKey: 'water-underwater-signs',
    caption: 'Signs of underwatering',
    altText: 'Diagram of wilted plant with dry soil pulling from pot edges',
    sortOrder: 4,
    mediaType: 'svg',
  },
  prunePinch: {
    imageKey: 'prune-pinch',
    caption: 'Pinch just above a leaf node',
    altText: 'Fingers pinching stem above two small leaves',
    sortOrder: 0,
    mediaType: 'svg',
  },
  pruneCut: {
    imageKey: 'prune-cut',
    caption: 'Clean cut at 45° above a node',
    altText: 'Pruning shears making angled cut above leaf pair',
    sortOrder: 1,
    mediaType: 'svg',
  },
  pruneDead: {
    imageKey: 'prune-dead',
    caption: 'Remove yellow or damaged leaves at base',
    altText: 'Removing brown leaf at soil line',
    sortOrder: 2,
    mediaType: 'svg',
  },
  pruneHerb: {
    imageKey: 'prune-herb-harvest',
    caption: 'Harvest herbs above a leaf pair',
    altText: 'Herb stem with cut location above two leaves',
    sortOrder: 3,
    mediaType: 'svg',
  },
  pruneVine: {
    imageKey: 'prune-vine-node',
    caption: 'Trim vine at a node',
    altText: 'Vine stem cut above node for branching',
    sortOrder: 4,
    mediaType: 'svg',
  },
  fertilizeDilute: {
    imageKey: 'fertilize-dilute',
    caption: 'Dilute fertilizer to half strength',
    altText: 'Measuring liquid fertilizer into watering can',
    sortOrder: 0,
    mediaType: 'svg',
  },
  fertilizeApply: {
    imageKey: 'fertilize-apply',
    caption: 'Apply to moist soil',
    altText: 'Pouring diluted fertilizer on potted plant soil',
    sortOrder: 1,
    mediaType: 'svg',
  },
  fertilizeBurn: {
    imageKey: 'fertilize-burn-signs',
    caption: 'Fertilizer burn on leaf tips',
    altText: 'Leaf with brown crispy edges from excess fertilizer',
    sortOrder: 2,
    mediaType: 'svg',
  },
  mistLeaves: {
    imageKey: 'mist-leaves',
    caption: 'Mist leaf surfaces, not flowers',
    altText: 'Fine spray on houseplant leaves',
    sortOrder: 0,
    mediaType: 'svg',
  },
  humidityTray: {
    imageKey: 'humidity-pebble-tray',
    caption: 'Pebble tray for humidity',
    altText: 'Pot on pebbles above water line in tray',
    sortOrder: 1,
    mediaType: 'svg',
  },
  repotRoot: {
    imageKey: 'repot-root',
    caption: 'Healthy root ball',
    altText: 'Root ball with healthy white roots',
    sortOrder: 0,
    mediaType: 'svg',
  },
  repotSequence: {
    imageKey: 'repot-step-sequence',
    caption: 'Repotting steps',
    altText: 'Sequence showing loosen roots and place in new pot',
    sortOrder: 1,
    mediaType: 'svg',
  },
  phStrip: {
    imageKey: 'ph-test',
    caption: 'Compare strip color to chart',
    altText: 'pH test strip in soil slurry',
    sortOrder: 0,
    mediaType: 'svg',
  },
  pestInspect: {
    imageKey: 'pest-inspect',
    caption: 'Inspect undersides of leaves',
    altText: 'Leaf underside inspection for pests',
    sortOrder: 0,
    mediaType: 'svg',
  },
  pestSpots: {
    imageKey: 'pest-common-spots',
    caption: 'Common pest hiding spots',
    altText: 'Diagram of stem joints and leaf undersides to inspect',
    sortOrder: 1,
    mediaType: 'svg',
  },
  photoSoilCheck: {
    imageKey: 'photo-soil-check',
    caption: 'Reference: soil moisture check',
    altText: 'Hand checking potting soil moisture depth',
    sortOrder: 10,
    mediaType: 'photo',
  },
  photoWaterDrainage: {
    imageKey: 'photo-water-drainage',
    caption: 'Reference: water draining from pot',
    altText: 'Water running from drainage holes of a container plant',
    sortOrder: 11,
    mediaType: 'photo',
  },
  photoPrunePinch: {
    imageKey: 'photo-prune-pinch',
    caption: 'Reference: pinch above node',
    altText: 'Pinching herb stem above leaf nodes',
    sortOrder: 12,
    mediaType: 'photo',
  },
  photoPruneCut: {
    imageKey: 'photo-prune-cut',
    caption: 'Reference: pruning cut',
    altText: 'Pruner making cut above plant node',
    sortOrder: 13,
    mediaType: 'photo',
  },
  photoFertilize: {
    imageKey: 'photo-fertilize',
    caption: 'Reference: feeding container plant',
    altText: 'Watering can feeding a potted plant',
    sortOrder: 14,
    mediaType: 'photo',
  },
  photoMist: {
    imageKey: 'photo-mist',
    caption: 'Reference: misting foliage',
    altText: 'Spray bottle misting houseplant leaves',
    sortOrder: 15,
    mediaType: 'photo',
  },
  photoPhTest: {
    imageKey: 'photo-ph-test',
    caption: 'Reference: soil pH testing',
    altText: 'pH meter or test kit at potted plant',
    sortOrder: 16,
    mediaType: 'photo',
  },
  photoPestUnderside: {
    imageKey: 'photo-pest-underside',
    caption: 'Reference: inspect leaf underside',
    altText: 'Leaf turned over to inspect for pests',
    sortOrder: 17,
    mediaType: 'photo',
  },
  photoRepot: {
    imageKey: 'photo-repot',
    caption: 'Reference: repotting',
    altText: 'Plant being repotted into larger container',
    sortOrder: 18,
    mediaType: 'photo',
  },
};

export const allImageDefs: Record<string, ImageDef> = genericImages;

export function imagesByKeys(
  keys: string[],
  pool: Record<string, ImageDef> = allImageDefs,
): ImageDef[] {
  const seen = new Set<string>();
  const out: ImageDef[] = [];
  for (const key of keys) {
    const byPool = pool[key];
    const byKey = Object.values(allImageDefs).find((i) => i.imageKey === key);
    const img = byPool ?? byKey;
    if (img && !seen.has(img.imageKey)) {
      seen.add(img.imageKey);
      out.push(img);
    }
  }
  return out;
}
