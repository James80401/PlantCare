export type PlantTab = 'overview' | 'care' | 'tasks' | 'journal' | 'health';

export type PlantRecord = Record<string, unknown>;

export type PlantCareTopicId =
  | 'water'
  | 'season'
  | 'light'
  | 'soil'
  | 'humidity'
  | 'temperature'
  | 'fertilizer'
  | 'pruning'
  | 'repotting'
  | 'propagation'
  | 'pests'
  | 'troubleshooting'
  | 'toxicity'
  | 'notes';

export type CareDetailLevel = 'beginner' | 'advanced';

export interface CareOverviewSection {
  id: PlantCareTopicId;
  heading: string;
  whyItMatters: string;
  beginnerBody: string;
  advancedBody: string;
  warnings: string[];
}

export interface CareOverview {
  growingEnvironment: string;
  environmentLabel: string;
  sections: CareOverviewSection[];
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'journal' | 'care' | 'diagnosis' | 'progress';
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string | null;
  journalId?: string;
}
