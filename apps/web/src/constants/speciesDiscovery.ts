export const SPECIES_DISCOVERY_FILTERS = [
  { key: 'beginnerFriendly', label: 'Beginner-friendly' },
  { key: 'petSafe', label: 'Pet-safe' },
  { key: 'lowLight', label: 'Low light' },
  { key: 'succulent', label: 'Succulent' },
  { key: 'edible', label: 'Edible' },
  { key: 'droughtTolerant', label: 'Drought-tolerant' },
  { key: 'indoor', label: 'Indoor' },
  { key: 'outdoor', label: 'Outdoor' },
] as const;

export const SPECIES_BROWSE_SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'waterAsc', label: 'Water less often' },
  { value: 'waterDesc', label: 'Water more often' },
] as const;

export type SpeciesBrowseSort = (typeof SPECIES_BROWSE_SORT_OPTIONS)[number]['value'];

export type SpeciesDiscoveryFilterKey = (typeof SPECIES_DISCOVERY_FILTERS)[number]['key'];

export const defaultSpeciesDiscoveryFilters: Record<SpeciesDiscoveryFilterKey, boolean> = {
  beginnerFriendly: false,
  petSafe: false,
  lowLight: false,
  succulent: false,
  edible: false,
  droughtTolerant: false,
  indoor: false,
  outdoor: false,
};
