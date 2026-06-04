import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { enrichSpeciesRecord } from './species-enrich';
import { scoreSpeciesFit } from './species-recommendation-scoring';

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
      .map((item) => {
        const fit = scoreSpeciesFit(item, experience, lightLevel);
        return { item, score: fit.score, reasons: fit.reasons };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.item.commonName.localeCompare(b.item.commonName));

    const slice = scored.slice(0, Math.min(24, Math.max(1, limit)));
    return {
      items: slice.map((row) => ({
        ...enrichSpeciesRecord(row.item),
        // Top few "why recommended" chips for this specific plant.
        matchReasons: row.reasons.slice(0, 3),
      })),
      reason: this.buildReasonLabel(experience, lightLevel),
    };
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
