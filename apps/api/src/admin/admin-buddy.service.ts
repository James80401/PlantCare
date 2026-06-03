import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ItemCategory, ItemUnlockType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BUDDY_LEVEL_THRESHOLDS,
  buddyLevelProgress,
  levelRequiredForShopTier,
} from '../buddy/constants/leveling';
import { formatBuddy } from '../buddy/buddy.utils';

@Injectable()
export class AdminBuddyService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [buddies, items] = await Promise.all([
      this.prisma.buddy.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              accountApprovalStatus: true,
            },
          },
          inventory: {
            include: { item: true },
            orderBy: { acquiredAt: 'desc' },
          },
          journeys: {
            where: { completed: false },
            take: 1,
          },
        },
      }),
      this.prisma.shopItem.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      }),
    ]);

    return {
      maxLevel: BUDDY_LEVEL_THRESHOLDS.length,
      catalog: items.map((item) => this.formatShopItem(item)),
      buddies: buddies.map((buddy) => ({
        user: buddy.user,
        buddy: formatBuddy(buddy),
        inventory: buddy.inventory.map((row) => ({
          itemId: row.itemId,
          acquiredAt: row.acquiredAt,
          acquireMethod: row.acquireMethod,
          item: this.formatShopItem(row.item),
        })),
      })),
    };
  }

  async setLevel(buddyId: string, level: number) {
    if (level < 1 || level > BUDDY_LEVEL_THRESHOLDS.length) {
      throw new BadRequestException(`Level must be between 1 and ${BUDDY_LEVEL_THRESHOLDS.length}`);
    }
    await this.requireBuddy(buddyId);
    const experiencePoints = BUDDY_LEVEL_THRESHOLDS[level - 1] ?? 0;
    const buddy = await this.prisma.buddy.update({
      where: { id: buddyId },
      data: { experiencePoints },
      include: {
        journeys: {
          where: { completed: false },
          take: 1,
        },
      },
    });
    return {
      message: `Buddy set to level ${level}`,
      buddy: formatBuddy(buddy),
      levelProgress: buddyLevelProgress(buddy.experiencePoints),
    };
  }

  async unlockItem(buddyId: string, itemId: string) {
    await this.requireBuddy(buddyId);
    const item = await this.requireItem(itemId);
    await this.prisma.buddyInventory.upsert({
      where: { buddyId_itemId: { buddyId, itemId } },
      update: { acquireMethod: 'admin' },
      create: { buddyId, itemId, acquireMethod: 'admin' },
    });
    return {
      message: 'Item unlocked',
      buddyId,
      item: this.formatShopItem(item),
    };
  }

  async lockItem(buddyId: string, itemId: string) {
    const buddy = await this.requireBuddy(buddyId);
    const item = await this.requireItem(itemId);

    await this.prisma.$transaction(async (tx) => {
      await tx.buddyInventory.deleteMany({ where: { buddyId, itemId } });

      const equipped = this.removeItemFromJsonObject(buddy.equippedItems, itemId);
      const layout = this.removeItemFromJsonObject(buddy.terrariumLayout, itemId);
      const backgroundItemId = this.backgroundItemId(buddy.terrariumBackground);
      await tx.buddy.update({
        where: { id: buddyId },
        data: {
          equippedItems: JSON.stringify(equipped),
          terrariumLayout: JSON.stringify(layout),
          ...(backgroundItemId === itemId ? { terrariumBackground: 'sunny_windowsill' } : {}),
        },
      });
    });

    return {
      message: 'Item locked',
      buddyId,
      item: this.formatShopItem(item),
    };
  }

  private async requireBuddy(buddyId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { id: buddyId } });
    if (!buddy) throw new NotFoundException('Buddy not found');
    return buddy;
  }

  private async requireItem(itemId: string) {
    const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) throw new NotFoundException('Shop item not found');
    return item;
  }

  private removeItemFromJsonObject(value: unknown, itemId: string): Record<string, unknown> {
    const parsed =
      value && typeof value === 'object' && !Array.isArray(value)
        ? { ...(value as Record<string, unknown>) }
        : typeof value === 'string'
          ? this.parseJsonObject(value)
          : {};

    for (const [key, raw] of Object.entries(parsed)) {
      if (raw === itemId) delete parsed[key];
    }
    return parsed;
  }

  private parseJsonObject(value: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }

  private backgroundItemId(terrariumBackground: string): string {
    if (terrariumBackground.startsWith('bg_')) return terrariumBackground;
    return `bg_${terrariumBackground}`;
  }

  private formatShopItem(item: {
    id: string;
    name: string;
    description: string;
    category: ItemCategory;
    tier: number;
    cost: number;
    bloomTokenCost: number;
    seasonalEventId: string | null;
    requiresPremium: boolean;
    speciesLocked: string | null;
    unlockType: ItemUnlockType;
    imageKey: string;
    sortOrder: number;
  }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      tier: item.tier,
      cost: item.cost,
      bloomTokenCost: item.bloomTokenCost,
      seasonalEventId: item.seasonalEventId,
      requiresPremium: item.requiresPremium,
      speciesLocked: item.speciesLocked,
      unlockType: item.unlockType,
      imageKey: item.imageKey,
      sortOrder: item.sortOrder,
      levelRequired: levelRequiredForShopTier(item.tier),
    };
  }
}
