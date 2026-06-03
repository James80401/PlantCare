import { TaskType } from '@prisma/client';

export interface CareGuideSection {
  heading: string;
  /** Legacy flat body; kept for backward compatibility — mirrors beginnerBody when structured. */
  body: string;
  whyItMatters?: string;
  beginnerBody?: string;
  advancedBody?: string;
  warnings?: string[];
  imageKeys?: string[];
}

export interface CareGuideSeed {
  id: string;
  taskType: TaskType;
  speciesId?: string;
  title: string;
  summary: string;
  sections: CareGuideSection[];
  images: { imageKey: string; caption: string; altText: string; sortOrder: number }[];
}
