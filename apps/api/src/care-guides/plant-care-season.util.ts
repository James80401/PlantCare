import type { PlantCategory } from './growing-environment';
import type { GrowingEnvironment } from './growing-environment';
import type { WeatherAdvicePayload } from '../weather/weather-advice.types';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type PlantGrowthStage = 'new' | 'establishing' | 'established';

export function getSeason(now = new Date()): Season {
  const month = now.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export function seasonLabel(season: Season): string {
  const labels: Record<Season, string> = {
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
    winter: 'Winter',
  };
  return labels[season];
}

export function inferPlantGrowthStage(
  datePlanted: Date | null | undefined,
  createdAt: Date,
  now = new Date(),
): PlantGrowthStage {
  const start = datePlanted ?? createdAt;
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  if (days < 90) return 'new';
  if (days < 365) return 'establishing';
  return 'established';
}

export function growthStageLabel(stage: PlantGrowthStage): string {
  const labels: Record<PlantGrowthStage, string> = {
    new: 'New to your home',
    establishing: 'Settling in',
    established: 'Established',
  };
  return labels[stage];
}

export function buildSeasonCareNote(
  season: Season,
  category: PlantCategory,
  environment: GrowingEnvironment,
  plantName: string,
): string {
  const label = seasonLabel(season);
  const outdoor =
    environment === 'outdoor' || environment === 'semi_outdoor';

  if (season === 'spring') {
    return outdoor
      ? `**${label}:** Growth picks up for **${plantName}** — increase watering checks as days lengthen and move outdoor pots after last frost.`
      : `**${label}:** **${plantName}** often wakes up — resume light feeding and watch for faster soil drying near windows.`;
  }
  if (season === 'summer') {
    return outdoor
      ? `**${label}:** Heat and sun can dry **${plantName}** quickly — morning water, afternoon shade for sensitive leaves.`
      : `**${label}:** AC and bright sun dry pots faster — check **${plantName}** every few days, especially near south windows.`;
  }
  if (season === 'fall') {
    const dormancy =
      category === 'succulent' || category === 'cactus';
    return dormancy
      ? `**${label}:** Slow feeding for **${plantName}** as growth eases; reduce water before winter.`
      : `**${label}:** Less daylight means **${plantName}** needs less water — stretch intervals and skip fertilizer unless still actively growing.`;
  }
  return outdoor
    ? `**${label}:** Protect **${plantName}** from frost; water only when soil is dry and days are above freezing.`
    : `**${label}:** Low light season — water **${plantName}** sparingly, skip fertilizer, and keep away from cold drafts.`;
}

export function buildGrowthStageNote(
  stage: PlantGrowthStage,
  plantName: string,
  category: PlantCategory,
): string {
  if (stage === 'new') {
    return `**${growthStageLabel(stage)}:** **${plantName}** is still acclimating — avoid repotting or heavy feed for 4–6 weeks unless roots are cramped.`;
  }
  if (stage === 'establishing') {
    return `**${growthStageLabel(stage)}:** **${plantName}** is building roots — steady watering beats big swings; light feed in active growth only.`;
  }
  const bloom =
    category === 'orchid' || category === 'vine'
      ? ' Watch for bloom or flush growth after winter rest.'
      : '';
  return `**${growthStageLabel(stage)}:** **${plantName}** has a stable routine — adjust for season, not every week.${bloom}`;
}

export function buildWeatherCareHint(
  cached: WeatherAdvicePayload | null | undefined,
  plantId: string,
): string | null {
  if (!cached) return null;
  const plantLine = cached.plants.find((p) => p.plantId === plantId);
  if (plantLine?.advice) return plantLine.advice;
  const alert = cached.overviewAlerts[0];
  if (alert) return `${alert.title} — ${alert.message}`;
  const tomorrow = cached.summary.days[1];
  if (tomorrow) {
    return `Next few days: ${Math.round(tomorrow.tempMinC)}–${Math.round(tomorrow.tempMaxC)}°C, rain chance ${Math.round(tomorrow.rainProbability * 100)}%.`;
  }
  return null;
}
