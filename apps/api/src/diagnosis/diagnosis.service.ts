import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Task } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { TaskType } from '@prisma/client';
import axios from 'axios';
import { addDays, startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { ImageModerationService } from '../common/image-moderation.service';
import { AiUsageService } from '../ai-usage/ai-usage.service';
import { formatLabel, getAdvice } from './diagnosis-advice';
import { ApplyRecoveryTasksDto } from './dto/apply-recovery-tasks.dto';
import { FollowUpTaskDto } from './dto/follow-up-task.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import {
  buildRecoverySuggestions,
  type RecoveryTaskSuggestion,
} from './diagnosis-recovery.mapper';
import { LlmDiagnosisService } from './llm-diagnosis.service';
import { OpenAiRequestError } from './openai-errors';
import { buildTreatmentPlan } from '../plant-intelligence/treatment-plan';

export type RecoverySuggestionView = RecoveryTaskSuggestion & {
  alreadyScheduled: boolean;
};

type DiagnosisSource = 'openai' | 'huggingface' | 'rules';
type SymptomDuration = 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
type RecentCareChange =
  | 'NONE'
  | 'WATERING'
  | 'LIGHT'
  | 'REPOT'
  | 'FERTILIZER'
  | 'TEMPERATURE'
  | 'PEST_TREATMENT';

export interface DiagnosisIntake {
  symptomDuration?: SymptomDuration;
  recentCareChange?: RecentCareChange;
  pestsVisible?: boolean;
}

@Injectable()
export class DiagnosisService {
  private readonly hfToken: string | undefined;
  private readonly hfModel =
    'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private config: ConfigService,
    private llm: LlmDiagnosisService,
    private imageModeration: ImageModerationService,
    private aiUsage: AiUsageService,
  ) {
    this.hfToken = this.config.get<string>('HF_API_TOKEN');
  }

  async diagnose(
    userId: string,
    plantId: string,
    file: Express.Multer.File | undefined,
    symptomsText?: string,
    intake?: DiagnosisIntake,
  ) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId },
      include: { species: true },
    });
    if (!plant) throw new NotFoundException('Plant not found');

    await this.aiUsage.assertPlantIntentOrThrow({
      feature: 'diagnosis',
      userId,
      plantId,
      text: symptomsText,
      hasImage: Boolean(file),
      promptChars: symptomsText?.length ?? 0,
      imageCount: file ? 1 : 0,
    });

    // Kick off image moderation in parallel with the slow upstream calls below
    // (HuggingFace classify + OpenAI diagnose). On accept this saves the moderation
    // round-trip from the user's wait time; on reject we throw before persisting.
    // The HF + OpenAI calls may still complete after a moderation reject, paying for
    // those tokens — acceptable since rejections are rare relative to total volume.
    const moderationPromise: Promise<unknown> | undefined = file
      ? this.imageModeration
          .assertImageAllowed(file, { feature: 'diagnose', userId })
          .catch((err) => {
            // Wrap rejections so we can distinguish moderation errors from upstream model errors.
            throw err;
          })
      : undefined;

    const imageHintPromise: Promise<{ label: string; confidence: number } | undefined> = file
      ? this.classifyImage(file)
      : Promise.resolve(undefined);

    let source: DiagnosisSource = 'rules';
    let resultLabel: string;
    let confidence: number;
    let adviceText: string;
    let detailJson: string | undefined;

    const intakeSummary = this.formatIntakeSummary(intake);

    const imageHint = await imageHintPromise;
    resultLabel = imageHint?.label ?? 'General plant health review';
    confidence = imageHint?.confidence ?? 0.65;

    if (this.llm.isAvailable()) {
      try {
        await this.aiUsage.reserveCall({
          feature: 'diagnosis',
          userId,
          plantId,
          promptChars: symptomsText?.length ?? 0,
          imageCount: file ? 1 : 0,
        });
        const structuredPromise = this.llm.diagnose({
          commonName: plant.species.commonName,
          scientificName: plant.species.scientificName,
          sunlight: plant.species.sunlight,
          wateringFreqDays: plant.species.wateringFreqDays,
          toxicity: plant.species.toxicity,
          careNotes: plant.species.careNotes,
          location: plant.location,
          symptomsText,
          caregiverContext: intakeSummary,
          imageHint: imageHint
            ? { label: formatLabel(imageHint.label), confidence: imageHint.confidence }
            : undefined,
          imageBase64: file?.buffer.toString('base64'),
          imageMimeType: file?.mimetype,
        });

        // Await diagnosis and moderation together so total latency = max() not sum().
        // If moderation rejects, its rejection propagates here.
        const [structured] = await Promise.all([
          structuredPromise,
          moderationPromise ?? Promise.resolve(),
        ]);

        if (structured) {
          source = 'openai';
          resultLabel = structured.issueName;
          confidence = structured.confidence;
          adviceText = this.llm.formatAdviceText(structured);
          detailJson = JSON.stringify({ ...structured, intake });
        } else {
          ({ resultLabel, confidence, adviceText, source } = this.rulesFallback(
            imageHint,
            symptomsText,
          ));
        }
      } catch (err) {
        if (err instanceof OpenAiRequestError) {
          throw new ServiceUnavailableException(err.message);
        }
        throw err;
      }
    } else {
      // No LLM available — still respect moderation if we have a file.
      if (moderationPromise) await moderationPromise;
      if (imageHint) {
        source = 'huggingface';
        resultLabel = formatLabel(imageHint.label);
        confidence = imageHint.confidence;
        adviceText = getAdvice(imageHint.label);
      } else {
        ({ resultLabel, confidence, adviceText, source } = this.rulesFallback(
          imageHint,
          symptomsText,
        ));
      }
    }

    // Only save the image after we've cleared moderation, to avoid orphaned uploads
    // when moderation rejects.
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.upload.saveFile(file);
    }

    if (!detailJson && intake) {
      detailJson = JSON.stringify({ intake });
    }

    const detail = this.parseDetailJson(detailJson);
    const treatmentPlan = buildTreatmentPlan({
      issueName: resultLabel,
      symptomsText,
      adviceText,
      imageLabel: imageHint?.label ? formatLabel(imageHint.label) : undefined,
      confidence,
      immediateActions: Array.isArray(detail?.immediateActions)
        ? detail.immediateActions
        : undefined,
      longTermCare: Array.isArray(detail?.longTermCare) ? detail.longTermCare : undefined,
      whenToSeekHelp: typeof detail?.whenToSeekHelp === 'string' ? detail.whenToSeekHelp : undefined,
      species: {
        commonName: plant.species.commonName,
        scientificName: plant.species.scientificName,
        sunlight: plant.species.sunlight,
        wateringFreqDays: plant.species.wateringFreqDays,
        toxicity: plant.species.toxicity,
        careNotes: plant.species.careNotes,
      },
    });
    detailJson = JSON.stringify({ ...(detail ?? {}), intake, treatmentPlan });

    return this.prisma.diagnosis.create({
      data: {
        plantId,
        imageUrl,
        symptomsText,
        resultLabel,
        confidence,
        adviceText,
        source,
        detailJson,
      },
    });
  }

  async getRecoverySuggestions(
    userId: string,
    plantId: string,
    diagnosisId: string,
  ): Promise<RecoverySuggestionView[]> {
    const diagnosis = await this.assertDiagnosis(userId, plantId, diagnosisId);
    const suggestions = buildRecoverySuggestions(
      diagnosisId,
      diagnosis.detailJson,
      diagnosis.adviceText,
    );
    const pending = await this.prisma.task.findMany({
      where: {
        plantId,
        sourceDiagnosisId: diagnosisId,
        status: 'PENDING',
      },
      select: { taskType: true },
    });
    const scheduledTypes = new Set(pending.map((t) => t.taskType));
    return suggestions.map((s) => ({
      ...s,
      alreadyScheduled: scheduledTypes.has(s.taskType),
    }));
  }

  async applyRecoveryTasks(
    userId: string,
    plantId: string,
    diagnosisId: string,
    dto: ApplyRecoveryTasksDto,
  ): Promise<Task[]> {
    const diagnosis = await this.assertDiagnosis(userId, plantId, diagnosisId);
    const suggestions = buildRecoverySuggestions(
      diagnosisId,
      diagnosis.detailJson,
      diagnosis.adviceText,
    );
    const selected = suggestions.filter((s) => dto.keys.includes(s.key));
    if (selected.length === 0) {
      throw new BadRequestException('No valid recovery tasks selected.');
    }

    const gardenId = await this.plantGardenId(plantId);
    const created: Task[] = [];
    for (const suggestion of selected) {
      const existing = await this.prisma.task.findFirst({
        where: {
          plantId,
          sourceDiagnosisId: diagnosisId,
          taskType: suggestion.taskType,
          status: 'PENDING',
        },
      });
      if (existing) continue;

      const dueDate = startOfDay(addDays(new Date(), suggestion.dueInDays));
      const task = await this.prisma.task.create({
        data: {
          plantId,
          gardenId,
          taskType: suggestion.taskType,
          dueDate,
          sourceDiagnosisId: diagnosisId,
        },
        include: {
          plant: { include: { species: true } },
          sourceDiagnosis: {
            select: { id: true, resultLabel: true, resolved: true },
          },
        },
      });
      created.push(task);
    }

    if (created.length === 0) {
      throw new BadRequestException(
        'Selected recovery tasks are already on your schedule.',
      );
    }

    return created;
  }

  async createFollowUpTask(
    userId: string,
    plantId: string,
    diagnosisId: string,
    dto: FollowUpTaskDto,
  ) {
    await this.assertDiagnosis(userId, plantId, diagnosisId);

    const dueInDays = dto.dueInDays ?? 3;
    const dueDate = startOfDay(addDays(new Date(), dueInDays));

    const existing = await this.prisma.task.findFirst({
      where: {
        plantId,
        sourceDiagnosisId: diagnosisId,
        taskType: TaskType.HEALTH_CHECK,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A health check follow-up is already scheduled for this diagnosis.',
      );
    }

    const task = await this.prisma.task.create({
      data: {
        plantId,
        gardenId: await this.plantGardenId(plantId),
        taskType: TaskType.HEALTH_CHECK,
        dueDate,
        sourceDiagnosisId: diagnosisId,
      },
      include: {
        plant: { include: { species: true } },
        sourceDiagnosis: {
          select: { id: true, resultLabel: true, resolved: true },
        },
      },
    });

    const note = dto.note?.trim();
    if (note) {
      await this.prisma.journalEntry.create({
        data: {
          plantId,
          notes: `Health check follow-up in ${dueInDays} day${dueInDays === 1 ? '' : 's'}: ${note}`,
        },
      });
    }

    return task;
  }

  async updateStatus(
    userId: string,
    plantId: string,
    diagnosisId: string,
    dto: UpdateDiagnosisDto,
  ) {
    await this.assertDiagnosis(userId, plantId, diagnosisId);

    return this.prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: { resolved: dto.resolved },
    });
  }

  private async assertDiagnosis(userId: string, plantId: string, diagnosisId: string) {
    const diagnosis = await this.prisma.diagnosis.findFirst({
      where: { id: diagnosisId, plantId, plant: { userId } },
    });
    if (!diagnosis) throw new NotFoundException('Diagnosis not found');
    return diagnosis;
  }

  /** Home garden of a plant, denormalized onto tasks created for it. */
  private async plantGardenId(plantId: string): Promise<string | undefined> {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: { gardenId: true },
    });
    return plant?.gardenId;
  }

  private async classifyImage(
    file: Express.Multer.File,
  ): Promise<{ label: string; confidence: number } | undefined> {
    if (!this.hfToken) return undefined;

    try {
      const { data } = await axios.post(
        `https://api-inference.huggingface.co/models/${this.hfModel}`,
        file.buffer,
        {
          headers: {
            Authorization: `Bearer ${this.hfToken}`,
            'Content-Type': file.mimetype,
          },
          timeout: 30000,
        },
      );
      const top = Array.isArray(data) ? data[0] : data;
      if (top?.label) {
        return { label: top.label, confidence: top.score ?? 0.8 };
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private rulesFallback(
    imageHint: { label: string; confidence: number } | undefined,
    symptomsText?: string,
  ): {
    resultLabel: string;
    confidence: number;
    adviceText: string;
    source: DiagnosisSource;
  } {
    const label = imageHint?.label ?? this.inferFromSymptoms(symptomsText);
    return {
      resultLabel: formatLabel(label),
      confidence: imageHint?.confidence ?? 0.65,
      adviceText: getAdvice(label),
      source: imageHint ? 'huggingface' : 'rules',
    };
  }

  private inferFromSymptoms(text?: string): string {
    if (!text) return 'healthy';
    const lower = text.toLowerCase();
    if (lower.includes('yellow')) return 'nutrient_deficiency';
    if (lower.includes('spot') || lower.includes('blight')) return 'Tomato___Early_blight';
    if (lower.includes('mildew') || lower.includes('powder')) return 'Cherry___Powdery_mildew';
    if (lower.includes('mite') || lower.includes('insect')) return 'Tomato___Spider_mites';
    if (lower.includes('wilt') || lower.includes('overwater')) return 'overwatering';
    if (lower.includes('root rot') || lower.includes('mushy')) return 'overwatering';
    if (lower.includes('brown tip') || lower.includes('crispy')) return 'underwatering';
    return 'healthy';
  }

  private formatIntakeSummary(intake?: DiagnosisIntake): string | undefined {
    if (!intake) return undefined;
    const lines: string[] = [];
    if (intake.symptomDuration) {
      const duration = {
        TODAY: 'today',
        DAYS_2_3: '2-3 days',
        DAYS_4_7: '4-7 days',
        WEEKS_2_PLUS: '2+ weeks',
      }[intake.symptomDuration];
      lines.push(`Symptom duration: ${duration}`);
    }
    if (intake.recentCareChange && intake.recentCareChange !== 'NONE') {
      const change = {
        WATERING: 'watering routine changed',
        LIGHT: 'light exposure changed',
        REPOT: 'recently repotted',
        FERTILIZER: 'fertilizer routine changed',
        TEMPERATURE: 'temperature/humidity shifted',
        PEST_TREATMENT: 'recent pest treatment',
        NONE: 'no recent care changes',
      }[intake.recentCareChange];
      lines.push(`Recent care change: ${change}`);
    }
    if (intake.pestsVisible != null) {
      lines.push(`Visible pests/webbing: ${intake.pestsVisible ? 'yes' : 'no'}`);
    }
    return lines.length ? lines.join('\n') : undefined;
  }

  private parseDetailJson(detailJson?: string | null): Record<string, unknown> | null {
    if (!detailJson) return null;
    try {
      const parsed = JSON.parse(detailJson);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
}
