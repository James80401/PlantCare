import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { ImageModerationService } from '../common/image-moderation.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private imageModeration: ImageModerationService,
  ) {}

  async findAll(userId: string, plantId: string) {
    await this.assertPlant(userId, plantId);
    return this.prisma.journalEntry.findMany({
      where: { plantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    plantId: string,
    dto: CreateJournalDto,
    file?: Express.Multer.File,
  ) {
    await this.assertPlant(userId, plantId);
    if (!file && !dto.notes?.trim()) {
      throw new BadRequestException('Add a note or photo.');
    }
    let photoUrl: string | undefined;
    if (file) {
      await this.imageModeration.assertImageAllowed(file);
      photoUrl = await this.upload.saveFile(file);
    }

    return this.prisma.journalEntry.create({
      data: {
        plantId,
        notes: dto.notes,
        photoUrl,
        heightCm: dto.heightCm,
        widthCm: dto.widthCm,
        leafCount: dto.leafCount,
      },
    });
  }

  async update(
    userId: string,
    plantId: string,
    entryId: string,
    dto: UpdateJournalDto,
    file?: Express.Multer.File,
  ) {
    await this.assertPlant(userId, plantId);
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, plantId },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');

    let photoUrl = entry.photoUrl;
    if (dto.removePhoto) photoUrl = null;
    if (file) {
      await this.imageModeration.assertImageAllowed(file);
      photoUrl = await this.upload.saveFile(file);
    }

    const nextNotes = dto.notes !== undefined ? dto.notes : entry.notes;
    if (!file && !dto.removePhoto && !nextNotes?.trim() && !photoUrl) {
      throw new BadRequestException('Add a note or photo.');
    }

    return this.prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.heightCm !== undefined ? { heightCm: dto.heightCm } : {}),
        ...(dto.widthCm !== undefined ? { widthCm: dto.widthCm } : {}),
        ...(dto.leafCount !== undefined ? { leafCount: dto.leafCount } : {}),
        photoUrl,
      },
    });
  }

  async remove(userId: string, plantId: string, entryId: string) {
    await this.assertPlant(userId, plantId);
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, plantId },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');

    await this.prisma.journalEntry.delete({ where: { id: entryId } });
    return { deleted: true };
  }

  private async assertPlant(userId: string, plantId: string) {
    const plant = await this.prisma.plant.findFirst({ where: { id: plantId, userId } });
    if (!plant) throw new NotFoundException('Plant not found');
  }
}
