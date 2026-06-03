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
