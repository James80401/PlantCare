import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { parseJsonObject } from './buddy.utils';
import {
  FRIENDSHIP_LEVEL_NAMES,
  levelFromPoints,
  levelUpBonus,
} from './constants/friendship-levels';
import { AddFriendDto } from './dto/add-friend.dto';
import { SunshineSentEvent } from './events/sunshine-sent.event';

const SUNSHINE_DEWDROPS = 3;

@Injectable()
export class BuddySocialService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async listFriends(userId: string) {
    const buddy = await this.requireBuddy(userId);
    const rows = await this.prisma.buddyFriendship.findMany({
      where: { fromBuddyId: buddy.id, isActive: true },
      include: {
        toBuddy: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });

    return rows.map((row) => this.formatFriendCard(row, buddy.id));
  }

  async addFriend(userId: string, dto: AddFriendDto) {
    const buddy = await this.requireBuddy(userId);
    const code = dto.gardenCode.trim().toUpperCase();

    const target = await this.prisma.buddy.findUnique({
      where: { gardenCode: code },
      include: { user: { select: { name: true } } },
    });
    if (!target) throw new NotFoundException('No buddy found for that garden code');
    if (target.id === buddy.id) {
      throw new BadRequestException('You cannot add yourself');
    }

    const existing = await this.prisma.buddyFriendship.findFirst({
      where: {
        fromBuddyId: buddy.id,
        toBuddyId: target.id,
        isActive: true,
      },
    });
    if (existing) throw new ConflictException('Already friends');

    await this.prisma.$transaction([
      this.prisma.buddyFriendship.create({
        data: { fromBuddyId: buddy.id, toBuddyId: target.id },
      }),
      this.prisma.buddyFriendship.create({
        data: { fromBuddyId: target.id, toBuddyId: buddy.id },
      }),
    ]);

    const row = await this.prisma.buddyFriendship.findFirst({
      where: { fromBuddyId: buddy.id, toBuddyId: target.id },
      include: { toBuddy: { include: { user: { select: { name: true } } } } },
    });

    return {
      friend: row ? this.formatFriendCard(row, buddy.id) : null,
      message: `Connected with ${target.user.name ?? target.name}'s garden!`,
    };
  }

  async removeFriend(userId: string, friendBuddyId: string) {
    const buddy = await this.requireBuddy(userId);
    const updated = await this.prisma.buddyFriendship.updateMany({
      where: {
        isActive: true,
        OR: [
          { fromBuddyId: buddy.id, toBuddyId: friendBuddyId },
          { fromBuddyId: friendBuddyId, toBuddyId: buddy.id },
        ],
      },
      data: { isActive: false },
    });
    if (updated.count === 0) throw new NotFoundException('Friendship not found');
    return { removed: true };
  }

  async sendSunshine(userId: string, friendBuddyId: string) {
    const buddy = await this.requireBuddy(userId);
    const friendship = await this.prisma.buddyFriendship.findFirst({
      where: { fromBuddyId: buddy.id, toBuddyId: friendBuddyId, isActive: true },
      include: { toBuddy: { include: { user: true } } },
    });
    if (!friendship?.toBuddy) throw new NotFoundException('Friend not found');

    const today = startOfDay(new Date());
    if (
      friendship.lastSunshineSentAt &&
      startOfDay(friendship.lastSunshineSentAt).getTime() === today.getTime()
    ) {
      throw new HttpException('Already sent sunshine today', HttpStatus.TOO_MANY_REQUESTS);
    }

    const pointGain = buddy.speciesId === 'fern' ? 2 : 1;
    const newPoints = friendship.points + pointGain;
    const previousLevel = friendship.level;
    const newLevel = levelFromPoints(newPoints);
    const bonus = levelUpBonus(previousLevel, newLevel);

    await this.prisma.$transaction(async (tx) => {
      await tx.buddyFriendship.updateMany({
        where: {
          isActive: true,
          OR: [
            { fromBuddyId: buddy.id, toBuddyId: friendBuddyId },
            { fromBuddyId: friendBuddyId, toBuddyId: buddy.id },
          ],
        },
        data: { points: newPoints, level: newLevel },
      });

      await tx.buddyFriendship.update({
        where: { id: friendship.id },
        data: {
          lastSunshineSentAt: new Date(),
          totalSunshineSent: { increment: 1 },
        },
      });

      await tx.buddy.update({
        where: { id: buddy.id },
        data: { dewdrops: { increment: SUNSHINE_DEWDROPS + bonus } },
      });
      await tx.buddy.update({
        where: { id: friendBuddyId },
        data: { dewdrops: { increment: SUNSHINE_DEWDROPS } },
      });

      await tx.sunshineEvent.create({
        data: {
          fromUserId: userId,
          toUserId: friendship.toBuddy.userId,
          fromBuddyId: buddy.id,
          toBuddyId: friendBuddyId,
          dewdropsAwarded: SUNSHINE_DEWDROPS,
        },
      });
    });

    this.events.emit(
      'sunshine.sent',
      new SunshineSentEvent(userId, friendBuddyId, friendship.toBuddy.userId, buddy.id),
    );

    return {
      success: true,
      dewdropsAwarded: SUNSHINE_DEWDROPS,
      bonusDewdrops: bonus,
      friendshipPoints: newPoints,
      newFriendshipLevel: newLevel > previousLevel ? newLevel : null,
      levelName: FRIENDSHIP_LEVEL_NAMES[newLevel],
    };
  }

  async sunshineToday(userId: string) {
    const buddy = await this.requireBuddy(userId);
    const today = startOfDay(new Date());

    const sentRows = await this.prisma.buddyFriendship.findMany({
      where: {
        fromBuddyId: buddy.id,
        isActive: true,
        lastSunshineSentAt: { gte: today },
      },
      select: { toBuddyId: true },
    });

    const receivedCount = await this.prisma.sunshineEvent.count({
      where: { toUserId: userId, sentAt: { gte: today } },
    });

    return {
      sent: sentRows.map((r) => r.toBuddyId),
      received: receivedCount,
    };
  }

  async viewTerrarium(userId: string, friendBuddyId: string) {
    const buddy = await this.requireBuddy(userId);
    const linked = await this.prisma.buddyFriendship.findFirst({
      where: {
        fromBuddyId: buddy.id,
        toBuddyId: friendBuddyId,
        isActive: true,
      },
    });
    if (!linked) throw new NotFoundException('Friend not found');

    const friend = await this.prisma.buddy.findUnique({
      where: { id: friendBuddyId },
      include: { user: { select: { name: true } } },
    });
    if (!friend) throw new NotFoundException('Buddy not found');

    const sunshineToday = await this.sunshineToday(userId);
    const canSendSunshine = !sunshineToday.sent.includes(friendBuddyId);

    return {
      ownerName: friend.user.name,
      canSendSunshine,
      buddy: {
        id: friend.id,
        name: friend.name,
        speciesId: friend.speciesId,
        growthStage: friend.growthStage,
        mood: friend.mood,
        equippedItems: parseJsonObject(friend.equippedItems),
        terrariumLayout: parseJsonObject(friend.terrariumLayout),
        terrariumBackground: friend.terrariumBackground,
        lastActiveDate: friend.showLastActive ? friend.lastActiveDate : null,
      },
    };
  }

  async activityFeed(userId: string) {
    const buddy = await this.requireBuddy(userId);
    const friendBuddyIds = await this.prisma.buddyFriendship.findMany({
      where: { fromBuddyId: buddy.id, isActive: true },
      select: { toBuddyId: true },
    });
    const friendUserIds = await this.prisma.buddy.findMany({
      where: { id: { in: friendBuddyIds.map((f) => f.toBuddyId) } },
      select: { userId: true, name: true },
    });
    const userIds = [userId, ...friendUserIds.map((f) => f.userId)];

    const events = await this.prisma.sunshineEvent.findMany({
      where: {
        OR: [{ fromUserId: { in: userIds } }, { toUserId: userId }],
      },
      orderBy: { sentAt: 'desc' },
      take: 30,
    });

    const buddyNames = new Map(
      (
        await this.prisma.buddy.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, name: true, speciesId: true },
        })
      ).map((b) => [b.userId, b]),
    );

    return events.map((e) => {
      const sender = buddyNames.get(e.fromUserId);
      const isMine = e.fromUserId === userId;
      return {
        id: e.id,
        type: 'sunshine' as const,
        sentAt: e.sentAt,
        message: isMine
          ? `You sent sunshine to a garden friend ☀️`
          : `${sender?.name ?? 'A friend'}'s buddy sent you sunshine ☀️`,
        dewdropsAwarded: e.dewdropsAwarded,
      };
    });
  }

  private async requireBuddy(userId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');
    return buddy;
  }

  private formatFriendCard(
    row: {
      id: string;
      level: number;
      points: number;
      lastSunshineSentAt: Date | null;
      toBuddy: {
        id: string;
        name: string;
        speciesId: string;
        growthStage: string;
        mood: string;
        lastActiveDate: Date | null;
        showLastActive: boolean;
        user: { name: string | null };
      };
    },
    myBuddyId: string,
  ) {
    const today = startOfDay(new Date());
    const sunshineSentToday = Boolean(
      row.lastSunshineSentAt &&
        startOfDay(row.lastSunshineSentAt).getTime() === today.getTime(),
    );

    return {
      friendshipId: row.id,
      friendBuddyId: row.toBuddy.id,
      buddyName: row.toBuddy.name,
      ownerName: row.toBuddy.user.name,
      speciesId: row.toBuddy.speciesId,
      growthStage: row.toBuddy.growthStage,
      mood: row.toBuddy.mood,
      level: row.level,
      levelName: FRIENDSHIP_LEVEL_NAMES[row.level] ?? 'Neighbors',
      points: row.points,
      sunshineSentToday,
      lastActiveLabel: this.lastActiveLabel(
        row.toBuddy.lastActiveDate,
        row.toBuddy.showLastActive,
      ),
    };
  }

  private lastActiveLabel(lastActive: Date | null, show: boolean): string {
    if (!show || !lastActive) return 'Active recently';
    const today = startOfDay(new Date());
    const last = startOfDay(lastActive);
    const days = Math.floor((today.getTime() - last.getTime()) / 86400000);
    if (days === 0) return 'Active today';
    if (days === 1) return 'Active yesterday';
    return `Active ${days} days ago`;
  }
}
