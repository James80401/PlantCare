import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

export interface IdentifyResult {
  commonName: string;
  scientificName: string;
  confidence: number;
  provider: 'plantnet' | 'demo';
  providerMatchId: string;
}

const DEFAULT_MIN_CONFIDENCE = 0.1;

@Injectable()
export class PlantNetService {
  private readonly logger = new Logger(PlantNetService.name);
  private readonly apiKey: string | undefined;
  private readonly minConfidence: number;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('PLANTNET_API_KEY');
    const raw = this.config.get<string>('PLANTNET_MIN_CONFIDENCE');
    const parsed = raw ? Number(raw) : NaN;
    this.minConfidence =
      Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_MIN_CONFIDENCE;
  }

  async identify(file: Express.Multer.File): Promise<IdentifyResult | null> {
    if (!this.apiKey) {
      return {
        commonName: 'Unknown (demo)',
        scientificName: 'Species unknown',
        confidence: 0.5,
        provider: 'demo',
        providerMatchId: 'demo-species-unknown',
      };
    }

    try {
      const form = new FormData();
      form.append('images', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      form.append('organs', 'leaf');

      const { data } = await axios.post(
        'https://my-api.plantnet.org/v2/identify/all',
        form,
        {
          params: { 'api-key': this.apiKey },
          headers: form.getHeaders(),
          timeout: 15000,
        },
      );

      const best = data.results?.[0];
      if (!best) return null;

      const score = typeof best.score === 'number' ? best.score : 0;
      if (score < this.minConfidence) {
        this.logger.warn(
          `PlantNet best score ${score.toFixed(3)} below threshold ${this.minConfidence}; rejecting`,
        );
        return null;
      }

      const species = best.species;
      return {
        commonName: species.commonNames?.[0] || species.scientificNameWithoutAuthor,
        scientificName: species.scientificNameWithoutAuthor,
        confidence: score,
        provider: 'plantnet',
        providerMatchId: species.scientificNameWithoutAuthor,
      };
    } catch (err) {
      this.logger.warn(`PlantNet identify failed: ${err}`);
      return null;
    }
  }
}
