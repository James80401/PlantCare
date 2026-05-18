import { canCompleteSharedTask, canViewGarden, parseGardenRole } from './garden-authz';

type SharedPlant = {
  userId: string;
  shares: Array<{
    canComplete: boolean;
    garden: { members: Array<{ userId: string; role: string }> };
  }>;
};

export function userCanViewPlantTasks(userId: string, plant: SharedPlant) {
  if (plant.userId === userId) return true;
  for (const share of plant.shares) {
    const member = share.garden.members.find((m) => m.userId === userId);
    const role = member ? parseGardenRole(member.role) : null;
    if (role && canViewGarden(role)) return true;
  }
  return false;
}

export function userCanCompletePlantTask(userId: string, plant: SharedPlant) {
  if (plant.userId === userId) return true;
  for (const share of plant.shares) {
    const member = share.garden.members.find((m) => m.userId === userId);
    const role = member ? parseGardenRole(member.role) : null;
    if (role && canCompleteSharedTask(role, share)) return true;
  }
  return false;
}

export const sharedPlantInclude = {
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
