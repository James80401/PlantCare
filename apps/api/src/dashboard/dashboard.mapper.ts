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

export type DashboardJournalEntryDto = {
  id: string;
  plantId: string;
  plantName: string;
  createdAt: string;
  notePreview: string | null;
  photoUrl: string | null;
  measurements: {
    heightCm: number | null;
    widthCm: number | null;
    leafCount: number | null;
  };
};

export type DashboardDiagnosisSummaryDto = {
  id: string;
  plantId: string;
  plantName: string;
  resultLabel: string;
  confidence: number | null;
  resolved: boolean;
  createdAt: string;
};

export type DashboardRecoveryPlantDto = {
  diagnosisId: string;
  plantId: string;
  plantName: string;
  resultLabel: string;
  createdAt: string;
  actionTo: string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return typeof value === 'string' ? value : value.toISOString();
}

function plantDisplayName(plant: {
  nickname?: string | null;
  species: { commonName: string };
}) {
  return plant.nickname || plant.species.commonName;
}

function truncatePreview(value: string | null | undefined, maxLength = 140) {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
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

export function mapDashboardJournalEntry(entry: {
  id: string;
  plantId: string;
  photoUrl: string | null;
  notes: string | null;
  heightCm: number | null;
  widthCm: number | null;
  leafCount: number | null;
  createdAt: Date;
  plant: {
    nickname: string | null;
    species: { commonName: string };
  };
}): DashboardJournalEntryDto {
  return {
    id: entry.id,
    plantId: entry.plantId,
    plantName: plantDisplayName(entry.plant),
    createdAt: entry.createdAt.toISOString(),
    notePreview: truncatePreview(entry.notes),
    photoUrl: entry.photoUrl,
    measurements: {
      heightCm: entry.heightCm,
      widthCm: entry.widthCm,
      leafCount: entry.leafCount,
    },
  };
}

export function mapDashboardDiagnosisSummary(diagnosis: {
  id: string;
  plantId: string;
  resultLabel: string;
  confidence: number | null;
  resolved: boolean;
  createdAt: Date;
  plant: {
    nickname: string | null;
    species: { commonName: string };
  };
}): DashboardDiagnosisSummaryDto {
  return {
    id: diagnosis.id,
    plantId: diagnosis.plantId,
    plantName: plantDisplayName(diagnosis.plant),
    resultLabel: diagnosis.resultLabel,
    confidence: diagnosis.confidence,
    resolved: diagnosis.resolved,
    createdAt: diagnosis.createdAt.toISOString(),
  };
}

export function mapDashboardRecoveryPlant(diagnosis: {
  id: string;
  plantId: string;
  resultLabel: string;
  createdAt: Date;
  plant: {
    nickname: string | null;
    species: { commonName: string };
  };
}): DashboardRecoveryPlantDto {
  return {
    diagnosisId: diagnosis.id,
    plantId: diagnosis.plantId,
    plantName: plantDisplayName(diagnosis.plant),
    resultLabel: diagnosis.resultLabel,
    createdAt: diagnosis.createdAt.toISOString(),
    actionTo: `/garden/plants/${diagnosis.plantId}/health#dr-plant`,
  };
}
