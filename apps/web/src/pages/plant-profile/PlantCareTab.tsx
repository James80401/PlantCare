import { useAuth } from '../../context/AuthContext';
import { usePlantProfile } from './PlantProfileContext';
import type { CareDetailLevel } from './types';
import { CareGuideCard, ProfileSection, SectionEmptyState } from './shared';
import { plantDrPlantPath } from './constants';

function defaultCareDetailLevel(experienceLevel?: string | null): CareDetailLevel {
  if (experienceLevel === 'advanced' || experienceLevel === 'expert') {
    return 'advanced';
  }
  return 'beginner';
}

export default function PlantCareTab() {
  const ctx = usePlantProfile();
  const { user } = useAuth();
  const defaultDetailLevel = defaultCareDetailLevel(user?.experienceLevel);

  return (
    <ProfileSection
      eyebrow="Guide"
      title="Care"
      description="Care guidance tailored by species and growing environment when data is available."
      help="plant-care"
    >
      {ctx.careOverview?.sections?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {ctx.careOverview.sections.map((section) => (
            <CareGuideCard
              key={section.id}
              section={section}
              defaultDetailLevel={defaultDetailLevel}
              drPlantPath={plantDrPlantPath(ctx.id)}
              plantId={ctx.id}
            />
          ))}
        </div>
      ) : (
        <SectionEmptyState
          title="No care guide yet"
          body="Care guidance will appear here when a guide is available for this species."
        />
      )}
    </ProfileSection>
  );
}
