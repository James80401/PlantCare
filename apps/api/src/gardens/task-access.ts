import {
  canCompleteSharedTask,
  canEditGarden,
  canJournalSharedPlant,
  canViewGarden,
  parseGardenRole,
} from './garden-authz';

type GardenMembers = { members: Array<{ userId: string; role: string }> };

type SharedPlant = {
  userId: string;
  // Home garden the plant belongs to (primary container). Optional in the type so older
  // includes still type-check, but always present at runtime via sharedPlantInclude.
  garden?: GardenMembers | null;
  shares: Array<{
    canComplete: boolean;
    canJournal: boolean;
    garden: GardenMembers;
  }>;
};

function memberRole(garden: GardenMembers | null | undefined, userId: string) {
  const member = garden?.members.find((m) => m.userId === userId);
  return member ? parseGardenRole(member.role) : null;
}

export function userCanViewPlantTasks(userId: string, plant: SharedPlant) {
  if (plant.userId === userId) return true;
  // Home-garden members can view.
  const homeRole = memberRole(plant.garden, userId);
  if (homeRole && canViewGarden(homeRole)) return true;
  // Shared-into-garden members can view.
  for (const share of plant.shares) {
    const role = memberRole(share.garden, userId);
    if (role && canViewGarden(role)) return true;
  }
  return false;
}

export function userCanCompletePlantTask(userId: string, plant: SharedPlant) {
  if (plant.userId === userId) return true;
  // Home-garden owners/caretakers can complete tasks.
  const homeRole = memberRole(plant.garden, userId);
  if (homeRole && canEditGarden(homeRole)) return true;
  // Shared-into-garden members per their share permissions.
  for (const share of plant.shares) {
    const role = memberRole(share.garden, userId);
    if (role && canCompleteSharedTask(role, share)) return true;
  }
  return false;
}

export function userCanJournalPlant(userId: string, plant: SharedPlant) {
  if (plant.userId === userId) return true;
  // Home-garden owners/caretakers can journal.
  const homeRole = memberRole(plant.garden, userId);
  if (homeRole && canEditGarden(homeRole)) return true;
  // Shared-into-garden members per their share permissions.
  for (const share of plant.shares) {
    const role = memberRole(share.garden, userId);
    if (role && canJournalSharedPlant(role, share)) return true;
  }
  return false;
}

export const sharedPlantInclude = {
  garden: {
    select: {
      id: true,
      name: true,
      members: { select: { userId: true, role: true } },
    },
  },
  shares: {
    include: {
      garden: {
        include: {
          members: { select: { userId: true, role: true } },
        },
      },
    },
  },
} as const;
