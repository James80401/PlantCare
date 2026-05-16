import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

export interface IdentifyResult {
  commonName: string;
  scientificName: string;
  confidence: number;
}

@Injectable()
export class PlantNetService {
  private readonly logger = new Logger(PlantNetService.name);
  private readonly apiKey: string | undefined;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('PLANTNET_API_KEY');
  }

  async identify(file: Express.Multer.File): Promise<IdentifyResult | null> {
    if (!this.apiKey) {
      return {
        commonName: 'Unknown (demo)',
        scientificName: 'Species unknown',
        confidence: 0.5,
      };
    }

    try {
      const form = new FormData();
      form.append('images', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      form.append('organs', 'leaf');

      const { data } = await axios.post(
        'https://my-api.plantnet/v2/identify/all',
        form,
        {
          params: { 'api-key': this.apiKey },
          headers: form.getHeaders(),
          timeout: 15000,
        },
      );

      const best = data.results?.[0];
      if (!best) return null;

      const species = best.species;
      return {
        commonName: species.commonNames?.[0] || species.scientificNameWithoutAuthor,
        scientificName: species.scientificNameWithoutAuthor,
        confidence: best.score,
      };
    } catch (err) {
      this.logger.warn(`PlantNet identify failed: ${err}`);
      return null;
    }
  }
}
