import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { LlmDiagnosisService, type ChatTurn, type PlantContext } from './llm-diagnosis.service';
import { OpenAiRequestError } from './openai-errors';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DiagnosisChatService {
  constructor(
    private prisma: PrismaService,
    private llm: LlmDiagnosisService,
    private upload: UploadService,
  ) {}

  private async getPlantForUser(userId: string, plantId: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId },
      include: { species: true },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return plant;
  }

  private plantContext(plant: Awaited<ReturnType<typeof this.getPlantForUser>>): PlantContext {
    return {
      commonName: plant.species.commonName,
      scientificName: plant.species.scientificName,
      sunlight: plant.species.sunlight,
      wateringFreqDays: plant.species.wateringFreqDays,
      toxicity: plant.species.toxicity,
      careNotes: plant.species.careNotes,
      location: plant.location,
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
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const text = messageText.trim() || (file ? 'What do you see in this photo?' : '');
    if (!text && !file) {
      throw new ServiceUnavailableException('Message text or image is required.');
    }

    let imageUrl: string | undefined;
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (file) {
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
      assistantContent = await this.llm.chat(
        this.plantContext(plant),
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
}
