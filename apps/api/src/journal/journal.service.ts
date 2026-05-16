import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
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
    notes?: string,
    file?: Express.Multer.File,
  ) {
    await this.assertPlant(userId, plantId);
    let photoUrl: string | undefined;
    if (file) photoUrl = await this.upload.saveFile(file);

    return this.prisma.journalEntry.create({
      data: { plantId, notes, photoUrl },
    });
  }

  private async assertPlant(userId: string, plantId: string) {
    const plant = await this.prisma.plant.findFirst({ where: { id: plantId, userId } });
    if (!plant) throw new NotFoundException('Plant not found');
  }
}
