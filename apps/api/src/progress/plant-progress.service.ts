import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskStatus, TaskType } from '@prisma/client';
import axios from 'axios';
import { addDays, startOfDay } from 'date-fns';
import { AiUsageService } from '../ai-usage/ai-usage.service';
import { ImageModerationService } from '../common/image-moderation.service';
import { sharedPlantInclude, userCanJournalPlant, userCanViewPlantTasks } from '../gardens/task-access';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreatePlantProgressDto } from './dto/create-plant-progress.dto';

type ProgressAnalysis = {
  summary: string;
  adviceNeeded: boolean;
  advice: string;
  trend: 'improving' | 'stable' | 'watch' | 'declining';
  nextCheckInDays: number;
  flags: string[];
};

const PROGRESS_CHECK_INTERVAL_DAYS = 14;

const FIELD_LABELS: Record<string, string> = {
  THRIVING: 'Thriving',
  STABLE: 'Stable',
  CONCERNED: 'Some concerns',
  DECLINING: 'Declining',
  NEW_GROWTH: 'New growth',
  SAME: 'About the same',
  LEAF_LOSS: 'Leaf loss',
  STRETCHING: 'Stretching or legginess',
  FLOWERING: 'Flowering',
  NOT_SURE: 'Not sure',
  HEALTHY: 'Healthy leaves',
  YELLOWING: 'Yellowing',
  BROWN_TIPS: 'Brown tips',
  SPOTS: 'Spots',
  DROOPING: 'Drooping',
  WILTING: 'Wilting',
  PEST_DAMAGE: 'Pest damage',
  DRY: 'Dry',
  SLIGHTLY_DRY: 'Slightly dry',
  MOIST: 'Moist',
  WET: 'Wet',
  NOT_CHECKED: 'Not checked',
  NONE: 'No pest signs',
  POSSIBLE: 'Possible pest signs',
  VISIBLE_PESTS: 'Visible pests',
  WEBBING: 'Webbing',
  STICKY_RESIDUE: 'Sticky residue',
  WATERED: 'Watered',
  FERTILIZED: 'Fertilized',
  REPOTTED: 'Repotted',
  PRUNED: 'Pruned',
  MOVED_LIGHT: 'Moved to different light',
  PEST_TREATED: 'Pest treated',
  NO_CHANGE: 'No care changes',
  MULTIPLE: 'Multiple care changes',
};

@Injectable()
export class PlantProgressService {
  private readonly logger = new Logger(PlantProgressService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private imageModeration: ImageModerationService,
    private aiUsage: AiUsageService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
    this.baseUrl = (
      this.config.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1') ?? ''
    ).replace(/\/$/, '');
  }

  async findAll(userId: string, plantId: string) {
    await this.assertPlant(userId, plantId, { write: false });
    return this.prisma.plantProgressEntry.findMany({
      where: { plantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async create(
    userId: string,
    plantId: string,
    dto: CreatePlantProgressDto,
    file?: Express.Multer.File,
  ) {
    const plant = await this.assertPlant(userId, plantId, { write: true });

    if (file) {
      await this.imageModeration.assertImageAllowed(file, {
        feature: 'plant_progress_create',
        userId,
      });
    }

    const previousEntries = await this.prisma.plantProgressEntry.findMany({
      where: { plantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const imageBase64 = file?.buffer.toString('base64');
    const imageMimeType = file?.mimetype;
    const analysis = await this.analyzeProgress({
      userId,
      plantId,
      plant,
      dto,
      previousEntries,
      imageBase64,
      imageMimeType,
    });

    let photoUrl: string | undefined;
    if (file) {
      photoUrl = await this.upload.saveFile(file);
    }

    await this.completeSourceTaskIfValid(userId, plantId, dto.taskId);

    const entry = await this.prisma.plantProgressEntry.create({
      data: {
        plantId,
        userId,
        taskId: dto.taskId,
        photoUrl,
        overallHealth: dto.overallHealth,
        growthChange: dto.growthChange,
        leafCondition: dto.leafCondition,
        soilMoisture: dto.soilMoisture,
        pestSigns: dto.pestSigns,
        recentCare: dto.recentCare,
        notes: dto.notes?.trim() || undefined,
        analysisSummary: analysis.summary,
        adviceText: analysis.advice,
        storyJson: JSON.stringify(analysis),
      },
    });

    await this.scheduleNextRoutineCheck(plantId, plant.gardenId, analysis.nextCheckInDays);
    return entry;
  }

  private async assertPlant(userId: string, plantId: string, opts: { write: boolean }) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId },
      include: { species: true, ...sharedPlantInclude },
    });
    const allowed =
      plant && (opts.write ? userCanJournalPlant(userId, plant) : userCanViewPlantTasks(userId, plant));
    if (!allowed) throw new NotFoundException('Plant not found');
    return plant;
  }

  private async analyzeProgress(input: {
    userId: string;
    plantId: string;
    plant: Awaited<ReturnType<PlantProgressService['assertPlant']>>;
    dto: CreatePlantProgressDto;
    previousEntries: Array<{
      createdAt: Date;
      overallHealth: string;
      growthChange: string | null;
      leafCondition: string | null;
      soilMoisture: string | null;
      pestSigns: string | null;
      recentCare: string | null;
      notes: string | null;
      analysisSummary: string | null;
    }>;
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<ProgressAnalysis> {
    const fallback = this.fallbackAnalysis(input.dto, input.previousEntries);
    if (!this.apiKey) return fallback;

    const prompt = this.buildProgressPrompt(input.plant, input.dto, input.previousEntries, Boolean(input.imageBase64));
    try {
      await this.aiUsage.reserveCall({
        feature: 'progress_check',
        userId: input.userId,
        plantId: input.plantId,
        promptChars: prompt.length,
        imageCount: input.imageBase64 ? 1 : 0,
      });

      const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
      if (input.imageBase64 && input.imageMimeType) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${input.imageMimeType};base64,${input.imageBase64}` },
        });
      }

      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          temperature: 0.35,
          max_tokens: 800,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are Dr. Plant, an expert horticulturist. Analyze plant progress check-ins only. Be practical, cautious, and concise. Respond only with JSON.',
            },
            { role: 'user', content },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      return this.normalizeAnalysis(parsed, fallback);
    } catch (err) {
      this.logger.warn(`Progress analysis fallback used: ${err}`);
      return fallback;
    }
  }

  private buildProgressPrompt(
    plant: Awaited<ReturnType<PlantProgressService['assertPlant']>>,
    dto: CreatePlantProgressDto,
    previousEntries: Array<{
      createdAt: Date;
      overallHealth: string;
      growthChange: string | null;
      leafCondition: string | null;
      soilMoisture: string | null;
      pestSigns: string | null;
      recentCare: string | null;
      notes: string | null;
      analysisSummary: string | null;
    }>,
    hasImage: boolean,
  ) {
    const previous = previousEntries.length
      ? previousEntries
          .map((entry) =>
            [
              `- ${entry.createdAt.toISOString().slice(0, 10)}: health=${this.label(entry.overallHealth)}`,
              entry.growthChange ? `growth=${this.label(entry.growthChange)}` : null,
              entry.leafCondition ? `leaves=${this.label(entry.leafCondition)}` : null,
              entry.soilMoisture ? `soil=${this.label(entry.soilMoisture)}` : null,
              entry.pestSigns ? `pests=${this.label(entry.pestSigns)}` : null,
              entry.recentCare ? `care=${this.label(entry.recentCare)}` : null,
              entry.notes ? `notes=${entry.notes.slice(0, 260)}` : null,
              entry.analysisSummary ? `prior summary=${entry.analysisSummary.slice(0, 260)}` : null,
            ]
              .filter(Boolean)
              .join('; '),
          )
          .join('\n')
      : 'No previous progress check-ins yet.';

    return [
      'Analyze this plant progress check-in. Use the current entry and prior entries to summarize the plant life story so far.',
      'Return ONLY valid JSON with this schema:',
      '{"summary":"2-3 sentence progress story","adviceNeeded":true,"advice":"short advice only if useful","trend":"improving|stable|watch|declining","nextCheckInDays":14,"flags":["short flag"]}',
      '',
      `Plant: ${plant.nickname || plant.species.commonName}`,
      `Species: ${plant.species.commonName}${plant.species.scientificName ? ` (${plant.species.scientificName})` : ''}`,
      plant.location ? `Location: ${plant.location}` : null,
      plant.species.sunlight ? `Light needs: ${plant.species.sunlight}` : null,
      `Typical water interval: every ${plant.species.wateringFreqDays} days`,
      plant.species.careNotes ? `Care notes: ${plant.species.careNotes}` : null,
      '',
      'Current check-in:',
      `Overall health: ${this.label(dto.overallHealth)}`,
      dto.growthChange ? `Growth: ${this.label(dto.growthChange)}` : null,
      dto.leafCondition ? `Leaves: ${this.label(dto.leafCondition)}` : null,
      dto.soilMoisture ? `Soil: ${this.label(dto.soilMoisture)}` : null,
      dto.pestSigns ? `Pests: ${this.label(dto.pestSigns)}` : null,
      dto.recentCare ? `Recent care: ${this.label(dto.recentCare)}` : null,
      dto.notes ? `User notes: ${dto.notes}` : null,
      hasImage ? 'A current plant photo is attached. Mention visible concerns only if clear.' : 'No photo attached.',
      '',
      'Previous progress check-ins:',
      previous,
      '',
      'Safety: do not diagnose with certainty from limited evidence. If urgent decline, recommend using Dr. Plant diagnosis chat.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private normalizeAnalysis(raw: Record<string, unknown>, fallback: ProgressAnalysis): ProgressAnalysis {
    const trend = ['improving', 'stable', 'watch', 'declining'].includes(String(raw.trend))
      ? (String(raw.trend) as ProgressAnalysis['trend'])
      : fallback.trend;
    const nextCheckInDays = Math.min(
      45,
      Math.max(3, Number(raw.nextCheckInDays) || fallback.nextCheckInDays),
    );
    return {
      summary:
        typeof raw.summary === 'string' && raw.summary.trim()
          ? raw.summary.trim().slice(0, 900)
          : fallback.summary,
      adviceNeeded:
        typeof raw.adviceNeeded === 'boolean' ? raw.adviceNeeded : fallback.adviceNeeded,
      advice:
        typeof raw.advice === 'string' && raw.advice.trim()
          ? raw.advice.trim().slice(0, 900)
          : fallback.advice,
      trend,
      nextCheckInDays,
      flags: Array.isArray(raw.flags)
        ? raw.flags.filter((flag) => typeof flag === 'string').slice(0, 5)
        : fallback.flags,
    };
  }

  private fallbackAnalysis(
    dto: CreatePlantProgressDto,
    previousEntries: Array<{ overallHealth: string; createdAt: Date }>,
  ): ProgressAnalysis {
    const latest = this.label(dto.overallHealth).toLowerCase();
    const previous = previousEntries[0]?.overallHealth;
    const trend =
      dto.overallHealth === 'DECLINING'
        ? 'declining'
        : dto.overallHealth === 'CONCERNED'
          ? 'watch'
          : previous && previous !== dto.overallHealth
            ? 'improving'
            : 'stable';
    const needsAdvice = dto.overallHealth === 'CONCERNED' || dto.overallHealth === 'DECLINING';
    const flags = [
      dto.leafCondition && !['HEALTHY', 'NOT_SURE'].includes(dto.leafCondition)
        ? this.label(dto.leafCondition)
        : null,
      dto.pestSigns && !['NONE', 'NOT_CHECKED'].includes(dto.pestSigns) ? this.label(dto.pestSigns) : null,
      dto.soilMoisture === 'WET' ? 'Wet soil' : null,
    ].filter(Boolean) as string[];

    return {
      summary: previousEntries.length
        ? `This check-in has the plant looking ${latest}. Compared with the recent history, keep watching for repeated changes rather than reacting to one isolated snapshot.`
        : `First progress check-in saved. The plant is currently marked ${latest}, giving Dr. Plant a baseline for future health and growth trends.`,
      adviceNeeded: needsAdvice,
      advice: needsAdvice
        ? 'Keep care steady, check soil moisture before watering, and use Dr. Plant diagnosis if symptoms are spreading or the plant is declining quickly.'
        : 'No urgent action needed from this check-in. Keep logging photos or short notes so changes are easier to spot.',
      trend,
      nextCheckInDays: needsAdvice ? 7 : PROGRESS_CHECK_INTERVAL_DAYS,
      flags,
    };
  }

  private async completeSourceTaskIfValid(userId: string, plantId: string, taskId?: string) {
    if (!taskId) return;
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        plantId,
        taskType: TaskType.HEALTH_CHECK,
        status: TaskStatus.PENDING,
      },
      include: { plant: { include: sharedPlantInclude } },
    });
    if (!task || !userCanJournalPlant(userId, task.plant)) return;

    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.DONE, completedAt: new Date() },
      }),
      this.prisma.taskFeedback.create({
        data: {
          taskId: task.id,
          userId,
          action: 'COMPLETE',
          reason: 'PLANT_PROGRESS_CHECK_IN',
          note: 'Completed from plant progress check-in.',
        },
      }),
    ]);
  }

  private async scheduleNextRoutineCheck(plantId: string, gardenId: string | null, days: number) {
    const dueDate = startOfDay(addDays(new Date(), Math.min(45, Math.max(3, days))));
    const existing = await this.prisma.task.findFirst({
      where: {
        plantId,
        taskType: TaskType.HEALTH_CHECK,
        status: TaskStatus.PENDING,
        sourceDiagnosisId: null,
        dueDate: { gte: startOfDay(new Date()) },
      },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.task.create({
      data: {
        plantId,
        gardenId,
        taskType: TaskType.HEALTH_CHECK,
        dueDate,
        status: TaskStatus.PENDING,
      },
    });
  }

  private label(value?: string | null) {
    if (!value) return '';
    return FIELD_LABELS[value] ?? value.replace(/_/g, ' ').toLowerCase();
  }
}
