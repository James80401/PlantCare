/**
 * Deterministic dashboard account fixtures for contract and performance checks.
 * The fixed values keep payload comparisons stable across machines and dates.
 */
export function buildDashboardPlantFixture(count: 0 | 10 | 100) {
  return Array.from({ length: count }, (_, index) => ({
    id: `fixture-plant-${index + 1}`,
    nickname: `Fixture plant ${index + 1}`,
    imageUrl: `/uploads/fixture-plant-${index + 1}.webp`,
    createdAt: new Date(`2025-01-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`),
    location: index % 2 === 0 ? 'Living room' : 'Patio',
    species: {
      commonName: `Fixture species ${index + 1}`,
      scientificName: `Plantus fixture ${index + 1}`,
      sunlight: index % 2 === 0 ? 'bright indirect' : 'full sun',
      wateringFreqDays: 7,
    },
    tasks: [],
    diagnoses: [],
  }));
}

export const DASHBOARD_FIXTURE_SIZES = [0, 10, 100] as const;
