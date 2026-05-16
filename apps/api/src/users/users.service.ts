import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        planTier: true,
        latitude: true,
        longitude: true,
        timezone: true,
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        createdAt: true,
        _count: { select: { plants: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateNotificationSettings(
    userId: string,
    data: {
      notifyPush?: boolean;
      notifyEmail?: boolean;
      notifySms?: boolean;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
      timezone?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        timezone: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const plants = await this.prisma.plant.findMany({
      where: { userId },
      select: { imageUrl: true, journalEntries: { select: { photoUrl: true } }, diagnoses: { select: { imageUrl: true } } },
    });
    for (const plant of plants) {
      if (plant.imageUrl) await this.upload.deleteByUrl(plant.imageUrl).catch(() => {});
      for (const j of plant.journalEntries) {
        if (j.photoUrl) await this.upload.deleteByUrl(j.photoUrl).catch(() => {});
      }
      for (const d of plant.diagnoses) {
        if (d.imageUrl) await this.upload.deleteByUrl(d.imageUrl).catch(() => {});
      }
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }
}
