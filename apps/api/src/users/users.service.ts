import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { WeatherService } from '../weather/weather.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private weather: WeatherService,
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
        locationLabel: true,
        timezone: true,
        temperatureUnit: true,
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
      locationLabel?: string | null;
      locationQuery?: string;
      temperatureUnit?: string;
    },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });
    const resolved = await this.resolveLocationFields(data);
    const locationChanged =
      (resolved.latitude !== undefined &&
        resolved.latitude !== existing?.latitude) ||
      (resolved.longitude !== undefined &&
        resolved.longitude !== existing?.longitude);
    if (locationChanged) {
      await this.weather.invalidateAdviceCache(userId);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: resolved,
      select: {
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        timezone: true,
        temperatureUnit: true,
        latitude: true,
        longitude: true,
        locationLabel: true,
      },
    });
  }

  private async resolveLocationFields(data: {
    latitude?: number;
    longitude?: number;
    locationLabel?: string | null;
    locationQuery?: string;
    timezone?: string;
  }) {
    const { locationQuery, ...rest } = data;
    // Dropdown / device location already provides coordinates; do not re-geocode the label.
    if (this.hasValidCoordinates(rest.latitude, rest.longitude)) {
      return rest;
    }
    if (locationQuery?.trim()) {
      const match = await this.weather.geocodeLocation(locationQuery);
      if (!match) {
        throw new NotFoundException('Could not find that city or address. Try a nearby city name.');
      }
      return {
        ...rest,
        latitude: match.latitude,
        longitude: match.longitude,
        locationLabel: match.label,
        timezone: rest.timezone || match.timezone,
      };
    }
    return rest;
  }

  private hasValidCoordinates(latitude?: number, longitude?: number): boolean {
    return (
      latitude !== undefined &&
      longitude !== undefined &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
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
