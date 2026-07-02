import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { RecommendationPanel } from '../../components/recommendations/RecommendationPanel';
import { recommendationsApi, type RecommendationItem } from '../../services/api';
import { PLANT_DETAILS_SECTION_ID } from '../../utils/gardenPaths';
import { usePlantProfile } from './PlantProfileContext';
import { PlantDetailsEditor } from './PlantDetailsEditor';
import { InfoRow, LocationEditor, ProfileSection } from './shared';
import { taskTypeLabel } from '../../utils/tasks';

export default function PlantOverviewTab() {
  const ctx = usePlantProfile();
  const location = useLocation();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  const loadRecommendations = useCallback(async () => {
    const { data } = await recommendationsApi.list(ctx.id);
    setRecommendations(data);
  }, [ctx.id]);

  useEffect(() => {
    if (location.hash.replace('#', '') !== PLANT_DETAILS_SECTION_ID) return;
    document.getElementById(PLANT_DETAILS_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [location.hash, location.pathname]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  return (
    <ProfileSection
      eyebrow="Snapshot"
      title="Overview"
      description="The key growing context and recent care signals for this plant."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="space-y-4">
          <InfoRow label="Common name" value={ctx.species.commonName as string} />
          {ctx.species.scientificName ? (
            <InfoRow label="Scientific name" value={ctx.species.scientificName as string} />
          ) : null}
          <InfoRow
            label="Sunlight"
            value={(ctx.species.sunlight as string) || 'Not specified yet'}
          />
          <InfoRow
            label="Base watering cadence"
            value={`Every ${ctx.species.wateringFreqDays as number} days before environment adjustments`}
          />
          {ctx.latestCompleted ? (
            <InfoRow
              label="Last completed care"
              value={`${taskTypeLabel(ctx.latestCompleted.taskType as string)} · ${format(new Date(ctx.latestCompleted.completedAt as string), 'PPp')}`}
            />
          ) : (
            <InfoRow label="Last completed care" value="No completed care logged yet" />
          )}
        </div>

        <PlantDetailsEditor />

        <div className="lg:col-span-2">
          <RecommendationPanel
            title={`${ctx.plantLabel} recommendations`}
            description="Useful plant-specific guidance that is not urgent enough to be a care task."
            recommendations={recommendations}
            onChanged={loadRecommendations}
            emptyText="No plant-specific recommendations right now."
          />
        </div>

        <LocationEditor
          editingLocation={ctx.editingLocation}
          currentLocation={ctx.currentLocation}
          locationDraft={ctx.locationDraft}
          locationOptions={ctx.locationOptions}
          locationSaving={ctx.locationSaving}
          locationMessage={ctx.locationMessage}
          environmentLabel={ctx.careOverview?.environmentLabel}
          onDraftChange={ctx.setLocationDraft}
          onEdit={() => ctx.setEditingLocation(true)}
          onSave={ctx.saveLocation}
          onCancel={() => {
            ctx.setLocationDraft(ctx.currentLocation);
            ctx.setEditingLocation(false);
          }}
        />
      </div>
    </ProfileSection>
  );
}
