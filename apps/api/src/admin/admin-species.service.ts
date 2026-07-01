import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PlantSpecies } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSpeciesReviewDto } from './dto/admin-species-review.dto';

type ExternalSpeciesStatus = 'user_confirmed' | 'reviewed' | 'curated';

type ExternalSource = {
  provider: string;
  providerMatchId?: string;
  confidence?: number;
  confirmedAt?: string;
  confirmedBy?: 'user';
  status: ExternalSpeciesStatus;
  reviewedAt?: string;
  curatedAt?: string;
  reviewNote?: string;
};

type SpeciesMetadataObject = Record<string, unknown> & {
  externalSource?: ExternalSource;
};

export type AdminExternalSpeciesRow = Pick<
  PlantSpecies,
  | 'id'
  | 'commonName'
  | 'scientificName'
  | 'sunlight'
  | 'wateringFreqDays'
  | 'toxicity'
  | 'careNotes'
  | 'defaultImageUrl'
  | 'createdAt'
  | 'updatedAt'
> & {
  externalSource: ExternalSource;
};

@Injectable()
export class AdminSpeciesService {
  constructor(private prisma: PrismaService) {}

  async listExternalSpecies() {
    const rows = await this.prisma.plantSpecies.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    const items = rows.flatMap((species) => {
      const metadata = parseSpeciesMetadata(species.metadataJson);
      if (!metadata.externalSource) return [];
      return [formatExternalSpecies(species, metadata.externalSource)];
    });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        total: items.length,
        userConfirmed: items.filter((item) => item.externalSource.status === 'user_confirmed')
          .length,
        reviewed: items.filter((item) => item.externalSource.status === 'reviewed').length,
        curated: items.filter((item) => item.externalSource.status === 'curated').length,
        needsReview: items.filter((item) => item.externalSource.status !== 'curated').length,
      },
      items,
    };
  }

  async updateExternalSpeciesStatus(speciesId: string, dto: AdminSpeciesReviewDto) {
    const species = await this.prisma.plantSpecies.findUnique({ where: { id: speciesId } });
    if (!species) throw new NotFoundException('Species not found');

    const metadata = parseSpeciesMetadata(species.metadataJson);
    if (!metadata.externalSource) {
      throw new BadRequestException('Species was not created from an external identification');
    }

    const now = new Date().toISOString();
    const reviewNote = dto.reviewNote?.trim();
    const externalSource: ExternalSource = {
      ...metadata.externalSource,
      status: dto.status,
      reviewedAt: now,
      ...(dto.status === 'curated' ? { curatedAt: now } : {}),
      ...(reviewNote ? { reviewNote } : {}),
    };

    const updated = await this.prisma.plantSpecies.update({
      where: { id: speciesId },
      data: {
        metadataJson: JSON.stringify({ ...metadata, externalSource }),
      },
    });

    return {
      species: formatExternalSpecies(updated, externalSource),
    };
  }
}

function parseSpeciesMetadata(value?: string | null): SpeciesMetadataObject {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const metadata = parsed as SpeciesMetadataObject;
    const source = metadata.externalSource;
    if (!source || typeof source !== 'object') return metadata;
    if (!source.provider || !source.status) {
      delete metadata.externalSource;
    }
    return metadata;
  } catch {
    return {};
  }
}

function formatExternalSpecies(
  species: PlantSpecies,
  externalSource: ExternalSource,
): AdminExternalSpeciesRow {
  return {
    id: species.id,
    commonName: species.commonName,
    scientificName: species.scientificName,
    sunlight: species.sunlight,
    wateringFreqDays: species.wateringFreqDays,
    toxicity: species.toxicity,
    careNotes: species.careNotes,
    defaultImageUrl: species.defaultImageUrl,
    createdAt: species.createdAt,
    updatedAt: species.updatedAt,
    externalSource,
  };
}
