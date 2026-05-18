import { PotSize, TaskType } from '@prisma/client';
import {
  classifySpeciesForCare,
  growingEnvironmentLabel,
  inferGrowingEnvironment,
  shouldScheduleMist,
  type PlantCategory,
} from '../care-guides/growing-environment';

export interface ScheduleExplanationFactor {
  label: string;
  impact: string;
}

export interface ScheduleExplanation {
  summary: string;
  factors: ScheduleExplanationFactor[];
}

export interface ScheduleExplanationInput {
  taskType: TaskType;
  dueDate: Date;
  plant: {
    location: string | null;
    potSize: PotSize;
    datePlanted: Date | null;
  };
  species: {
    commonName: string;
    scientificName?: string | null;
    careNotes?: string | null;
    wateringFreqDays: number;
  };
  waterIntervalDays: number;
  isGrowingSeason: boolean;
  recentWetSoilSkips?: number;
}

function potLabel(potSize: PotSize): string {
  switch (potSize) {
    case PotSize.SMALL:
      return 'Small pot (dries faster)';
    case PotSize.LARGE:
      return 'Large pot (holds moisture longer)';
    default:
      return 'Medium pot';
  }
}

function isEdibleOrHerb(category: PlantCategory): boolean {
  return category === 'herb' || category === 'vegetable' || category === 'fruit' || category === 'citrus';
}

function isPestProneSpecies(category: PlantCategory): boolean {
  return category !== 'cactus' && category !== 'succulent';
}

function canScheduleRepot(plant: { datePlanted: Date | null }): boolean {
  if (!plant.datePlanted) return true;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return plant.datePlanted <= sixMonthsAgo;
}

function formatDueDate(dueDate: Date): string {
  return dueDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function buildScheduleExplanation(input: ScheduleExplanationInput): ScheduleExplanation {
  const { taskType, dueDate, plant, species, waterIntervalDays, isGrowingSeason } = input;
  const env = inferGrowingEnvironment(plant.location ?? undefined);
  const category = classifySpeciesForCare(species);
  const envLabel = growingEnvironmentLabel(env);
  const factors: ScheduleExplanationFactor[] = [];
  const dueLabel = formatDueDate(dueDate);

  switch (taskType) {
    case TaskType.WATER: {
      factors.push({
        label: 'Species watering cadence',
        impact: `${species.commonName} is cataloged at about every ${species.wateringFreqDays} days.`,
      });
      factors.push({
        label: potLabel(plant.potSize),
        impact: `Your schedule uses roughly every ${waterIntervalDays} days between waterings.`,
      });
      factors.push({
        label: 'Growing environment',
        impact: `${envLabel} at “${plant.location ?? 'your space'}”.`,
      });
      if (input.recentWetSoilSkips && input.recentWetSoilSkips > 0) {
        factors.push({
          label: 'Recent skip feedback',
          impact: `You marked soil still wet ${input.recentWetSoilSkips} time(s) recently — check schedule suggestions on the dashboard.`,
        });
      }
      return {
        summary: `Watering is due ${dueLabel}, about every ${waterIntervalDays} days for this plant.`,
        factors,
      };
    }

    case TaskType.FERTILIZE: {
      factors.push({
        label: 'Growing season',
        impact: isGrowingSeason
          ? 'April–September: active growth window for most plants.'
          : 'Outside peak season — fewer fertilizer tasks are generated.',
      });
      factors.push({
        label: 'Cadence',
        impact: 'Feed about every 30 days during the growing season.',
      });
      factors.push({
        label: 'Species',
        impact: `${species.commonName} (${category}) — pause if the plant is dormant or in low light.`,
      });
      return {
        summary: `Fertilizer is due ${dueLabel} during active growth (about every 30 days).`,
        factors,
      };
    }

    case TaskType.MIST: {
      const mistScheduled = shouldScheduleMist(env, category);
      factors.push({
        label: 'Humidity needs',
        impact: mistScheduled
          ? `${species.commonName} benefits from extra humidity indoors.`
          : 'Misting is optional for this plant type in your environment.',
      });
      factors.push({
        label: 'Environment',
        impact: `${envLabel} — misting is mainly for indoor and semi-outdoor plants.`,
      });
      factors.push({
        label: 'Cadence',
        impact: 'About every 3 days when scheduled (capped to avoid over-misting).',
      });
      return {
        summary: `Misting is due ${dueLabel} to support leaf humidity.`,
        factors,
      };
    }

    case TaskType.PRUNE: {
      factors.push({
        label: 'Maintenance cadence',
        impact: 'Light pruning checks about every 30 days.',
      });
      factors.push({
        label: 'Species',
        impact: `Remove dead leaves and shape ${species.commonName} as needed.`,
      });
      return {
        summary: `Pruning / grooming is due ${dueLabel} (about every 30 days).`,
        factors,
      };
    }

    case TaskType.PH_TEST: {
      const interval = isEdibleOrHerb(category) ? 90 : 180;
      factors.push({
        label: 'Plant type',
        impact: isEdibleOrHerb(category)
          ? 'Herbs and edibles benefit from more frequent pH checks.'
          : 'Ornamental plants use a longer testing interval.',
      });
      factors.push({
        label: 'Cadence',
        impact: `Soil pH test about every ${interval} days.`,
      });
      return {
        summary: `Soil pH test is due ${dueLabel} (every ${interval} days for this plant type).`,
        factors,
      };
    }

    case TaskType.PEST_CONTROL: {
      const interval = isGrowingSeason ? 14 : 30;
      factors.push({
        label: 'Season',
        impact: isGrowingSeason
          ? 'Growing season: pests are more active — every 14 days.'
          : 'Off-season: monthly preventive checks.',
      });
      factors.push({
        label: 'Species',
        impact: `Routine treatment reminders for ${species.commonName}.`,
      });
      return {
        summary: `Pest treatment reminder is due ${dueLabel} (every ${interval} days).`,
        factors,
      };
    }

    case TaskType.REPOT: {
      factors.push({
        label: 'Repot eligibility',
        impact: canScheduleRepot(plant)
          ? 'Plant has been in place 6+ months (or no plant date on file).'
          : 'Repot tasks wait until the plant is established 6 months.',
      });
      factors.push({
        label: 'Timing',
        impact: 'First repot reminder is placed within the next care window (~60 days).',
      });
      factors.push({
        label: 'Pot size',
        impact: `${potLabel(plant.potSize)} — size up only 1–2 inches when roots are crowded.`,
      });
      return {
        summary: `Repot check is due ${dueLabel} when roots need more room.`,
        factors,
      };
    }

    case TaskType.ROTATE: {
      factors.push({
        label: 'Indoor placement',
        impact: 'Rotation applies to indoor plants for even light exposure.',
      });
      factors.push({
        label: 'Cadence',
        impact: 'Quarter turn about every 14 days.',
      });
      factors.push({
        label: 'Location',
        impact: `${envLabel} at “${plant.location ?? 'your space'}”.`,
      });
      return {
        summary: `Rotate the pot ${dueLabel} so growth stays balanced toward the light.`,
        factors,
      };
    }

    case TaskType.CLEAN_LEAVES: {
      factors.push({
        label: 'Indoor care',
        impact: 'Dust builds on leaves indoors — cleaning improves light uptake.',
      });
      factors.push({
        label: 'Cadence',
        impact: 'Wipe leaves about every 21 days.',
      });
      return {
        summary: `Leaf cleaning is due ${dueLabel} (about every 21 days indoors).`,
        factors,
      };
    }

    case TaskType.INSPECT_PESTS: {
      factors.push({
        label: 'Pest monitoring',
        impact: isPestProneSpecies(category)
          ? `${species.commonName} gets weekly pest inspections.`
          : 'Succulents and cacti skip weekly inspect tasks.',
      });
      factors.push({
        label: 'Cadence',
        impact: 'Quick check of leaf undersides and new growth every 7 days.',
      });
      return {
        summary: `Pest inspection is due ${dueLabel} (weekly early-detection check).`,
        factors,
      };
    }

    case TaskType.CHECK_MOISTURE: {
      factors.push({
        label: 'Water needs',
        impact: `${species.commonName} needs frequent moisture checks (catalog: every ${species.wateringFreqDays} days).`,
      });
      factors.push({
        label: 'Cadence',
        impact: 'Finger-test soil about every 7 days before watering.',
      });
      return {
        summary: `Moisture check is due ${dueLabel} before the next watering.`,
        factors,
      };
    }

    case TaskType.HEALTH_CHECK: {
      factors.push({
        label: 'Source',
        impact: 'Created after a diagnosis or treatment plan — not part of bulk scheduling.',
      });
      factors.push({
        label: 'Cadence',
        impact: 'Follow-up about every 7 days until the plant recovers.',
      });
      return {
        summary: `Health follow-up is due ${dueLabel} to track recovery.`,
        factors,
      };
    }

    default:
      return {
        summary: `This task is due ${dueLabel}.`,
        factors: [{ label: 'Schedule', impact: 'Based on your plant profile and care rules.' }],
      };
  }
}
