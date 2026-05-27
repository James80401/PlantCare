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

export type RecoverySuggestionView = RecoveryTaskSuggestion & {
  alreadyScheduled: boolean;
};

type DiagnosisSource = 'openai' | 'huggingface' | 'rules';

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
  ) {
    this.hfToken = this.config.get<string>('HF_API_TOKEN');
  }

  async diagnose(
    userId: string,
    plantId: string,
    file: Express.Multer.File | undefined,
    symptomsText?: string,
  ) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId },
      include: { species: true },
    });
    if (!plant) throw new NotFoundException('Plant not found');

    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.upload.saveFile(file);
    }

    const imageHint = file ? await this.classifyImage(file) : undefined;

    let source: DiagnosisSource = 'rules';
    let resultLabel = imageHint?.label ?? 'General plant health review';
    let confidence = imageHint?.confidence ?? 0.65;
    let adviceText: string;
    let detailJson: string | undefined;

    if (this.llm.isAvailable()) {
      try {
        const structured = await this.llm.diagnose({
          commonName: plant.species.commonName,
          scientificName: plant.species.scientificName,
          sunlight: plant.species.sunlight,
          wateringFreqDays: plant.species.wateringFreqDays,
          toxicity: plant.species.toxicity,
          careNotes: plant.species.careNotes,
          location: plant.location,
          symptomsText,
          imageHint: imageHint
            ? { label: formatLabel(imageHint.label), confidence: imageHint.confidence }
            : undefined,
          imageBase64: file?.buffer.toString('base64'),
          imageMimeType: file?.mimetype,
        });

        if (structured) {
          source = 'openai';
          resultLabel = structured.issueName;
          confidence = structured.confidence;
          adviceText = this.llm.formatAdviceText(structured);
          detailJson = JSON.stringify(structured);
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
    } else if (imageHint) {
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

    return this.prisma.task.create({
      data: {
        plantId,
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
}
