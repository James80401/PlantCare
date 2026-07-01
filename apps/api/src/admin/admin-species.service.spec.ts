import { BadRequestException } from '@nestjs/common';
import { AdminSpeciesService } from './admin-species.service';

const externalMetadata = {
  pests: ['Spider mites'],
  externalSource: {
    provider: 'plantnet',
    providerMatchId: 'pln-123',
    confidence: 0.82,
    confirmedAt: '2026-06-30T00:00:00.000Z',
    confirmedBy: 'user',
    status: 'user_confirmed',
  },
};

const externalSpecies = {
  id: 'species-1',
  commonName: 'Prayer Plant',
  scientificName: 'Maranta leuconeura',
  sunlight: 'Bright indirect light',
  wateringFreqDays: 7,
  toxicity: 'Non-toxic',
  careNotes: 'Keep evenly moist.',
  defaultImageUrl: null,
  metadataJson: JSON.stringify(externalMetadata),
  createdAt: new Date('2026-06-30T00:00:00.000Z'),
  updatedAt: new Date('2026-06-30T00:00:00.000Z'),
  phMin: 6,
  phMax: 7,
};

const catalogSpecies = {
  ...externalSpecies,
  id: 'species-2',
  commonName: 'Pothos',
  scientificName: 'Epipremnum aureum',
  metadataJson: JSON.stringify({ pests: ['Mealybugs'] }),
};

describe('AdminSpeciesService', () => {
  function createService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      plantSpecies: {
        findMany: jest.fn().mockResolvedValue([externalSpecies, catalogSpecies]),
        findUnique: jest.fn().mockResolvedValue(externalSpecies),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...externalSpecies, metadataJson: data.metadataJson }),
        ),
      },
      ...overrides,
    };
    return { service: new AdminSpeciesService(prisma as never), prisma };
  }

  it('lists only species created from external identification metadata', async () => {
    const { service } = createService();

    const result = await service.listExternalSpecies();

    expect(result.totals).toMatchObject({
      total: 1,
      userConfirmed: 1,
      reviewed: 0,
      curated: 0,
      needsReview: 1,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'species-1',
      commonName: 'Prayer Plant',
      externalSource: expect.objectContaining({ provider: 'plantnet' }),
    });
  });

  it('marks an external species reviewed while preserving metadata', async () => {
    const { service, prisma } = createService();

    const result = await service.updateExternalSpeciesStatus('species-1', {
      status: 'reviewed',
      reviewNote: 'Looks plausible.',
    });

    const metadata = JSON.parse(
      prisma.plantSpecies.update.mock.calls[0][0].data.metadataJson,
    ) as typeof externalMetadata & {
      externalSource: typeof externalMetadata.externalSource & { reviewedAt?: string };
    };
    expect(metadata.pests).toEqual(['Spider mites']);
    expect(metadata.externalSource).toMatchObject({
      provider: 'plantnet',
      status: 'reviewed',
      reviewNote: 'Looks plausible.',
    });
    expect(metadata.externalSource.reviewedAt).toBeTruthy();
    expect(result.species.externalSource.status).toBe('reviewed');
  });

  it('updates external species review fields without losing provenance', async () => {
    const { service, prisma } = createService();

    const result = await service.updateExternalSpeciesStatus('species-1', {
      sunlight: 'Medium indirect light',
      wateringFreqDays: 5,
      toxicity: 'Unknown - review before placing near pets',
      careNotes: 'Keep evenly moist, but never soggy.',
      defaultImageUrl: 'https://example.com/prayer-plant.jpg',
      sourceNote: 'Care cadence checked against provider result and local houseplant baseline.',
      photoReviewStatus: 'needs_better_image',
      photoReviewNote: 'Image is acceptable for triage, but needs a stronger leaf close-up.',
    });

    const updateArg = prisma.plantSpecies.update.mock.calls[0][0];
    expect(updateArg.data).toMatchObject({
      sunlight: 'Medium indirect light',
      wateringFreqDays: 5,
      toxicity: 'Unknown - review before placing near pets',
      careNotes: 'Keep evenly moist, but never soggy.',
      defaultImageUrl: 'https://example.com/prayer-plant.jpg',
    });

    const metadata = JSON.parse(updateArg.data.metadataJson) as typeof externalMetadata & {
      externalSource: typeof externalMetadata.externalSource & {
        sourceNote?: string;
        photoReviewStatus?: string;
        photoReviewNote?: string;
      };
    };
    expect(metadata.pests).toEqual(['Spider mites']);
    expect(metadata.externalSource).toMatchObject({
      provider: 'plantnet',
      status: 'user_confirmed',
      sourceNote: 'Care cadence checked against provider result and local houseplant baseline.',
      photoReviewStatus: 'needs_better_image',
      photoReviewNote: 'Image is acceptable for triage, but needs a stronger leaf close-up.',
    });
    expect(result.species.wateringFreqDays).toBe(7);
  });

  it('rejects catalog species without external provenance', async () => {
    const { service } = createService({
      plantSpecies: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(catalogSpecies),
        update: jest.fn(),
      },
    });

    await expect(
      service.updateExternalSpeciesStatus('species-2', { status: 'reviewed' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
