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

export function formatNumberDelta(current: number, previous: number): string {
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(diff % 1 === 0 ? 0 : 1)}`;
}

export function pickPhotoCompareIds(
  photoEntries: PlantRecord[],
): { beforeId: string; afterId: string } | null {
  if (photoEntries.length < 2) return null;
  const sorted = sortEntriesByDate(photoEntries);
  return {
    beforeId: sorted[0].id as string,
    afterId: sorted[sorted.length - 1].id as string,
  };
}

export function pickLatestPhotoCompareIds(
  photoEntries: PlantRecord[],
): { beforeId: string; afterId: string } | null {
  if (photoEntries.length < 2) return null;
  const sorted = sortEntriesByDate(photoEntries);
  return {
    beforeId: sorted[sorted.length - 2].id as string,
    afterId: sorted[sorted.length - 1].id as string,
  };
}

export function pickCompareIdsAroundEntry(
  photoEntries: PlantRecord[],
  entryId: string,
): { beforeId: string; afterId: string } | null {
  if (photoEntries.length < 2) return null;
  const sorted = sortEntriesByDate(photoEntries);
  const index = sorted.findIndex((entry) => entry.id === entryId);
  if (index === -1) return null;
  if (index === 0) {
    return { beforeId: sorted[0].id as string, afterId: sorted[1].id as string };
  }
  return {
    beforeId: sorted[index - 1].id as string,
    afterId: sorted[index].id as string,
  };
}

export function measurementDeltaSummary(
  before: PlantRecord,
  after: PlantRecord,
): string | null {
  const parts: string[] = [];
  if (before.heightCm != null && after.heightCm != null) {
    parts.push(`Height ${formatDelta(Number(after.heightCm), Number(before.heightCm))}`);
  }
  if (before.widthCm != null && after.widthCm != null) {
    parts.push(`Width ${formatDelta(Number(after.widthCm), Number(before.widthCm))}`);
  }
  if (before.leafCount != null && after.leafCount != null) {
    parts.push(`Leaves ${formatNumberDelta(Number(after.leafCount), Number(before.leafCount))}`);
  }
  return parts.length ? parts.join(' - ') : null;
}

export type MeasurementValues = {
  heightCm: number | null;
  widthCm: number | null;
  leafCount: number | null;
};

/**
 * Human-readable summary of a single set of measurements, e.g.
 * "14 cm tall - 20 cm wide - 8 leaves". Returns null when no
 * measurement is present so callers can fall back cleanly.
 */
export function formatMeasurementValues(measurements: MeasurementValues): string | null {
  const parts: string[] = [];
  if (measurements.heightCm != null) parts.push(`${measurements.heightCm} cm tall`);
  if (measurements.widthCm != null) parts.push(`${measurements.widthCm} cm wide`);
  if (measurements.leafCount != null) parts.push(`${measurements.leafCount} leaves`);
  return parts.length ? parts.join(' - ') : null;
}

export function measurementSummaryForEntry(entry: PlantRecord): string | null {
  return formatMeasurementValues({
    heightCm: entry.heightCm != null ? Number(entry.heightCm) : null,
    widthCm: entry.widthCm != null ? Number(entry.widthCm) : null,
    leafCount: entry.leafCount != null ? Number(entry.leafCount) : null,
  });
}

function sortEntriesByDate(entries: PlantRecord[]): PlantRecord[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
  );
}
