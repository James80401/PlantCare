import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { inferDifficulty, isSucculentSpecies, speciesDiscoveryTags } from './species-catalog-meta';
import { enrichSpeciesRecord } from './species-enrich';

@Injectable()
export class SpeciesRecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendedForUser(userId: string, limit = 12) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { experienceLevel: true, defaultLightLevel: true },
    });

    const experience = user?.experienceLevel ?? 'beginner';
    const lightLevel = user?.defaultLightLevel ?? 'medium';

    const species = await this.prisma.plantSpecies.findMany();
    const scored = species
      .map((item) => ({
        item,
        score: this.scoreSpecies(item, experience, lightLevel),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.item.commonName.localeCompare(b.item.commonName));

    const slice = scored.slice(0, Math.min(24, Math.max(1, limit)));
    return {
      items: slice.map((row) => enrichSpeciesRecord(row.item)),
      reason: this.buildReasonLabel(experience, lightLevel),
    };
  }

  private scoreSpecies(
    species: Parameters<typeof enrichSpeciesRecord>[0],
    experience: string,
    lightLevel: string,
  ) {
    let score = 1;
    const difficulty = inferDifficulty(species);
    const tags = speciesDiscoveryTags(species);
    const sunlight = species.sunlight?.toLowerCase() ?? '';

    if (experience === 'beginner') {
      if (difficulty === 'Beginner') score += 4;
      else if (difficulty === 'Moderate') score += 1;
      else score -= 2;
    } else if (experience === 'intermediate') {
      if (difficulty === 'Moderate') score += 3;
      if (difficulty === 'Beginner') score += 2;
    } else if (experience === 'advanced') {
      if (difficulty === 'Advanced') score += 3;
      if (difficulty === 'Moderate') score += 2;
    }

    if (lightLevel === 'low') {
      if (tags.includes('Low light') || sunlight.includes('low')) score += 3;
      if (isSucculentSpecies(species) && !sunlight.includes('low')) score -= 1;
    } else if (lightLevel === 'high' || lightLevel === 'bright') {
      if (sunlight.includes('bright') || sunlight.includes('full sun')) score += 3;
    } else {
      if (tags.includes('Indoor-friendly') || sunlight.includes('indirect')) score += 2;
    }

    if (tags.includes('Pet-safe') && experience === 'beginner') score += 1;

    return score;
  }

  private buildReasonLabel(experience: string, lightLevel: string) {
    const exp =
      experience === 'beginner'
        ? 'beginner-friendly picks'
        : experience === 'advanced'
          ? 'challenging favorites'
          : 'balanced choices';
    const light =
      lightLevel === 'low'
        ? ' suited to lower light'
        : lightLevel === 'high' || lightLevel === 'bright'
          ? ' for brighter spots'
          : ' for typical indoor light';
    return `Recommended ${exp}${light}.`;
  }
}
