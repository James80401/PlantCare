import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getActiveSeasonalEvent } from './constants/seasonal-events';

@Injectable()
export class BuddySeasonalService {
  constructor(private prisma: PrismaService) {}

  getActiveEvent(at = new Date()) {
    const event = getActiveSeasonalEvent(at);
    if (!event) return { active: false as const };

    return {
      active: true as const,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        emoji: event.emoji,
        shopItemIds: event.shopItemIds,
      },
    };
  }

  async getStatus(userId: string) {
    const base = this.getActiveEvent();
    if (!base.active) return base;

    const items = await this.prisma.shopItem.findMany({
      where: { id: { in: base.event.shopItemIds }, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      ...base,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        cost: item.cost,
        bloomTokenCost: item.bloomTokenCost,
        category: item.category,
      })),
    };
  }
}
