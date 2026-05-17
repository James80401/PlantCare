import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  speciesDiscoveryTags,
  speciesMatchesFilters,
  type SpeciesSearchFilters,
} from './species-filters';

@Injectable()
export class PerenualService {
  private readonly logger = new Logger(PerenualService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://perenual.com/api/v2';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.config.get<string>('PERENUAL_API_KEY');
  }

  async search(query: string, filters: SpeciesSearchFilters = {}) {
    const hasFilters = Object.values(filters).some(Boolean);
    const local = await this.prisma.plantSpecies.findMany({
      where: {
        OR: [
          { commonName: { contains: query } },
          { scientificName: { contains: query } },
        ],
      },
      take: hasFilters ? 500 : 30,
    });
    const filteredLocal = hasFilters
      ? local.filter((species) => speciesMatchesFilters(species, filters))
      : local;
    const withTags = (species: typeof filteredLocal) =>
      species.map((item) => ({ ...item, discoveryTags: speciesDiscoveryTags(item) }));

    if (hasFilters || local.length >= 5 || !this.apiKey) {
      return withTags(filteredLocal.slice(0, 30));
    }

    try {
      const { data } = await axios.get(`${this.baseUrl}/species-list`, {
        params: { key: this.apiKey, q: query },
        timeout: 8000,
      });
      const results = [];
      for (const item of data.data?.slice(0, 5) || []) {
        const species = await this.upsertFromApi(item);
        results.push(species);
      }
      const merged = [...local];
      for (const r of results) {
        if (!merged.find((m) => m.id === r.id)) merged.push(r);
      }
      return withTags(merged.slice(0, 30));
    } catch (err) {
      this.logger.warn(`Perenual search failed: ${err}`);
      return withTags(local);
    }
  }

  async getOrFetchById(speciesId: string) {
    const existing = await this.prisma.plantSpecies.findUnique({ where: { id: speciesId } });
    if (existing) return existing;
    throw new Error('Species not found');
  }

  private async upsertFromApi(item: {
    id: number;
    common_name?: string;
    scientific_name?: string[];
    watering?: string;
    sunlight?: string[];
    poisonous_to_pets?: number;
    default_image?: { regular_url?: string };
  }) {
    const wateringMap: Record<string, number> = {
      frequent: 4,
      average: 7,
      minimum: 14,
      none: 21,
    };
    const wateringFreqDays = wateringMap[item.watering || 'average'] || 7;
    const toxicity =
      item.poisonous_to_pets === 1 ? 'Toxic to pets' : 'Generally safe for pets';

    return this.prisma.plantSpecies.upsert({
      where: { perenualId: item.id },
      create: {
        perenualId: item.id,
        commonName: item.common_name || 'Unknown',
        scientificName: item.scientific_name?.[0],
        sunlight: item.sunlight?.join(', '),
        wateringFreqDays,
        toxicity,
        defaultImageUrl: item.default_image?.regular_url,
      },
      update: {
        commonName: item.common_name || 'Unknown',
        scientificName: item.scientific_name?.[0],
        sunlight: item.sunlight?.join(', '),
        wateringFreqDays,
        toxicity,
        defaultImageUrl: item.default_image?.regular_url,
      },
    });
  }
}
