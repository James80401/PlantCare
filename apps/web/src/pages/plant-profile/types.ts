export type PlantTab = 'overview' | 'care' | 'tasks' | 'journal' | 'health';

export type PlantRecord = Record<string, unknown>;

export interface CareOverviewSection {
  heading: string;
  body: string;
}

export interface CareOverview {
  growingEnvironment: string;
  environmentLabel: string;
  sections: CareOverviewSection[];
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'journal' | 'care' | 'diagnosis';
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string | null;
  journalId?: string;
}
