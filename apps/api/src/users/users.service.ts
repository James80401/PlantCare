import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { isAdminEmail } from '../config/registration-policy';
import { UploadService } from '../upload/upload.service';
import { WeatherService } from '../weather/weather.service';
import { effectivePlanTier } from '../config/premium-policy';
import type { UpdateCarePreferencesDto } from './dto/update-care-preferences.dto';
import { BillingService } from '../billing/billing.service';
import { resolveNotificationCapabilities } from '../notifications/notification-capabilities';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private weather: WeatherService,
    private config: ConfigService,
    private billing: BillingService,
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
        phone: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        reminderHour: true,
        experienceLevel: true,
        defaultLightLevel: true,
        createdAt: true,
        _count: { select: { plants: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      planTier: effectivePlanTier(this.config, user.planTier),
      isAdmin: isAdminEmail(this.config, user.email),
      notificationCapabilities: resolveNotificationCapabilities(this.config),
    };
  }

  async updateCarePreferences(
    userId: string,
    data: UpdateCarePreferencesDto,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.experienceLevel !== undefined
          ? { experienceLevel: data.experienceLevel }
          : {}),
        ...(data.defaultLightLevel !== undefined
          ? { defaultLightLevel: data.defaultLightLevel }
          : {}),
      },
      select: {
        experienceLevel: true,
        defaultLightLevel: true,
      },
    });
  }

  async updateNotificationSettings(
    userId: string,
    data: {
      notifyPush?: boolean;
      notifyEmail?: boolean;
      notifySms?: boolean;
      phone?: string;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
      reminderHour?: number | null;
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
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: resolved,
      select: {
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
        phone: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        reminderHour: true,
        timezone: true,
        temperatureUnit: true,
        latitude: true,
        longitude: true,
        locationLabel: true,
      },
    });
    return {
      ...user,
      notificationCapabilities: resolveNotificationCapabilities(this.config),
    };
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

  /**
   * Full personal-data export (GDPR/CCPA portability). Returns every record the
   * user authored or owns as plain JSON; excludes credentials and internal
   * tokens. Photos are referenced by URL rather than embedded.
   */
  async exportData(userId: string) {
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
        phone: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        reminderHour: true,
        experienceLevel: true,
        defaultLightLevel: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [gardens, memberships, plants, recommendations, posts, comments] =
      await Promise.all([
        this.prisma.garden.findMany({
          where: { ownerId: userId },
          select: { id: true, name: true, location: true, createdAt: true },
        }),
        this.prisma.gardenMember.findMany({
          where: { userId },
          select: { role: true, joinedAt: true, garden: { select: { name: true } } },
        }),
        this.prisma.plant.findMany({
          where: { userId },
          include: {
            species: { select: { commonName: true, scientificName: true } },
            tasks: {
              select: {
                taskType: true,
                dueDate: true,
                status: true,
                completedAt: true,
                createdAt: true,
              },
            },
            journalEntries: true,
            progressEntries: true,
            diagnoses: {
              select: {
                resultLabel: true,
                symptomsText: true,
                adviceText: true,
                confidence: true,
                imageUrl: true,
                resolved: true,
                createdAt: true,
              },
            },
            milestones: true,
          },
        }),
        this.prisma.recommendation.findMany({
          where: { userId },
          select: {
            title: true,
            body: true,
            priority: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.communityPost.findMany({
          where: { authorId: userId },
          select: { body: true, imageUrl: true, createdAt: true },
        }),
        this.prisma.comment.findMany({
          where: { authorId: userId },
          select: { body: true, postId: true, createdAt: true },
        }),
      ]);

    return {
      format: 'dr-plant-export/v1',
      exportedAt: new Date().toISOString(),
      profile: user,
      gardens,
      gardenMemberships: memberships,
      plants: plants.map(({ userId: _userId, speciesId: _speciesId, gardenId: _gardenId, ...plant }) => plant),
      recommendations,
      community: { posts, comments },
    };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Password confirmation failed');
    }

    const [plants, conversations, posts] = await Promise.all([
      this.prisma.plant.findMany({
        where: {
          OR: [{ userId }, { garden: { ownerId: userId } }],
        },
        select: {
          imageUrl: true,
          journalEntries: { select: { photoUrl: true } },
          progressEntries: { select: { photoUrl: true } },
          diagnoses: { select: { imageUrl: true } },
          diagnosisConversations: {
            select: { messages: { select: { imageUrl: true } } },
          },
        },
      }),
      this.prisma.diagnosisConversation.findMany({
        where: { userId },
        select: {
          id: true,
          messages: { select: { imageUrl: true } },
        },
      }),
      this.prisma.communityPost.findMany({
        where: { authorId: userId },
        select: { imageUrl: true },
      }),
    ]);

    const mediaUrls = new Set<string>();
    const remember = (url: string | null | undefined) => {
      if (url) mediaUrls.add(url);
    };
    for (const plant of plants) {
      remember(plant.imageUrl);
      plant.journalEntries.forEach((entry) => remember(entry.photoUrl));
      plant.progressEntries.forEach((entry) => remember(entry.photoUrl));
      plant.diagnoses.forEach((diagnosis) => remember(diagnosis.imageUrl));
      plant.diagnosisConversations.forEach((conversation) =>
        conversation.messages.forEach((message) => remember(message.imageUrl)),
      );
    }
    conversations.forEach((conversation) =>
      conversation.messages.forEach((message) => remember(message.imageUrl)),
    );
    posts.forEach((post) => remember(post.imageUrl));

    await this.billing.stopSubscriptionsForAccountDeletion(userId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await transaction.diagnosisConversation.deleteMany({ where: { userId } });
      await transaction.user.delete({ where: { id: userId } });
    });
    await Promise.all(
      [...mediaUrls].map((url) => this.upload.deleteByUrl(url).catch(() => {})),
    );
    return { deleted: true };
  }
}
