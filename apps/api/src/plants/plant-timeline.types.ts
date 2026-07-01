export type PlantTimelineEventType = 'journal' | 'care' | 'diagnosis' | 'progress';

export interface PlantTimelineEventDto {
  id: string;
  date: string;
  type: PlantTimelineEventType;
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string | null;
  journalId?: string;
}

export interface PlantTimelineResponseDto {
  events: PlantTimelineEventDto[];
  counts: {
    journal: number;
    care: number;
    diagnosis: number;
    progress: number;
    total: number;
  };
}
