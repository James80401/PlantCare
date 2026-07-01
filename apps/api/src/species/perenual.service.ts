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
import { speciesNameContains, speciesSearchTerms } from './species-name-filter';
import { TtlCache } from '../common/ttl-cache';

type SpeciesRow = Awaited<ReturnType<PrismaService['plantSpecies']['findMany']>>[number];

const SPECIES_CACHE_TTL_MS = 5 * 60 * 1000;
const ALL_SPECIES_KEY = '__all__';

@Injectable()
export class PerenualService {
  private readonly logger = new Logger(PerenualService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://perenual.com/api/v2';

  // The species catalog is effectively static (changes only via upsertFromApi),
  // so caching the full table + per-id lookups removes repeated reads on the
  // browse/filter/detail hot paths. Invalidated on any upsert.
  private readonly allSpeciesCache = new TtlCache<SpeciesRow[]>(SPECIES_CACHE_TTL_MS);
  private readonly speciesByIdCache = new TtlCache<SpeciesRow>(SPECIES_CACHE_TTL_MS);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.config.get<string>('PERENUAL_API_KEY');
  }

  private async getAllSpeciesCached(): Promise<SpeciesRow[]> {
    return this.allSpeciesCache.getOrSet(ALL_SPECIES_KEY, () =>
      this.prisma.plantSpecies.findMany(),
    );
  }

  private invalidateSpeciesCache(): void {
    this.allSpeciesCache.clear();
    this.speciesByIdCache.clear();
  }

  invalidateCacheForMutation(): void {
    this.invalidateSpeciesCache();
  }

  private nameContains(text: string) {
    return speciesNameContains(this.config.get<string>('DATABASE_URL') ?? '', text);
  }

  private nameSearch(query: string) {
    const terms = speciesSearchTerms(query);
    if (!terms.length) return {};

    return {
      OR: terms.flatMap((term) => [
        { commonName: this.nameContains(term) },
        { scientificName: this.nameContains(term) },
      ]),
    };
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

    const where = q ? this.nameSearch(q) : {};

    const enrich = (species: Awaited<ReturnType<typeof this.prisma.plantSpecies.findMany>>) =>
      species.map((item) => enrichSpeciesRecord(item));

    if (hasFilters) {
      // No text query → the where clause is empty, so we can serve from the cached
      // full catalog instead of re-reading every row on each filter toggle.
      // With a query, keep the DB name-search path (returns a smaller subset).
      const all = q
        ? await this.prisma.plantSpecies.findMany({ where })
        : await this.getAllSpeciesCached();
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
      where: this.nameSearch(query),
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
    const existing = await this.speciesByIdCache.getOrSet(speciesId, async () => {
      const row = await this.prisma.plantSpecies.findUnique({ where: { id: speciesId } });
      if (!row) throw new Error('Species not found');
      return row;
    });
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

    const result = await this.prisma.plantSpecies.upsert({
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

    // Catalog mutated — drop caches so stale rows aren't served.
    this.invalidateSpeciesCache();
    return result;
  }
}
