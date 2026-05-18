import type { DashboardPlant } from './dashboard';
import type { GardenSummary, PlantShareSummary } from '../services/api';

export interface SharedPlantView extends DashboardPlant {
  shared: true;
  gardenId: string;
  gardenName: string;
  memberRole: string;
  canComplete: boolean;
}

export function plantsSharedWithUser(
  gardens: GardenSummary[],
  userId: string,
): SharedPlantView[] {
  const seen = new Set<string>();
  const items: SharedPlantView[] = [];

  for (const garden of gardens) {
    if (garden.ownerId === userId) continue;
    const memberRole =
      garden.members.find((member) => member.userId === userId)?.role ?? 'VIEWER';

    for (const share of garden.plants) {
      if (share.plant.userId === userId || seen.has(share.plant.id)) continue;
      seen.add(share.plant.id);
      items.push(mapShareToPlantView(share, garden.id, garden.name, memberRole));
    }
  }

  return items;
}

function mapShareToPlantView(
  share: PlantShareSummary,
  gardenId: string,
  gardenName: string,
  memberRole: string,
): SharedPlantView {
  const { plant } = share;
  return {
    id: plant.id,
    nickname: plant.nickname,
    imageUrl: plant.imageUrl ?? plant.species.defaultImageUrl ?? null,
    location: plant.location,
    species: plant.species,
    tasks: [],
    shared: true,
    gardenId,
    gardenName,
    memberRole,
    canComplete: share.canComplete,
  };
}

export function formatActivityLabel(type: string, payloadJson: string) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  switch (type) {
    case 'GARDEN_CREATED':
      return `Created household “${payload.name ?? 'Garden'}”`;
    case 'INVITE_CREATED':
      return `Sent a ${String(payload.role ?? 'member').toLowerCase()} invite`;
    case 'INVITE_ACCEPTED':
      return `Joined as ${String(payload.role ?? 'member').toLowerCase()}`;
    case 'PLANT_SHARED':
      return 'Shared a plant with the household';
    case 'TASK_COMPLETED':
      return 'Completed a shared care task';
    default:
      return type.replace(/_/g, ' ').toLowerCase();
  }
}
