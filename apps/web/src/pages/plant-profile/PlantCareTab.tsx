import { usePlantProfile } from './PlantProfileContext';
import { CareGuideCard, ProfileSection, SectionEmptyState } from './shared';

export default function PlantCareTab() {
  const ctx = usePlantProfile();

  return (
    <ProfileSection
      eyebrow="Guide"
      title="Care"
      description="Care guidance tailored by species and growing environment when data is available."
    >
      {ctx.careOverview?.sections?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {ctx.careOverview.sections.map((section) => (
            <CareGuideCard key={section.heading} section={section} />
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
