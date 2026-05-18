import { format } from 'date-fns';
import { usePlantProfile } from './PlantProfileContext';
import { InfoRow, LocationEditor, ProfileSection } from './shared';
import { taskTypeLabel } from '../../utils/tasks';

export default function PlantOverviewTab() {
  const ctx = usePlantProfile();

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
