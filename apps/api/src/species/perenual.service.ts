import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  compareSpeciesForSort,
  speciesMatchesFilters,
  type SpeciesBrowseSort,
  type SpeciesSearchFilters,
} from './species-filters';
import { enrichSpeciesRecord } from './species-enrich';

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

  async browse(
    query: string,
    filters: SpeciesSearchFilters = {},
    page = 1,
    pageSize = 24,
    sort: SpeciesBrowseSort = 'name',
  ) {
    const pageNum = Math.max(1, Math.floor(page) || 1);
    const limit = Math.min(50, Math.max(1, Math.floor(pageSize) || 24));
    const hasFilters = Object.values(filters).some(Boolean);
    const q = query.trim();

    const where = q
      ? {
          OR: [
            { commonName: { contains: q } },
            { scientificName: { contains: q } },
          ],
        }
      : {};

    const enrich = (species: Awaited<ReturnType<typeof this.prisma.plantSpecies.findMany>>) =>
      species.map((item) => enrichSpeciesRecord(item));

    if (hasFilters) {
      const all = await this.prisma.plantSpecies.findMany({ where });
      const filtered = all
        .filter((species) => speciesMatchesFilters(species, filters))
        .sort((a, b) => compareSpeciesForSort(a, b, sort));
      const total = filtered.length;
      const skip = (pageNum - 1) * limit;
      const slice = filtered.slice(skip, skip + limit);
      return {
        items: enrich(slice),
        page: pageNum,
        pageSize: limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    const orderBy =
      sort === 'waterAsc'
        ? { wateringFreqDays: 'desc' as const }
        : sort === 'waterDesc'
          ? { wateringFreqDays: 'asc' as const }
          : { commonName: 'asc' as const };

    const [total, rows] = await Promise.all([
      this.prisma.plantSpecies.count({ where }),
      this.prisma.plantSpecies.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: enrich(rows),
      page: pageNum,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
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
    const enrichSearch = (species: typeof filteredLocal) =>
      species.map((item) => enrichSpeciesRecord(item));

    if (hasFilters || local.length >= 5 || !this.apiKey) {
      return enrichSearch(filteredLocal.slice(0, 30));
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
      return enrichSearch(merged.slice(0, 30));
    } catch (err) {
      this.logger.warn(`Perenual search failed: ${err}`);
      return enrichSearch(local);
    }
  }

  async getOrFetchById(speciesId: string) {
    const existing = await this.prisma.plantSpecies.findUnique({ where: { id: speciesId } });
    if (!existing) throw new Error('Species not found');
    return enrichSpeciesRecord(existing);
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
