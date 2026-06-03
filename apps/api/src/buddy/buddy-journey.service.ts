import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { biomeById, defaultBiomeForBuddy, isBiomeUnlocked } from './constants/biomes';
import { DISCOVERIES, pickDiscovery } from './constants/discoveries';
import { StartJourneyDto } from './dto/start-journey.dto';
import { BuddyService } from './buddy.service';
import { appendPersonalityChoice, formatBuddy, parseStringArray } from './buddy.utils';
import { discoveryReaction } from './constants/buddy-dialogue';
import { JourneyCompletedEvent } from './events/journey-completed.event';

@Injectable()
export class BuddyJourneyService {
  constructor(
    private prisma: PrismaService,
    private buddyService: BuddyService,
    private config: ConfigService,
    private events: EventEmitter2,
  ) {}

  private journeyDurationMs(growthStage: string, biomeHours: number): number {
    const demoMinutes = this.config.get<string>('BUDDY_JOURNEY_MINUTES');
    if (demoMinutes) {
      return Math.max(1, parseInt(demoMinutes, 10)) * 60 * 1000;
    }
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      return 2 * 60 * 1000;
    }
    return biomeHours * 60 * 60 * 1000;
  }

  async getActiveJourney(userId: string) {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId },
      include: {
        journeys: {
          where: { completed: false },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    let journey = buddy.journeys[0] ?? null;
    if (journey && journey.endsAt <= new Date()) {
      return this.completeJourney(userId, journey.id);
    }

    if (!journey) {
      return { journey: null, buddy: formatBuddy(buddy) };
    }

    return {
      journey: this.formatJourney(journey, buddy.name),
      buddy: formatBuddy(buddy),
    };
  }

  async startJourney(userId: string, dto: StartJourneyDto) {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId },
      include: { journeys: { where: { completed: false }, take: 1 } },
    });
    if (!buddy) throw new NotFoundException('Plant buddy not found');
    if (buddy.journeys.length > 0) {
      throw new BadRequestException('Your buddy is already on a journey');
    }
    if (buddy.sunlightToday < 100) {
      throw new BadRequestException('Fill your sunlight bar to 100 before sending your buddy on a journey');
    }

    const unlocked = parseStringArray(buddy.unlockedBiomes);
    const biomeId =
      dto.biomeId ?? defaultBiomeForBuddy(unlocked, buddy.growthStage);
    const biome = biomeById(biomeId);
    if (!biome || !unlocked.includes(biomeId) || !isBiomeUnlocked(biome, buddy.growthStage)) {
      throw new BadRequestException('That biome is not unlocked yet');
    }

    const endsAt = new Date(Date.now() + this.journeyDurationMs(buddy.growthStage, biome.durationHours));

    const journey = await this.prisma.$transaction(async (tx) => {
      const created = await tx.buddyJourney.create({
        data: {
          buddyId: buddy.id,
          biomeId,
          endsAt,
        },
      });
      await tx.buddy.update({
        where: { id: buddy.id },
        data: { sunlightToday: 0, currentBiome: biomeId },
      });
      return created;
    });

    this.events.emit(
      'journey.started',
      new JourneyCompletedEvent(userId, journey.id),
    );

    return {
      journey: this.formatJourney(journey, buddy.name),
      estimatedMinutes: Math.round((endsAt.getTime() - Date.now()) / 60000),
    };
  }

  async recordDiscoveryChoice(userId: string, journeyId: string, choice: number) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    const journey = await this.prisma.buddyJourney.findFirst({
      where: { id: journeyId, buddyId: buddy.id, completed: true },
    });
    if (!journey) throw new NotFoundException('Completed journey not found');
    if (journey.choiceMade !== null) {
      throw new BadRequestException('Discovery choice already recorded');
    }

    const personalityChoices = appendPersonalityChoice(buddy.personalityChoices, {
      journeyId,
      choice,
      recordedAt: new Date().toISOString(),
    });

    await this.prisma.$transaction([
      this.prisma.buddyJourney.update({
        where: { id: journeyId },
        data: { choiceMade: choice },
      }),
      this.prisma.buddy.update({
        where: { id: buddy.id },
        data: { personalityChoices },
      }),
    ]);

    const discovery = DISCOVERIES.find((row) => row.id === journey.discoveryId);
    const outcome =
      choice === 0
        ? discovery?.outcomeA.replace(/\{name\}/g, buddy.name)
        : discovery?.outcomeB.replace(/\{name\}/g, buddy.name);

    return {
      saved: true,
      reaction: discoveryReaction(buddy.trait, choice),
      outcome,
      encounterName: discovery?.encounterName,
      encounterRole: discovery?.encounterRole,
      rewardFocus: discovery?.rewardFocus,
    };
  }

  async completeJourney(userId: string, journeyId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    const journey = await this.prisma.buddyJourney.findFirst({
      where: { id: journeyId, buddyId: buddy.id, completed: false },
    });
    if (!journey) throw new NotFoundException('Active journey not found');

    const biome = biomeById(journey.biomeId);
    const dewdropsEarned =
      biome
        ? biome.dewdropMin +
          Math.floor(Math.random() * (biome.dewdropMax - biome.dewdropMin + 1))
        : 30;

    const discovery = pickDiscovery(journey.biomeId, buddy.name);

    await this.prisma.buddyJourney.update({
      where: { id: journey.id },
      data: {
        completed: true,
        completedAt: new Date(),
        discoveryId: discovery.id,
        dewdropsEarned,
      },
    });

    const stageResult = await this.buddyService.applyJourneyCompletion(buddy.id, dewdropsEarned);

    this.events.emit(
      'journey.completed',
      new JourneyCompletedEvent(userId, journey.id),
    );

    const freshBuddy = await this.prisma.buddy.findUnique({
      where: { userId },
      include: { journeys: { where: { completed: false }, take: 1 } },
    });

    return {
      journey: {
        ...this.formatJourney(
          {
            ...journey,
            completed: true,
            completedAt: new Date(),
            discoveryId: discovery.id,
            dewdropsEarned,
          },
          buddy.name,
        ),
        discovery,
        needsChoice: true,
      },
      dewdropsEarned,
      stageAdvanced: stageResult.stageAdvanced,
      newGrowthStage: stageResult.newStage,
      buddy: freshBuddy ? formatBuddy(freshBuddy) : null,
    };
  }

  private formatJourney(
    journey: {
      id: string;
      biomeId: string;
      startedAt: Date;
      endsAt: Date;
      completed: boolean;
      completedAt: Date | null;
      discoveryId: string | null;
      dewdropsEarned: number;
      choiceMade: number | null;
      tasksCompletedDuring?: number;
      minutesSaved?: number;
    },
    buddyName: string,
  ) {
    const biome = biomeById(journey.biomeId);
    const now = Date.now();
    const remainingMs = Math.max(0, journey.endsAt.getTime() - now);
    return {
      id: journey.id,
      biomeId: journey.biomeId,
      biomeName: biome?.name ?? journey.biomeId,
      biomeEmoji: biome?.emoji ?? '🌿',
      startedAt: journey.startedAt,
      endsAt: journey.endsAt,
      completed: journey.completed,
      completedAt: journey.completedAt,
      remainingSeconds: journey.completed ? 0 : Math.ceil(remainingMs / 1000),
      progressPercent: journey.completed
        ? 100
        : Math.min(
            100,
            Math.round(
              ((now - journey.startedAt.getTime()) /
                (journey.endsAt.getTime() - journey.startedAt.getTime())) *
                100,
            ),
          ),
      discoveryId: journey.discoveryId,
      dewdropsEarned: journey.dewdropsEarned,
      choiceMade: journey.choiceMade,
      tasksCompletedDuring: journey.tasksCompletedDuring ?? 0,
      minutesSaved: journey.minutesSaved ?? 0,
      buddyName,
    };
  }
}
