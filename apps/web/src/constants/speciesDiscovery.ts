export const SPECIES_DISCOVERY_FILTERS = [
  { key: 'petSafe', label: 'Pet-safe' },
  { key: 'lowLight', label: 'Low light' },
  { key: 'edible', label: 'Edible' },
  { key: 'droughtTolerant', label: 'Drought-tolerant' },
  { key: 'indoor', label: 'Indoor' },
  { key: 'outdoor', label: 'Outdoor' },
] as const;

export type SpeciesDiscoveryFilterKey = (typeof SPECIES_DISCOVERY_FILTERS)[number]['key'];

export const defaultSpeciesDiscoveryFilters: Record<SpeciesDiscoveryFilterKey, boolean> = {
  petSafe: false,
  lowLight: false,
  edible: false,
  droughtTolerant: false,
  indoor: false,
  outdoor: false,
};
