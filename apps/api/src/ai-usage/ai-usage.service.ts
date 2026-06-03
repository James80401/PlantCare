import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { subMinutes, addHours } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';

export type AiUsageFeature = 'diagnosis' | 'diagnosis_chat';

export interface AiUsageContext {
  feature: AiUsageFeature;
  userId: string;
  plantId?: string;
  conversationId?: string;
  promptChars?: number;
  imageCount?: number;
}

const PLANT_TERMS = [
  'plant',
  'plants',
  'garden',
  'gardening',
  'leaf',
  'leaves',
  'stem',
  'root',
  'soil',
  'pot',
  'potted',
  'flower',
  'fruit',
  'vegetable',
  'herb',
  'seedling',
  'sprout',
  'succulent',
  'cactus',
  'tree',
  'shrub',
  'vine',
  'orchid',
  'monstera',
  'pothos',
  'cannabis',
  'cannibus',
  'watering',
  'fertilizer',
  'fertiliser',
  'prune',
  'repot',
  'sunlight',
  'humidity',
  'pest',
  'mites',
  'aphids',
  'fungus',
  'mildew',
  'blight',
  'wilting',
  'yellowing',
  'browning',
  'crispy',
  'drooping',
  'diagnose',
  'diagnosis',
  'health check',
];

const CONTEXTUAL_PLANT_PHRASES = [
  'what is wrong',
  'what do you see',
  'does it look',
  'is it healthy',
  'how do i fix',
  'what should i do',
  'help it recover',
  'save it',
  'new growth',
  'brown spots',
  'yellow spots',
  'white spots',
  'black spots',
];

const OFF_TOPIC_PATTERNS = [
  /\b(code|coding|program|javascript|typescript|python|sql|html|css|api endpoint|debug this)\b/i,
  /\b(homework|essay|book report|cover letter|resume|business plan)\b/i,
  /\b(crypto|stock|option trade|sports bet|parlay|tax advice|legal advice)\b/i,
  /\b(write a song|write a poem|roleplay|dating profile|meal plan|workout plan)\b/i,
  /\b(summarize this article|translate this|solve this math|premium gpt|chatgpt plus)\b/i,
];

@Injectable()
export class AiUsageService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async assertPlantIntentOrThrow(ctx: AiUsageContext & { text?: string; hasImage?: boolean }) {
    const verdict = this.classifyPlantIntent(ctx.text, Boolean(ctx.hasImage));
    if (verdict.allowed) return;

    await this.record({
      ...ctx,
      status: 'BLOCKED_OFF_TOPIC',
      reason: verdict.reason,
    });

    throw new HttpException(
      {
        code: 'DR_PLANT_SCOPE_REQUIRED',
        message:
          'Dr. Plant can only help with plant, garden, and plant-health questions. Please ask about this plant or upload a plant photo.',
        reason: verdict.reason,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async reserveCall(ctx: AiUsageContext) {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { aiPausedUntil: true },
    });

    if (user?.aiPausedUntil && user.aiPausedUntil > now) {
      await this.record({ ...ctx, status: 'PAUSED', reason: 'user paused after excessive AI usage' });
      throw this.pausedException(user.aiPausedUntil);
    }

    const windowMinutes = this.configInt('AI_RATE_LIMIT_WINDOW_MINUTES', 60);
    const maxCalls = this.configInt('AI_RATE_LIMIT_MAX_CALLS', 30);
    const pauseHours = this.configInt('AI_RATE_LIMIT_PAUSE_HOURS', 12);
    const since = subMinutes(now, windowMinutes);
    const current = await this.prisma.aiUsageEvent.count({
      where: {
        userId: ctx.userId,
        status: 'ALLOWED',
        createdAt: { gte: since },
      },
    });

    if (current >= maxCalls) {
      const pausedUntil = addHours(now, pauseHours);
      await this.prisma.user.update({
        where: { id: ctx.userId },
        data: { aiPausedUntil: pausedUntil },
      });
      await this.record({
        ...ctx,
        status: 'RATE_LIMITED',
        reason: `${current} calls in ${windowMinutes} minutes`,
      });
      throw this.pausedException(pausedUntil);
    }

    await this.record({ ...ctx, status: 'ALLOWED' });
  }

  classifyPlantIntent(text = '', hasImage = false): { allowed: boolean; reason?: string } {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (hasImage && !this.hasStrongOffTopicIntent(normalized)) return { allowed: true };
    if (!normalized) return { allowed: true };
    if (this.hasPlantLanguage(normalized)) return { allowed: true };
    if (CONTEXTUAL_PLANT_PHRASES.some((phrase) => normalized.includes(phrase))) {
      return { allowed: true };
    }
    if (this.hasStrongOffTopicIntent(normalized)) {
      return { allowed: false, reason: 'request is clearly outside plant care' };
    }
    if (normalized.length <= 80 && /\b(it|this|that|these|those|help|sick|dying)\b/i.test(normalized)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'request does not mention a plant or garden care issue' };
  }

  private hasPlantLanguage(text: string) {
    return PLANT_TERMS.some((term) => text.includes(term));
  }

  private hasStrongOffTopicIntent(text: string) {
    return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
  }

  private async record(
    ctx: AiUsageContext & { status: 'ALLOWED' | 'BLOCKED_OFF_TOPIC' | 'RATE_LIMITED' | 'PAUSED'; reason?: string },
  ) {
    await this.prisma.aiUsageEvent.create({
      data: {
        userId: ctx.userId,
        feature: ctx.feature,
        plantId: ctx.plantId,
        conversationId: ctx.conversationId,
        promptChars: ctx.promptChars ?? 0,
        imageCount: ctx.imageCount ?? 0,
        status: ctx.status,
        reason: ctx.reason,
      },
    });
  }

  private pausedException(pausedUntil: Date) {
    return new HttpException(
      {
        code: 'AI_USAGE_PAUSED',
        message:
          'Dr. Plant is paused for this account because of unusually high AI usage. Please try again later.',
        pausedUntil: pausedUntil.toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private configInt(key: string, fallback: number) {
    const raw = this.config.get<string>(key);
    const parsed = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
