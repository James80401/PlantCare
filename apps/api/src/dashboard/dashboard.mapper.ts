import type { TaskLike } from './dashboard-helpers';

export type DashboardTaskDto = {
  id: string;
  taskType: string;
  dueDate: string;
  status: string;
  completedAt: string | null;
  plant: {
    id: string;
    nickname: string | null;
    imageUrl: string | null;
    species: { commonName: string };
  };
};

export type DashboardPlantDto = {
  id: string;
  nickname: string | null;
  imageUrl: string | null;
  createdAt: string;
  location: string | null;
  species: {
    commonName: string;
    scientificName: string | null;
    sunlight: string | null;
    wateringFreqDays: number;
  };
  tasks: Array<{ dueDate: string; taskType: string; status: string }>;
  unresolvedDiagnosis: { resultLabel: string; createdAt: string } | null;
};

export type DashboardSharedPlantDto = DashboardPlantDto & {
  shared: true;
  gardenId: string;
  gardenName: string;
  memberRole: string;
  canComplete: boolean;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return typeof value === 'string' ? value : value.toISOString();
}

export function mapDashboardTask(task: TaskLike): DashboardTaskDto {
  return {
    id: task.id,
    taskType: task.taskType,
    dueDate: toIso(task.dueDate)!,
    status: task.status,
    completedAt: toIso(task.completedAt ?? null),
    plant: {
      id: task.plant.id,
      nickname: task.plant.nickname ?? null,
      imageUrl: task.plant.imageUrl ?? null,
      species: { commonName: task.plant.species.commonName },
    },
  };
}

type PlantRow = {
  id: string;
  nickname: string | null;
  imageUrl: string | null;
  createdAt: Date;
  location: string | null;
  species: {
    commonName: string;
    scientificName: string | null;
    sunlight: string | null;
    wateringFreqDays: number;
  };
  tasks?: Array<{ dueDate: Date; taskType: string; status: string }>;
  diagnoses?: Array<{ resultLabel: string; createdAt: Date }>;
};

export function mapDashboardPlant(plant: PlantRow): DashboardPlantDto {
  const nextTask = plant.tasks?.[0];
  return {
    id: plant.id,
    nickname: plant.nickname,
    imageUrl: plant.imageUrl,
    createdAt: plant.createdAt.toISOString(),
    location: plant.location,
    species: {
      commonName: plant.species.commonName,
      scientificName: plant.species.scientificName,
      sunlight: plant.species.sunlight,
      wateringFreqDays: plant.species.wateringFreqDays,
    },
    tasks: nextTask
      ? [
          {
            dueDate: nextTask.dueDate.toISOString(),
            taskType: nextTask.taskType,
            status: nextTask.status,
          },
        ]
      : [],
    unresolvedDiagnosis: plant.diagnoses?.[0]
      ? {
          resultLabel: plant.diagnoses[0].resultLabel,
          createdAt: plant.diagnoses[0].createdAt.toISOString(),
        }
      : null,
  };
}

export function mapSharedPlantsForUser(
  gardens: Array<{
    id: string;
    name: string;
    ownerId: string;
    members: Array<{ userId: string; role: string }>;
    plants: Array<{
      canComplete: boolean;
      plant: PlantRow & {
        userId: string;
        species: PlantRow['species'] & { defaultImageUrl?: string | null };
      };
    }>;
  }>,
  userId: string,
): DashboardSharedPlantDto[] {
  const seen = new Set<string>();
  const items: DashboardSharedPlantDto[] = [];

  for (const garden of gardens) {
    if (garden.ownerId === userId) continue;
    const memberRole =
      garden.members.find((member) => member.userId === userId)?.role ?? 'VIEWER';

    for (const share of garden.plants) {
      const { plant } = share;
      if (plant.userId === userId || seen.has(plant.id)) continue;
      seen.add(plant.id);
      const mapped = mapDashboardPlant({
        ...plant,
        imageUrl: plant.imageUrl ?? plant.species.defaultImageUrl ?? null,
      });
      items.push({
        ...mapped,
        shared: true,
        gardenId: garden.id,
        gardenName: garden.name,
        memberRole,
        canComplete: share.canComplete,
      });
    }
  }

  return items;
}
