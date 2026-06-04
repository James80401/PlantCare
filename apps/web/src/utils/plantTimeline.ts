import type { TimelineEvent } from '../pages/plant-profile/types';

export type PlantTimelineEventApi = {
  id: string;
  date: string;
  type: 'journal' | 'care' | 'diagnosis';
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string | null;
  journalId?: string;
};

export type PlantTimelineApiResponse = {
  events: PlantTimelineEventApi[];
  counts: {
    journal: number;
    care: number;
    diagnosis: number;
    total: number;
  };
};

export function mapTimelineFromApi(events: PlantTimelineEventApi[]): TimelineEvent[] {
  return events.map((event) => ({
    id: event.id,
    date: new Date(event.date),
    type: event.type,
    title: event.title,
    description: event.description,
    meta: event.meta,
    imageUrl: event.imageUrl,
    journalId: event.journalId,
  }));
}

export type TimelineFilter = 'all' | TimelineEvent['type'];

export interface TimelineTypeCounts {
  all: number;
  journal: number;
  care: number;
  diagnosis: number;
}

export function countTimelineByType(events: TimelineEvent[]): TimelineTypeCounts {
  return events.reduce<TimelineTypeCounts>(
    (counts, event) => {
      counts.all += 1;
      counts[event.type] += 1;
      return counts;
    },
    { all: 0, journal: 0, care: 0, diagnosis: 0 },
  );
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  filter: TimelineFilter,
): TimelineEvent[] {
  if (filter === 'all') return events;
  return events.filter((event) => event.type === filter);
}
