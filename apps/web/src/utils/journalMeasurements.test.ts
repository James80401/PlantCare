import { describe, expect, it } from 'vitest';
import {
  extractMeasurementPoints,
  formatDelta,
  formatMeasurementValues,
  heightSeries,
  measurementDeltaSummary,
  measurementSummaryForEntry,
  pickCompareIdsAroundEntry,
  pickLatestPhotoCompareIds,
  pickPhotoCompareIds,
} from './journalMeasurements';

describe('journalMeasurements', () => {
  const entries = [
    {
      id: 'a',
      createdAt: '2026-01-01T00:00:00.000Z',
      heightCm: 10,
      widthCm: null,
      leafCount: 5,
    },
    {
      id: 'b',
      createdAt: '2026-02-01T00:00:00.000Z',
      heightCm: 14,
      widthCm: 20,
      leafCount: 8,
    },
    { id: 'c', createdAt: '2026-01-15T00:00:00.000Z', notes: 'no numbers' },
  ];

  it('extracts entries with at least one measurement', () => {
    const points = extractMeasurementPoints(entries as never);
    expect(points).toHaveLength(2);
    expect(points[0].id).toBe('a');
    expect(points[1].heightCm).toBe(14);
  });

  it('builds height series chronologically', () => {
    const series = heightSeries(extractMeasurementPoints(entries as never));
    expect(series).toHaveLength(2);
    expect(series[1].value).toBe(14);
  });

  it('formats positive and negative deltas', () => {
    expect(formatDelta(14, 10)).toBe('+4 cm');
    expect(formatDelta(9, 10)).toBe('-1 cm');
  });

  it('picks oldest and newest photo ids', () => {
    const photos = [
      { id: 'old', createdAt: '2026-01-01', photoUrl: '/a.jpg' },
      { id: 'new', createdAt: '2026-03-01', photoUrl: '/b.jpg' },
    ];
    const pick = pickPhotoCompareIds(photos as never);
    expect(pick?.beforeId).toBe('old');
    expect(pick?.afterId).toBe('new');
  });

  it('picks latest adjacent photo ids', () => {
    const photos = [
      { id: 'old', createdAt: '2026-01-01', photoUrl: '/a.jpg' },
      { id: 'middle', createdAt: '2026-02-01', photoUrl: '/m.jpg' },
      { id: 'new', createdAt: '2026-03-01', photoUrl: '/b.jpg' },
    ];
    const pick = pickLatestPhotoCompareIds(photos as never);
    expect(pick).toEqual({ beforeId: 'middle', afterId: 'new' });
  });

  it('picks comparison ids around a selected entry', () => {
    const photos = [
      { id: 'old', createdAt: '2026-01-01', photoUrl: '/a.jpg' },
      { id: 'middle', createdAt: '2026-02-01', photoUrl: '/m.jpg' },
      { id: 'new', createdAt: '2026-03-01', photoUrl: '/b.jpg' },
    ];
    const pick = pickCompareIdsAroundEntry(photos as never, 'middle');
    expect(pick).toEqual({ beforeId: 'old', afterId: 'middle' });
  });

  it('summarizes measurement deltas between entries', () => {
    const summary = measurementDeltaSummary(
      { heightCm: 10, widthCm: 15, leafCount: 4 } as never,
      { heightCm: 12, widthCm: 14, leafCount: 7 } as never,
    );
    expect(summary).toBe('Height +2 cm - Width -1 cm - Leaves +3');
  });

  it('formats a measurement set with the shared middle-dot separator', () => {
    expect(
      formatMeasurementValues({ heightCm: 14, widthCm: 20, leafCount: 8 }),
    ).toBe('14 cm tall · 20 cm wide · 8 leaves');
  });

  it('omits missing measurement fields and returns null when empty', () => {
    expect(
      formatMeasurementValues({ heightCm: 10, widthCm: null, leafCount: 5 }),
    ).toBe('10 cm tall · 5 leaves');
    expect(
      formatMeasurementValues({ heightCm: null, widthCm: null, leafCount: null }),
    ).toBeNull();
  });

  it('summarizes a journal entry through the shared formatter', () => {
    expect(
      measurementSummaryForEntry({ heightCm: 12, widthCm: null, leafCount: null } as never),
    ).toBe('12 cm tall');
    expect(measurementSummaryForEntry({ notes: 'no numbers' } as never)).toBeNull();
  });
});
