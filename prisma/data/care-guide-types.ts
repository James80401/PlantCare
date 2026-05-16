import { TaskType } from '@prisma/client';

export interface CareGuideSection {
  heading: string;
  body: string;
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
