import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import { TaskType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { WeatherService } from '../weather/weather.service';
import { ImageModerationService } from '../common/image-moderation.service';
import { AiUsageService } from '../ai-usage/ai-usage.service';
import { LlmDiagnosisService, type ChatTurn, type PlantContext } from './llm-diagnosis.service';
import { OpenAiRequestError } from './openai-errors';
import {
  buildDrPlantContextSummary,
  type DrPlantContextSummary,
} from './dr-plant-context';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ChatHealthCheckActionDto,
  ChatJournalActionDto,
  ChatRecoveryTasksDto,
} from './dto/chat-action.dto';
import {
  buildRecoverySuggestions,
  type RecoveryTaskSuggestion,
} from './diagnosis-recovery.mapper';

type ChatRecoverySuggestionView = RecoveryTaskSuggestion & {
  alreadyScheduled: boolean;
};

const CHAT_HISTORY_TURN_LIMIT = 20;

type GuidedFollowUpQuestion = {
  id: string;
  label: string;
  prompt: string;
  type: 'single' | 'text';
  options?: string[];
};

@Injectable()
export class DiagnosisChatService {
  constructor(
    private prisma: PrismaService,
    private llm: LlmDiagnosisService,
    private upload: UploadService,
    private weather: WeatherService,
    private imageModeration: ImageModerationService,
    private aiUsage: AiUsageService,
  ) {}

  private async getPlantForUser(userId: string, plantId: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId },
      include: { species: true },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return plant;
  }

  private async gatherContextSignals(
    plant: Awaited<ReturnType<typeof this.getPlantForUser>>,
    userId: string,
  ) {
    const since = subDays(new Date(), 45);

    const [journalEntries, pendingTasks, recentFeedback, lastDiagnosis, weatherStatus] =
      await Promise.all([
        this.prisma.journalEntry.findMany({
          where: { plantId: plant.id },
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: { notes: true, createdAt: true },
        }),
        this.prisma.task.findMany({
          where: {
            plantId: plant.id,
            status: 'PENDING',
            dueDate: { lte: addDays(new Date(), 30) },
          },
          orderBy: { dueDate: 'asc' },
          take: 6,
          select: { taskType: true, dueDate: true },
        }),
        this.prisma.taskFeedback.findMany({
          where: { userId, task: { plantId: plant.id }, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: { action: true, reason: true, note: true },
        }),
        this.prisma.diagnosis.findFirst({
          where: { plantId: plant.id },
          orderBy: { createdAt: 'desc' },
          select: {
            resultLabel: true,
            resolved: true,
            symptomsText: true,
            createdAt: true,
          },
        }),
        this.weather.getAdviceStatus(userId),
      ]);

    return { journalEntries, pendingTasks, recentFeedback, lastDiagnosis, weatherStatus };
  }

  /**
   * User-facing version of the Dr. Plant context: the same signals fed to the
   * model, returned as readable chips for a "What Dr. Plant sees" panel.
   */
  async getContextSummary(userId: string, plantId: string): Promise<DrPlantContextSummary> {
    const plant = await this.getPlantForUser(userId, plantId);
    const { journalEntries, pendingTasks, recentFeedback, lastDiagnosis, weatherStatus } =
      await this.gatherContextSignals(plant, userId);

    const weatherAlert = weatherStatus.cachedAdvice?.overviewAlerts?.[0]?.title;

    return buildDrPlantContextSummary({
      location: plant.location,
      potSize: plant.potSize,
      wateringFreqDays: plant.species.wateringFreqDays,
      sunlight: plant.species.sunlight,
      journal: journalEntries.map((entry) => ({
        notes: entry.notes,
        createdAt: entry.createdAt,
      })),
      pendingTasks: pendingTasks.map((task) => ({
        taskType: task.taskType,
        dueDate: task.dueDate,
      })),
      feedback: recentFeedback.map((f) => ({
        action: f.action,
        reason: f.reason,
        note: f.note,
      })),
      activeDiagnosis:
        lastDiagnosis && !lastDiagnosis.resolved
          ? {
              resultLabel: lastDiagnosis.resultLabel,
              createdAt: lastDiagnosis.createdAt,
            }
          : null,
      weatherAlert:
        weatherAlert && weatherStatus.locationLabel
          ? { label: weatherAlert, location: weatherStatus.locationLabel }
          : null,
    });
  }

  private async buildPlantContext(
    plant: Awaited<ReturnType<typeof this.getPlantForUser>>,
    userId: string,
  ): Promise<PlantContext> {
    const { journalEntries, pendingTasks, recentFeedback, lastDiagnosis, weatherStatus } =
      await this.gatherContextSignals(plant, userId);

    const lines: string[] = [];

    if (journalEntries.length) {
      lines.push(
        'Recent journal:',
        ...journalEntries.map((entry) => {
          const note = entry.notes?.trim() || '(photo update)';
          return `- ${format(entry.createdAt, 'MMM d')}: ${note.slice(0, 160)}`;
        }),
      );
    }

    if (pendingTasks.length) {
      lines.push(
        'Upcoming care tasks:',
        ...pendingTasks.map(
          (task) =>
            `- ${task.taskType} due ${format(task.dueDate, 'MMM d')}`,
        ),
      );
    }

    const skipNotes = recentFeedback
      .filter((f) => f.action === 'SKIP' && (f.reason || f.note))
      .map((f) => f.note || f.reason)
      .filter(Boolean);
    if (skipNotes.length) {
      lines.push('Recent skip reasons:', ...skipNotes.map((note) => `- ${note}`));
    }

    const completeNotes = recentFeedback
      .filter((f) => f.action === 'COMPLETE' && (f.reason || f.note))
      .map((f) => {
        const label = f.reason ? f.reason.replace(/_/g, ' ').toLowerCase() : '';
        return f.note ? `${label}: ${f.note}`.trim() : label;
      })
      .filter(Boolean);
    if (completeNotes.length) {
      lines.push(
        'Recent feedback when completing tasks:',
        ...completeNotes.map((note) => `- ${note}`),
      );
    }

    lines.push(
      `Care snapshot: ${plant.location} · ${plant.potSize} pot · water about every ${plant.species.wateringFreqDays} days (catalog baseline) · light: ${plant.species.sunlight || 'see species'}`,
    );

    if (lastDiagnosis && !lastDiagnosis.resolved) {
      lines.push(
        `Active diagnosis (${format(lastDiagnosis.createdAt, 'MMM d')}): ${lastDiagnosis.resultLabel}` +
          (lastDiagnosis.symptomsText ? ` — ${lastDiagnosis.symptomsText.slice(0, 120)}` : ''),
      );
    }

    const weatherAlert = weatherStatus.cachedAdvice?.overviewAlerts?.[0]?.title;
    if (weatherAlert && weatherStatus.locationLabel) {
      lines.push(`Weather (${weatherStatus.locationLabel}): ${weatherAlert}`);
    }

    return {
      commonName: plant.species.commonName,
      scientificName: plant.species.scientificName,
      sunlight: plant.species.sunlight,
      wateringFreqDays: plant.species.wateringFreqDays,
      toxicity: plant.species.toxicity,
      careNotes: plant.species.careNotes,
      location: plant.location,
      caregiverContext: lines.length ? lines.join('\n') : null,
    };
  }

  private async imageToBase64(file: Express.Multer.File): Promise<{
    base64: string;
    mime: string;
  }> {
    return {
      base64: file.buffer.toString('base64'),
      mime: file.mimetype || 'image/jpeg',
    };
  }

  private async loadImageFromUrl(imageUrl: string): Promise<{
    base64: string;
    mime: string;
  } | null> {
    if (!imageUrl.startsWith('/uploads/')) return null;
    const rel = imageUrl.replace(/^\/uploads\//, '');
    const full = join(this.upload.getUploadDir(), rel);
    try {
      const buf = readFileSync(full);
      const ext = rel.split('.').pop()?.toLowerCase();
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      return { base64: buf.toString('base64'), mime };
    } catch {
      return null;
    }
  }

  async listConversations(userId: string, plantId: string) {
    await this.getPlantForUser(userId, plantId);
    return this.prisma.diagnosisConversation.findMany({
      where: { plantId, userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { role: true, content: true, createdAt: true },
        },
      },
    });
  }

  async getConversation(userId: string, plantId: string, conversationId: string) {
    await this.getPlantForUser(userId, plantId);
    const conv = await this.prisma.diagnosisConversation.findFirst({
      where: { id: conversationId, plantId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async getGuidedContextQuestions(
    userId: string,
    plantId: string,
    conversationId: string,
  ): Promise<{
    title: string;
    summary: string;
    questions: GuidedFollowUpQuestion[];
  }> {
    const plant = await this.getPlantForUser(userId, plantId);
    const conversation = await this.prisma.diagnosisConversation.findFirst({
      where: { id: conversationId, plantId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { role: true, content: true, imageUrl: true },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const text = conversation.messages
      .map((message) => message.content)
      .join('\n')
      .toLowerCase();
    const hasPhoto = conversation.messages.some((message) => Boolean(message.imageUrl));
    const questions: GuidedFollowUpQuestion[] = [];

    if (!/\b(today|yesterday|days?|weeks?|months?|since|started|began)\b/i.test(text)) {
      questions.push({
        id: 'symptom_duration',
        label: 'How long has this been happening?',
        prompt: 'Symptom duration',
        type: 'single',
        options: ['Started today', '2-3 days', '4-7 days', '2+ weeks', 'Not sure'],
      });
    }

    if (!/\b(water|watering|soak|dry|moist|wet|soil)\b/i.test(text)) {
      questions.push({
        id: 'soil_moisture',
        label: 'What does the soil feel like right now?',
        prompt: 'Current soil moisture',
        type: 'single',
        options: ['Very dry', 'Slightly dry', 'Evenly moist', 'Wet/soggy', 'Not checked'],
      });
    }

    if (!/\b(repotted|moved|fertiliz|feed|spray|treated|pesticide|temperature|cold|heat|window|light)\b/i.test(text)) {
      questions.push({
        id: 'recent_change',
        label: 'Did anything change recently?',
        prompt: 'Recent care or environment changes',
        type: 'single',
        options: [
          'No recent change',
          'Watering changed',
          'Light/location changed',
          'Repotted',
          'Fertilized or treated',
          'Temperature changed',
        ],
      });
    }

    if (!/\b(pest|bug|mite|gnat|aphid|scale|webbing|sticky|underside)\b/i.test(text)) {
      questions.push({
        id: 'pests_visible',
        label: 'Do you see pests or residue?',
        prompt: 'Pests or residue',
        type: 'single',
        options: ['No pests visible', 'Tiny bugs', 'Webbing', 'Sticky residue', 'Spots on undersides', 'Not checked'],
      });
    }

    if (!hasPhoto) {
      questions.push({
        id: 'photo_needed',
        label: 'Would a closer photo help?',
        prompt: 'Photo context',
        type: 'single',
        options: [
          'I can add a close-up photo',
          'I can add a whole-plant photo',
          'No photo available right now',
        ],
      });
    }

    questions.push({
      id: 'main_goal',
      label: 'What outcome do you want from Dr. Plant?',
      prompt: 'Preferred next step',
      type: 'single',
      options: [
        'Tell me what is most likely wrong',
        'Give me a recovery plan',
        'Tell me what to watch for',
        'Suggest tasks to add',
      ],
    });

    if (questions.length < 4) {
      questions.push({
        id: 'extra_observations',
        label: 'Anything else you noticed?',
        prompt: 'Extra observations',
        type: 'text',
      });
    }

    return {
      title: 'Missing context check',
      summary: `Answer a few quick questions so Dr. Plant can tailor advice for ${plant.nickname || plant.species.commonName}.`,
      questions: questions.slice(0, 6),
    };
  }

  async createConversation(
    userId: string,
    plantId: string,
    messageText?: string,
    file?: Express.Multer.File,
  ) {
    const plant = await this.getPlantForUser(userId, plantId);
    const title =
      messageText?.trim().slice(0, 80) ||
      (file ? 'Photo diagnosis' : 'New consultation');

    const conv = await this.prisma.diagnosisConversation.create({
      data: { plantId, userId, title },
    });

    if (messageText?.trim() || file) {
      await this.sendMessage(userId, plantId, conv.id, messageText ?? '', file);
      return this.getConversation(userId, plantId, conv.id);
    }

    return this.getConversation(userId, plantId, conv.id);
  }

  async sendMessage(
    userId: string,
    plantId: string,
    conversationId: string,
    messageText: string,
    file?: Express.Multer.File,
  ) {
    const plant = await this.getPlantForUser(userId, plantId);
    const conv = await this.prisma.diagnosisConversation.findFirst({
      where: { id: conversationId, plantId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: CHAT_HISTORY_TURN_LIMIT,
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    conv.messages.reverse();

    const text = messageText.trim() || (file ? 'What do you see in this photo?' : '');
    if (!text && !file) {
      throw new ServiceUnavailableException('Message text or image is required.');
    }

    await this.aiUsage.assertPlantIntentOrThrow({
      feature: 'diagnosis_chat',
      userId,
      plantId,
      conversationId,
      text,
      hasImage: Boolean(file),
      promptChars: text.length,
      imageCount: file ? 1 : 0,
    });

    let imageUrl: string | undefined;
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (file) {
      await this.imageModeration.assertImageAllowed(file, {
        feature: 'dr_plant_chat',
        userId,
      });
      imageUrl = await this.upload.saveFile(file);
      const img = await this.imageToBase64(file);
      imageBase64 = img.base64;
      imageMimeType = img.mime;
    }

    const userMsg = await this.prisma.diagnosisMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: text,
        imageUrl,
      },
    });

    const history: ChatTurn[] = [];
    for (const m of conv.messages) {
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      const turn: ChatTurn = {
        role: m.role as 'user' | 'assistant',
        content: m.content,
      };
      if (m.role === 'user' && m.imageUrl) {
        const loaded = await this.loadImageFromUrl(m.imageUrl);
        if (loaded) {
          turn.imageBase64 = loaded.base64;
          turn.imageMimeType = loaded.mime;
        }
      }
      history.push(turn);
    }

    let assistantContent: string;
    let source = 'openai';

    try {
      if (!this.llm.isAvailable()) {
        throw new OpenAiRequestError(
          'OPENAI_API_KEY is not configured. Add a key to .env for Dr. Plant chat.',
          'missing_api_key',
        );
      }
      await this.aiUsage.reserveCall({
        feature: 'diagnosis_chat',
        userId,
        plantId,
        conversationId,
        promptChars: text.length,
        imageCount: file ? 1 : 0,
      });
      assistantContent = await this.llm.chat(
        await this.buildPlantContext(plant, userId),
        history,
        { text, imageBase64, imageMimeType },
      );
    } catch (err) {
      if (err instanceof OpenAiRequestError) {
        throw new ServiceUnavailableException(err.message);
      }
      source = 'rules';
      assistantContent =
        'I cannot reach the AI service right now. Check your OpenAI API key and billing, then try again. ' +
        'In the meantime: inspect soil moisture, light exposure, and pests on leaf undersides.';
    }

    const assistantMsg = await this.prisma.diagnosisMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assistantContent,
      },
    });

    await this.prisma.diagnosisConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const isFirstExchange = conv.messages.length === 0;
    if (isFirstExchange && source === 'openai') {
      await this.prisma.diagnosis.create({
        data: {
          plantId,
          imageUrl,
          symptomsText: text,
          resultLabel: 'Dr. Plant consultation',
          confidence: null,
          adviceText: assistantContent.slice(0, 2000),
          source: 'openai',
        },
      });
    }

    return {
      conversationId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      source,
      model: this.llm.isAvailable() ? this.llm.getModelName() : null,
    };
  }

  async saveAssistantReplyToJournal(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatJournalActionDto,
  ) {
    const note = await this.resolveActionNote(userId, plantId, conversationId, dto);
    return this.prisma.journalEntry.create({
      data: {
        plantId,
        notes: `Dr. Plant note:\n\n${note}`,
      },
    });
  }

  async scheduleHealthCheckFromChat(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatHealthCheckActionDto,
  ) {
    const note = await this.resolveActionNote(userId, plantId, conversationId, dto);
    const dueInDays = dto.dueInDays ?? 3;
    const dueDate = startOfDay(addDays(new Date(), dueInDays));

    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: { gardenId: true },
    });

    const task = await this.prisma.task.create({
      data: {
        plantId,
        gardenId: plant?.gardenId,
        taskType: TaskType.HEALTH_CHECK,
        dueDate,
      },
      include: {
        plant: { include: { species: true } },
        sourceDiagnosis: {
          select: { id: true, resultLabel: true, resolved: true },
        },
      },
    });

    await this.prisma.journalEntry.create({
      data: {
        plantId,
        notes: `Dr. Plant health check scheduled in ${dueInDays} day${dueInDays === 1 ? '' : 's'}:\n\n${note}`,
      },
    });

    return task;
  }

  async getRecoverySuggestionsFromChat(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatJournalActionDto,
  ): Promise<{ diagnosisId: string; suggestions: ChatRecoverySuggestionView[] }> {
    const { note, conversation } = await this.resolveActionContext(
      userId,
      plantId,
      conversationId,
      dto,
    );
    const diagnosis = await this.ensureChatDiagnosis(plantId, conversation, note);
    const suggestions = buildRecoverySuggestions(diagnosis.id, null, note);
    const pending = await this.prisma.task.findMany({
      where: {
        plantId,
        sourceDiagnosisId: diagnosis.id,
        status: 'PENDING',
      },
      select: { taskType: true },
    });
    const scheduledTypes = new Set(pending.map((t) => t.taskType));

    return {
      diagnosisId: diagnosis.id,
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        alreadyScheduled: scheduledTypes.has(suggestion.taskType),
      })),
    };
  }

  async applyRecoveryTasksFromChat(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatRecoveryTasksDto,
  ) {
    const { note, conversation } = await this.resolveActionContext(
      userId,
      plantId,
      conversationId,
      dto,
    );
    const diagnosis = await this.ensureChatDiagnosis(plantId, conversation, note);
    const suggestions = buildRecoverySuggestions(diagnosis.id, null, note);
    const selected = suggestions.filter((suggestion) => dto.keys.includes(suggestion.key));
    if (selected.length === 0) {
      throw new BadRequestException('No valid recovery tasks selected.');
    }

    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: { gardenId: true },
    });
    const created = [];
    for (const suggestion of selected) {
      const existing = await this.prisma.task.findFirst({
        where: {
          plantId,
          sourceDiagnosisId: diagnosis.id,
          taskType: suggestion.taskType,
          status: 'PENDING',
        },
      });
      if (existing) continue;

      created.push(
        await this.prisma.task.create({
          data: {
            plantId,
            gardenId: plant?.gardenId,
            taskType: suggestion.taskType,
            dueDate: startOfDay(addDays(new Date(), suggestion.dueInDays)),
            sourceDiagnosisId: diagnosis.id,
          },
          include: {
            plant: { include: { species: true } },
            sourceDiagnosis: {
              select: { id: true, resultLabel: true, resolved: true },
            },
          },
        }),
      );
    }

    if (created.length === 0) {
      throw new BadRequestException(
        'Selected recovery tasks are already on your schedule.',
      );
    }

    await this.prisma.journalEntry.create({
      data: {
        plantId,
        notes:
          `Dr. Plant recovery plan: added ${created.length} task${created.length === 1 ? '' : 's'}.\n\n` +
          note,
      },
    });

    return created;
  }

  private async resolveActionNote(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatJournalActionDto,
  ): Promise<string> {
    const { note } = await this.resolveActionContext(userId, plantId, conversationId, dto);
    return note;
  }

  private async resolveActionContext(
    userId: string,
    plantId: string,
    conversationId: string,
    dto: ChatJournalActionDto,
  ): Promise<{
    note: string;
    conversation: {
      id: string;
      plantId: string;
      userId: string;
      title: string | null;
      createdAt: Date;
      messages: Array<{ id: string; role: string; content: string }>;
    };
  }> {
    const conv = await this.prisma.diagnosisConversation.findFirst({
      where: { id: conversationId, plantId, userId },
      include: {
        messages: {
          where: dto.messageId ? { id: dto.messageId } : { role: 'assistant' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const explicit = dto.note?.trim();
    if (explicit) return { note: explicit, conversation: conv };

    const message = conv.messages[0];
    if (!message || message.role !== 'assistant' || !message.content.trim()) {
      throw new BadRequestException('Choose a Dr. Plant reply or add a note.');
    }

    return { note: message.content.trim().slice(0, 2000), conversation: conv };
  }

  private async ensureChatDiagnosis(
    plantId: string,
    conversation: {
      title: string | null;
      createdAt: Date;
    },
    note: string,
  ): Promise<{ id: string }> {
    const existing = await this.prisma.diagnosis.findFirst({
      where: {
        plantId,
        source: 'openai',
        resultLabel: 'Dr. Plant consultation',
        resolved: false,
        createdAt: { gte: conversation.createdAt },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    return this.prisma.diagnosis.create({
      data: {
        plantId,
        symptomsText: conversation.title || 'Dr. Plant chat follow-up',
        resultLabel: 'Dr. Plant consultation',
        confidence: null,
        adviceText: note.slice(0, 2000),
        source: 'openai',
      },
      select: { id: true },
    });
  }
}
