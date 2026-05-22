import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { ItemCategory, ItemUnlockType } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  EQUIP_SLOT_CATEGORY,
  stageMeetsTier,
} from './constants/shop-seed-data';
import { isSeasonalItemAvailable } from './constants/seasonal-events';
import { PurchaseItemDto } from './dto/purchase-item.dto';

const DEFAULT_SPECIES_COLOR: Record<string, string> = {
  monstera: 'color_monstera_natural',
  cactus: 'color_cactus_natural',
};

@Injectable()
export class BuddyShopService {
  constructor(private prisma: PrismaService) {}

  async ensureInventory(buddyId: string, speciesId: string) {
    const count = await this.prisma.buddyInventory.count({ where: { buddyId } });
    if (count === 0) {
      await this.grantDefaultInventory(buddyId, speciesId);
    }
  }

  async getCatalog(userId: string) {
    const buddy = await this.requireBuddy(userId);
    await this.ensureInventory(buddy.id, buddy.speciesId);
    const isPremium = await this.userIsPremium(userId);
    const ownedIds = await this.ownedItemIds(buddy.id);
    const items = await this.prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    return {
      dewdrops: buddy.dewdrops,
      bloomTokens: buddy.bloomTokens,
      bloomTokensEnabled: buddy.speciesId === 'rose',
      growthStage: buddy.growthStage,
      speciesId: buddy.speciesId,
      items: items.map((item) => ({
        ...this.formatShopItem(item),
        owned: ownedIds.has(item.id),
        canPurchase: this.canPurchaseItem(item, buddy, ownedIds, isPremium),
        requiresPremium: item.requiresPremium,
        lockedReason: this.purchaseLockReason(item, buddy, ownedIds, isPremium),
      })),
    };
  }

  async getDailyRotation(userId: string) {
    const buddy = await this.requireBuddy(userId);
    const isPremium = await this.userIsPremium(userId);
    const ownedIds = await this.ownedItemIds(buddy.id);
    const purchasable = await this.prisma.shopItem.findMany({
      where: {
        isActive: true,
        unlockType: ItemUnlockType.PURCHASE,
        cost: { gt: 0 },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const dayKey = new Date().toISOString().slice(0, 10);
    const picks = this.pickDailyItems(purchasable.map((i) => i.id), dayKey, 4);
    const items = purchasable.filter((i) => picks.includes(i.id));

    return {
      date: dayKey,
      dewdrops: buddy.dewdrops,
      items: items.map((item) => ({
        ...this.formatShopItem(item),
        owned: ownedIds.has(item.id),
        canPurchase: this.canPurchaseItem(item, buddy, ownedIds, isPremium),
        requiresPremium: item.requiresPremium,
        lockedReason: this.purchaseLockReason(item, buddy, ownedIds, isPremium),
      })),
    };
  }

  async getInventory(userId: string) {
    const buddy = await this.requireBuddy(userId);
    await this.ensureInventory(buddy.id, buddy.speciesId);
    const rows = await this.prisma.buddyInventory.findMany({
      where: { buddyId: buddy.id },
      include: { item: true },
      orderBy: { acquiredAt: 'desc' },
    });

    return {
      items: rows.map((row) => ({
        itemId: row.itemId,
        acquiredAt: row.acquiredAt,
        acquireMethod: row.acquireMethod,
        ...this.formatShopItem(row.item),
      })),
    };
  }

  async getSpecies(userId: string) {
    const buddy = await this.requireBuddy(userId);
    const species = await this.prisma.buddySpecies.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const unlocked = new Set(this.parseUnlockedSpecies(buddy.unlockedSpecies));

    return {
      currentSpeciesId: buddy.speciesId,
      species: species.map((sp) => ({
        id: sp.id,
        displayName: sp.displayName,
        description: sp.description,
        emoji: sp.emoji,
        unlockType: sp.unlockType,
        unlockValue: sp.unlockValue,
        unlocked: unlocked.has(sp.id) || this.speciesUnlockMet(sp, buddy),
        selected: sp.id === buddy.speciesId,
      })),
    };
  }

  async purchase(userId: string, dto: PurchaseItemDto) {
    const buddy = await this.requireBuddy(userId);
    const item = await this.prisma.shopItem.findUnique({ where: { id: dto.itemId } });
    if (!item || !item.isActive) throw new NotFoundException('Shop item not found');

    const ownedIds = await this.ownedItemIds(buddy.id);
    if (ownedIds.has(item.id)) throw new ConflictException('You already own this item');
    if (item.requiresPremium && !(await this.userIsPremium(userId))) {
      throw new ForbiddenException('Premium subscription required for this item');
    }
    if (!this.canPurchaseItem(item, buddy, ownedIds, await this.userIsPremium(userId))) {
      throw new BadRequestException('This item cannot be purchased right now');
    }
    const usesBloom = item.bloomTokenCost > 0;
    if (usesBloom) {
      if (buddy.speciesId !== 'rose') {
        throw new BadRequestException('Bloom Token items are for Rose buddies only');
      }
      if (buddy.bloomTokens < item.bloomTokenCost) {
        throw new BadRequestException('Not enough Bloom Tokens');
      }
    } else if (buddy.dewdrops < item.cost) {
      throw new BadRequestException('Not enough dewdrops');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.buddyInventory.create({
        data: {
          buddyId: buddy.id,
          itemId: item.id,
          acquireMethod: usesBloom ? 'bloom_token' : 'purchase',
        },
      });
      return tx.buddy.update({
        where: { id: buddy.id },
        data: usesBloom
          ? { bloomTokens: { decrement: item.bloomTokenCost } }
          : { dewdrops: { decrement: item.cost } },
      });
    });

    return {
      item: this.formatShopItem(item),
      dewdrops: updated.dewdrops,
      bloomTokens: updated.bloomTokens,
    };
  }

  async grantDefaultInventory(buddyId: string, speciesId: string) {
    const defaults = await this.prisma.shopItem.findMany({
      where: {
        isActive: true,
        OR: [
          { unlockType: ItemUnlockType.DEFAULT_ITEM },
          { cost: 0, unlockType: ItemUnlockType.PURCHASE },
        ],
      },
    });

    const toGrant = defaults.filter((item) => {
      if (item.speciesLocked && item.speciesLocked !== speciesId) return false;
      if (item.category === ItemCategory.BODY_COLOR) {
        const expected = DEFAULT_SPECIES_COLOR[speciesId];
        if (expected) return item.id === expected;
        return item.unlockType === ItemUnlockType.DEFAULT_ITEM && !item.speciesLocked;
      }
      return true;
    });

    for (const item of toGrant) {
      await this.prisma.buddyInventory.upsert({
        where: { buddyId_itemId: { buddyId, itemId: item.id } },
        update: {},
        create: {
          buddyId,
          itemId: item.id,
          acquireMethod: 'default',
        },
      });
    }
  }

  defaultEquippedForSpecies(speciesId: string): Record<string, string> {
    const equipped: Record<string, string> = {
      potSkin: 'pot_terra_cotta',
      bodyPattern: 'pattern_none',
    };
    const color = DEFAULT_SPECIES_COLOR[speciesId];
    if (color) equipped.bodyColor = color;
    return equipped;
  }

  backgroundItemId(terrariumBackground: string): string {
    if (terrariumBackground.startsWith('bg_')) return terrariumBackground;
    return `bg_${terrariumBackground}`;
  }

  terrariumKeyFromItem(itemId: string): string {
    if (itemId.startsWith('bg_')) return itemId.slice(3);
    return itemId;
  }

  async validateEquipped(
    buddyId: string,
    speciesId: string,
    growthStage: string,
    equipped: Record<string, unknown>,
  ) {
    const ownedIds = await this.ownedItemIds(buddyId);
    for (const [slot, rawId] of Object.entries(equipped)) {
      if (rawId === null || rawId === undefined || rawId === '') continue;
      const itemId = String(rawId);
      const expectedCategory = EQUIP_SLOT_CATEGORY[slot];
      if (!expectedCategory) {
        throw new BadRequestException(`Unknown equip slot: ${slot}`);
      }
      if (!ownedIds.has(itemId)) {
        throw new BadRequestException(`You do not own item ${itemId}`);
      }
      const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });
      if (!item || item.category !== expectedCategory) {
        throw new BadRequestException(`Item ${itemId} does not fit slot ${slot}`);
      }
      if (item.speciesLocked && item.speciesLocked !== speciesId) {
        throw new BadRequestException('Item is locked to another species');
      }
      if (!stageMeetsTier(growthStage, item.tier)) {
        throw new BadRequestException('Buddy growth stage is too low for this item');
      }
    }
  }

  async validateTerrariumBackground(buddyId: string, background: string) {
    if (background === 'sunny_windowsill') return;
    const itemId = this.backgroundItemId(background);
    const ownedIds = await this.ownedItemIds(buddyId);
    if (!ownedIds.has(itemId)) {
      throw new BadRequestException('Background not owned');
    }
  }

  async validateTerrariumLayout(buddyId: string, layout: Record<string, unknown>) {
    const ownedIds = await this.ownedItemIds(buddyId);
    for (const rawId of Object.values(layout)) {
      if (!rawId) continue;
      const itemId = String(rawId);
      if (!ownedIds.has(itemId)) {
        throw new BadRequestException(`You do not own furniture ${itemId}`);
      }
      const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });
      if (!item || item.category !== ItemCategory.FURNITURE) {
        throw new BadRequestException('Invalid terrarium furniture');
      }
    }
  }

  async validateSpeciesChange(
    buddy: { speciesId: string; streakDays: number; journeyCount: number; dewdrops: number },
    speciesId: string,
    unlockedSpeciesRaw: unknown,
  ) {
    const species = await this.prisma.buddySpecies.findUnique({ where: { id: speciesId } });
    if (!species) throw new BadRequestException('Unknown species');

    const unlocked = this.parseUnlockedSpecies(unlockedSpeciesRaw);
    if (!unlocked.includes(speciesId) && !this.speciesUnlockMet(species, buddy)) {
      throw new BadRequestException('Species not unlocked yet');
    }
  }

  speciesUnlockMet(
    species: { unlockType: string; unlockValue: number | null },
    buddy: { streakDays: number; journeyCount: number; dewdrops: number },
  ): boolean {
    switch (species.unlockType) {
      case 'DEFAULT':
        return true;
      case 'STREAK':
        return buddy.streakDays >= (species.unlockValue ?? 0);
      case 'JOURNEY_COUNT':
        return buddy.journeyCount >= (species.unlockValue ?? 0);
      case 'DEWDROPS':
        return buddy.dewdrops >= (species.unlockValue ?? 0);
      default:
        return false;
    }
  }

  private async requireBuddy(userId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');
    return buddy;
  }

  private async ownedItemIds(buddyId: string) {
    const rows = await this.prisma.buddyInventory.findMany({
      where: { buddyId },
      select: { itemId: true },
    });
    return new Set(rows.map((r) => r.itemId));
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
    };
  }

  private async userIsPremium(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true },
    });
    return user?.planTier === PlanTier.PREMIUM;
  }

  private purchaseLockReason(
    item: {
      id: string;
      cost: number;
      bloomTokenCost: number;
      tier: number;
      speciesLocked: string | null;
      unlockType: ItemUnlockType;
      requiresPremium: boolean;
      seasonalEventId: string | null;
    },
    buddy: { growthStage: string; speciesId: string; dewdrops: number; bloomTokens: number },
    ownedIds: Set<string>,
    isPremium: boolean,
  ): 'premium' | 'seasonal' | 'species' | 'stage' | 'funds' | undefined {
    if (ownedIds.has(item.id)) return undefined;
    if (item.requiresPremium && !isPremium) return 'premium';
    if (item.seasonalEventId && !isSeasonalItemAvailable(item.seasonalEventId)) return 'seasonal';
    if (item.speciesLocked && item.speciesLocked !== buddy.speciesId) return 'species';
    if (!stageMeetsTier(buddy.growthStage, item.tier)) return 'stage';
    if (item.bloomTokenCost > 0) {
      if (buddy.speciesId !== 'rose') return 'species';
      if (buddy.bloomTokens < item.bloomTokenCost) return 'funds';
      return undefined;
    }
    if (
      item.unlockType !== ItemUnlockType.PURCHASE &&
      item.unlockType !== ItemUnlockType.SEASONAL_EVENT
    ) {
      return 'stage';
    }
    if (item.cost > 0 && buddy.dewdrops < item.cost) return 'funds';
    return undefined;
  }

  private canPurchaseItem(
    item: {
      id: string;
      cost: number;
      bloomTokenCost: number;
      tier: number;
      speciesLocked: string | null;
      unlockType: ItemUnlockType;
      requiresPremium: boolean;
      seasonalEventId: string | null;
    },
    buddy: { growthStage: string; speciesId: string; dewdrops: number; bloomTokens: number },
    ownedIds: Set<string>,
    isPremium: boolean,
  ) {
    return this.purchaseLockReason(item, buddy, ownedIds, isPremium) === undefined;
  }

  private pickDailyItems(ids: string[], dayKey: string, count: number): string[] {
    if (ids.length === 0) return [];
    const sorted = [...ids].sort((a, b) => {
      const ha = createHash('sha256').update(`${dayKey}:${a}`).digest('hex');
      const hb = createHash('sha256').update(`${dayKey}:${b}`).digest('hex');
      return ha.localeCompare(hb);
    });
    return sorted.slice(0, Math.min(count, sorted.length));
  }

  private parseUnlockedSpecies(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string');
      } catch {
        return [];
      }
    }
    return [];
  }
}
