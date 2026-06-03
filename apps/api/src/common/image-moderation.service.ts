import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ImageModerationVerdict {
  isPlant: boolean;
  isExplicit: boolean;
  confidence: number;
  reason: string;
}

const SYSTEM_PROMPT =
  'You are an image content classifier for a plant-care app. ' +
  'Look at the attached image and respond ONLY with valid JSON matching this schema:\n' +
  '{\n' +
  '  "isPlant": true/false,   // true if the image clearly contains a living plant, leaf, flower, fruit, or vegetable garden subject\n' +
  '  "isExplicit": true/false, // true if the image contains nudity, sexual content, graphic violence, gore, or other adult/disallowed content\n' +
  '  "confidence": 0.0 to 1.0,\n' +
  '  "reason": "one short sentence explaining the classification"\n' +
  '}\n' +
  'Treat unclear, blurry, or text-only images as isPlant=false. ' +
  'Houseplants, garden plants, leaves with disease, soil with seedlings, and close-up flowers all count as plants. ' +
  'Pets, people, food on a plate, packaged products, and indoor scenes without a visible plant do NOT count.';

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>('OPENAI_MODERATION_MODEL', 'gpt-4o-mini');
    this.baseUrl = (
      this.config.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1') ?? ''
    ).replace(/\/$/, '');
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Throws BadRequestException when the image is rejected.
   * No-op (returns silently) when no API key is configured — that lets dev / CI run
   * without OpenAI credentials. Production deployments should set OPENAI_API_KEY.
   *
   * Pass an optional `context` (e.g. { feature: 'identify', userId }) so audit logs
   * on rejects are traceable.
   */
  async assertImageAllowed(
    file: Express.Multer.File,
    context: { feature?: string; userId?: string } = {},
  ): Promise<ImageModerationVerdict | null> {
    if (!this.apiKey) {
      this.logger.warn('Image moderation skipped: OPENAI_API_KEY not configured.');
      return null;
    }

    const verdict = await this.classify(file);

    if (verdict.isExplicit) {
      this.logReject('explicit', verdict, file, context);
      throw new BadRequestException(
        'This image cannot be processed. Please upload a different photo.',
      );
    }
    if (!verdict.isPlant) {
      this.logReject('not_plant', verdict, file, context);
      throw new BadRequestException(
        verdict.reason && verdict.reason.length < 120
          ? `That image doesn't look like a plant — ${verdict.reason.toLowerCase()}`
          : "That image doesn't look like a plant. Please upload a clear photo of a plant.",
      );
    }
    return verdict;
  }

  private logReject(
    rejectKind: 'explicit' | 'not_plant',
    verdict: ImageModerationVerdict,
    file: Express.Multer.File,
    context: { feature?: string; userId?: string },
  ): void {
    // Structured single-line log so it's easy to grep / parse from log shippers.
    const fields = {
      event: 'image_moderation_reject',
      reject: rejectKind,
      feature: context.feature ?? 'unknown',
      userId: context.userId ?? 'anonymous',
      filename: file.originalname,
      sizeBytes: file.size,
      mime: file.mimetype,
      verdictConfidence: verdict.confidence,
      reason: verdict.reason,
    };
    this.logger.warn(JSON.stringify(fields));
  }

  async classify(file: Express.Multer.File): Promise<ImageModerationVerdict> {
    if (!this.apiKey) {
      return { isPlant: true, isExplicit: false, confidence: 0, reason: 'moderation disabled' };
    }

    const base64 = file.buffer.toString('base64');
    const mime = file.mimetype || 'image/jpeg';

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          temperature: 0,
          max_tokens: 200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Classify this image.' },
                {
                  type: 'image_url',
                  image_url: { url: `data:${mime};base64,${base64}` },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        this.logger.warn('Moderation returned empty content; failing open.');
        return this.failOpen('empty response');
      }
      return this.parseVerdict(raw);
    } catch (err) {
      // Fail-open: if moderation itself is broken, we don't want to lock users out
      // of uploading legitimate photos. Log loudly so this is visible in production.
      this.logger.error(`Image moderation request failed; failing open: ${err}`);
      return this.failOpen('moderation unreachable');
    }
  }

  private parseVerdict(raw: string): ImageModerationVerdict {
    try {
      const parsed = JSON.parse(raw);
      return {
        isPlant: Boolean(parsed.isPlant),
        isExplicit: Boolean(parsed.isExplicit),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
        reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '',
      };
    } catch {
      return this.failOpen('unparseable response');
    }
  }

  private failOpen(reason: string): ImageModerationVerdict {
    return { isPlant: true, isExplicit: false, confidence: 0, reason };
  }
}
