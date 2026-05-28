import type { PlantRecord } from '../pages/plant-profile/types';

export type MeasurementPoint = {
  id: string;
  date: Date;
  heightCm: number | null;
  widthCm: number | null;
  leafCount: number | null;
};

export function extractMeasurementPoints(entries: PlantRecord[]): MeasurementPoint[] {
  return entries
    .map((entry) => ({
      id: entry.id as string,
      date: new Date(entry.createdAt as string),
      heightCm: entry.heightCm != null ? Number(entry.heightCm) : null,
      widthCm: entry.widthCm != null ? Number(entry.widthCm) : null,
      leafCount: entry.leafCount != null ? Number(entry.leafCount) : null,
    }))
    .filter(
      (p) =>
        p.heightCm != null ||
        p.widthCm != null ||
        p.leafCount != null,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function heightSeries(points: MeasurementPoint[]): Array<{ date: Date; value: number }> {
  return points
    .filter((p): p is MeasurementPoint & { heightCm: number } => p.heightCm != null)
    .map((p) => ({ date: p.date, value: p.heightCm }));
}

export function formatDelta(current: number, previous: number): string {
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(diff % 1 === 0 ? 0 : 1)} cm`;
}

export function pickPhotoCompareIds(
  photoEntries: PlantRecord[],
): { beforeId: string; afterId: string } | null {
  if (photoEntries.length < 2) return null;
  const sorted = [...photoEntries].sort(
    (a, b) =>
      new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
  );
  return {
    beforeId: sorted[0].id as string,
    afterId: sorted[sorted.length - 1].id as string,
  };
}

export function measurementSummaryForEntry(entry: PlantRecord): string | null {
  const parts: string[] = [];
  if (entry.heightCm != null) parts.push(`${entry.heightCm} cm tall`);
  if (entry.widthCm != null) parts.push(`${entry.widthCm} cm wide`);
  if (entry.leafCount != null) parts.push(`${entry.leafCount} leaves`);
  return parts.length ? parts.join(' · ') : null;
}
