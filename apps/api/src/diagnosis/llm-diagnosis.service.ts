import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  isTransientOpenAiError,
  OpenAiRequestError,
  parseOpenAiError,
} from './openai-errors';
import {
  providerMaxRetries,
  providerTimeoutMs,
  withBoundedRetry,
} from '../common/bounded-retry';

export interface StructuredDiagnosis {
  issueName: string;
  confidence: number;
  summary: string;
  likelyCauses: string[];
  immediateActions: string[];
  longTermCare: string[];
  whenToSeekHelp: string;
}

export interface PlantContext {
  commonName: string;
  scientificName?: string | null;
  sunlight?: string | null;
  wateringFreqDays?: number;
  toxicity?: string | null;
  careNotes?: string | null;
  location?: string | null;
  caregiverContext?: string | null;
}

export interface LlmDiagnosisInput extends PlantContext {
  symptomsText?: string;
  imageHint?: { label: string; confidence: number };
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
}

const SYSTEM_PROMPT =
  'You are Dr. Plant, an expert horticulturist helping a home gardener. ' +
  'You are only for plant care, garden care, plant health, and directly related follow-up questions. ' +
  'If a request is about unrelated tasks such as coding, writing, homework, finance, legal, entertainment, or general ChatGPT use, politely refuse and redirect the user to ask about their plant or garden. ' +
  'Give practical, safe plant-care advice. Do not claim certainty when a photo is unclear. ' +
  'Avoid recommending dangerous chemicals without safety notes. Use markdown for readability (bold, bullets). ' +
  'Be concise but helpful. If the user sends follow-up questions, build on prior context.';

@Injectable()
export class LlmDiagnosisService {
  private readonly logger = new Logger(LlmDiagnosisService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
    this.baseUrl = (
      this.config.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1') ?? ''
    ).replace(/\/$/, '');
    this.timeoutMs = providerTimeoutMs(this.config);
    this.maxRetries = providerMaxRetries(this.config);
  }

  getModelName(): string {
    return this.model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  private plantContextBlock(ctx: PlantContext): string {
    return [
      `Plant: ${ctx.commonName}${ctx.scientificName ? ` (${ctx.scientificName})` : ''}`,
      ctx.location ? `Location: ${ctx.location}` : null,
      ctx.sunlight ? `Light needs: ${ctx.sunlight}` : null,
      ctx.wateringFreqDays
        ? `Typical watering interval: every ${ctx.wateringFreqDays} days`
        : null,
      ctx.toxicity ? `Pet safety: ${ctx.toxicity}` : null,
      ctx.careNotes ? `Care notes: ${ctx.careNotes}` : null,
      ctx.caregiverContext ? `\nRecent caregiver context:\n${ctx.caregiverContext}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async callChatCompletions(
    messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>,
    options: { jsonMode?: boolean; maxTokens?: number } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new OpenAiRequestError(
        'OPENAI_API_KEY is not configured.',
        'missing_api_key',
      );
    }

    try {
      const { data } = await withBoundedRetry(
        () =>
          axios.post(
            `${this.baseUrl}/chat/completions`,
            {
              model: this.model,
              temperature: 0.5,
              max_tokens: options.maxTokens ?? 1500,
              ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
              messages,
            },
            {
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: this.timeoutMs,
            },
          ),
        isTransientOpenAiError,
        this.maxRetries,
      );

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        throw new OpenAiRequestError('Empty response from OpenAI.', 'unknown');
      }
      return raw;
    } catch (err) {
      if (err instanceof OpenAiRequestError) throw err;
      const parsed = parseOpenAiError(err);
      this.logger.warn(`OpenAI request failed (${parsed.code}): ${parsed.message}`);
      throw parsed;
    }
  }

  async chat(
    plant: PlantContext,
    history: ChatTurn[],
    latest: { text: string; imageBase64?: string; imageMimeType?: string },
  ): Promise<string> {
    const systemContent = `${SYSTEM_PROMPT}\n\nPlant profile:\n${this.plantContextBlock(plant)}`;

    const messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }> =
      [{ role: 'system', content: systemContent }];

    for (const turn of history) {
      if (turn.role === 'assistant') {
        messages.push({ role: 'assistant', content: turn.content });
        continue;
      }
      const parts: Array<Record<string, unknown>> = [{ type: 'text', text: turn.content }];
      if (turn.imageBase64 && turn.imageMimeType) {
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${turn.imageMimeType};base64,${turn.imageBase64}` },
        });
      }
      messages.push({
        role: 'user',
        content: parts.length === 1 ? turn.content : parts,
      });
    }

    const text = latest.text.trim() || 'Please review the attached plant photo.';
    const latestParts: Array<Record<string, unknown>> = [{ type: 'text', text }];
    if (latest.imageBase64 && latest.imageMimeType) {
      latestParts.push({
        type: 'image_url',
        image_url: { url: `data:${latest.imageMimeType};base64,${latest.imageBase64}` },
      });
    }

    messages.push({
      role: 'user',
      content: latestParts.length === 1 ? text : latestParts,
    });

    return this.callChatCompletions(messages, { maxTokens: 1500 });
  }

  async diagnose(input: LlmDiagnosisInput): Promise<StructuredDiagnosis | null> {
    if (!this.apiKey) return null;

    const userText = [
      'Diagnose this plant problem. Respond ONLY with valid JSON matching this schema:',
      '{',
      '  "issueName": "short name of likely problem",',
      '  "confidence": 0.0 to 1.0,',
      '  "summary": "2-3 sentence overview",',
      '  "likelyCauses": ["cause 1", "cause 2"],',
      '  "immediateActions": ["action 1", "action 2"],',
      '  "longTermCare": ["tip 1", "tip 2"],',
      '  "whenToSeekHelp": "when to escalate or consult a nursery"',
      '}',
      '',
      this.plantContextBlock(input),
      input.symptomsText ? `\nUser-described symptoms:\n${input.symptomsText}` : '',
      input.imageHint
        ? `\nImage classifier hint: ${input.imageHint.label} (${Math.round(input.imageHint.confidence * 100)}% confidence).`
        : '',
      input.imageBase64
        ? '\nA photo is attached. Analyze visible signs.'
        : '\nNo photo; base advice on symptoms and species care only.',
    ].join('\n');

    const content: Array<Record<string, unknown>> = [{ type: 'text', text: userText }];
    if (input.imageBase64 && input.imageMimeType) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${input.imageMimeType};base64,${input.imageBase64}` },
      });
    }

    try {
      const raw = await this.callChatCompletions(
        [
          {
            role: 'system',
            content:
              'You are only for plant and garden health. Refuse unrelated requests and redirect to plant care. Give practical, safe plant-care advice. Respond with JSON only when asked.',
          },
          { role: 'user', content },
        ],
        { jsonMode: true, maxTokens: 1200 },
      );

      const parsed = JSON.parse(raw) as StructuredDiagnosis;
      return {
        issueName: parsed.issueName || 'Plant health check',
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
        summary: parsed.summary || '',
        likelyCauses: Array.isArray(parsed.likelyCauses) ? parsed.likelyCauses : [],
        immediateActions: Array.isArray(parsed.immediateActions)
          ? parsed.immediateActions
          : [],
        longTermCare: Array.isArray(parsed.longTermCare) ? parsed.longTermCare : [],
        whenToSeekHelp: parsed.whenToSeekHelp || '',
      };
    } catch (err) {
      if (err instanceof OpenAiRequestError) throw err;
      this.logger.warn(`OpenAI diagnosis failed: ${err}`);
      return null;
    }
  }

  formatAdviceText(result: StructuredDiagnosis): string {
    const sections = [
      result.summary,
      '',
      '**Likely causes**',
      ...result.likelyCauses.map((c) => `• ${c}`),
      '',
      '**Do now**',
      ...result.immediateActions.map((a) => `• ${a}`),
      '',
      '**Ongoing care**',
      ...result.longTermCare.map((t) => `• ${t}`),
      '',
      `**When to get help:** ${result.whenToSeekHelp}`,
    ];
    return sections.filter((line, i, arr) => line !== '' || arr[i - 1] !== '').join('\n');
  }
}
