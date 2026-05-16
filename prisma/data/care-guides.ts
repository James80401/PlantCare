import { getAllCareGuideSeeds } from './care-guide-generator';
import { genericCareGuideSeeds } from './care-guides-generic';

export type { CareGuideSection, CareGuideSeed } from './care-guide-types';

/** All guides: 7 generics + ~7 per species in catalog */
export const careGuideSeeds: CareGuideSeed[] = getAllCareGuideSeeds(genericCareGuideSeeds);

export { generateSpeciesCareGuides } from './care-guide-generator';
