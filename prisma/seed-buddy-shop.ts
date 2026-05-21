import { PrismaClient } from '@prisma/client';
import {
  BUDDY_SPECIES_SEED,
  SHOP_ITEMS_SEED,
} from '../apps/api/src/buddy/constants/shop-seed-data';

export async function seedBuddyShop(prisma: PrismaClient) {
  for (const item of SHOP_ITEMS_SEED) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        tier: item.tier,
        cost: item.cost,
        requiresPremium: item.requiresPremium ?? false,
        speciesLocked: item.speciesLocked ?? null,
        unlockType: item.unlockType ?? 'PURCHASE',
        imageKey: item.imageKey,
        isActive: true,
        sortOrder: item.sortOrder,
      },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        tier: item.tier,
        cost: item.cost,
        requiresPremium: item.requiresPremium ?? false,
        speciesLocked: item.speciesLocked ?? null,
        unlockType: item.unlockType ?? 'PURCHASE',
        imageKey: item.imageKey,
        sortOrder: item.sortOrder,
      },
    });
  }

  for (const sp of BUDDY_SPECIES_SEED) {
    await prisma.buddySpecies.upsert({
      where: { id: sp.id },
      update: {
        displayName: sp.displayName,
        description: sp.description,
        emoji: sp.emoji,
        unlockType: sp.unlockType,
        unlockValue: sp.unlockValue ?? null,
        isDefault: sp.isDefault ?? false,
        sortOrder: sp.sortOrder,
      },
      create: {
        id: sp.id,
        displayName: sp.displayName,
        description: sp.description,
        emoji: sp.emoji,
        unlockType: sp.unlockType,
        unlockValue: sp.unlockValue ?? null,
        isDefault: sp.isDefault ?? false,
        sortOrder: sp.sortOrder,
      },
    });
  }

  const itemCount = await prisma.shopItem.count();
  const speciesCount = await prisma.buddySpecies.count();
  console.log(`Buddy shop: ${itemCount} items, ${speciesCount} species in catalog.`);
}
