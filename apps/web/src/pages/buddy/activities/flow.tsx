import { Link, useParams } from 'react-router-dom';
import ProgressPhotoWizard from './ProgressPhotoWizard';
import SeasonCheckWizard from './SeasonCheckWizard';
import SunlightAuditWizard from './SunlightAuditWizard';
import WateringWizard from './WateringWizard';
import RepottingWizard from './RepottingWizard';
import PruningWizard from './PruningWizard';
import PropagationWizard from './PropagationWizard';
import PestInspectionWizard from './PestInspectionWizard';
import HumidityCheckWizard from './HumidityCheckWizard';
import PlantJournalWizard from './PlantJournalWizard';
import GenericActivityFlow from './GenericActivityFlow';

const WIZARDS: Record<string, () => JSX.Element> = {
  WATERING_CHECK: WateringWizard,
  SEASON_CHECK: SeasonCheckWizard,
  PROGRESS_PHOTO: ProgressPhotoWizard,
  SUNLIGHT_AUDIT: SunlightAuditWizard,
  REPOTTING_GUIDE: RepottingWizard,
  PRUNING_GUIDE: PruningWizard,
  PROPAGATION_LOG: PropagationWizard,
  PEST_INSPECTION: PestInspectionWizard,
  HUMIDITY_CHECK: HumidityCheckWizard,
  PLANT_JOURNAL: PlantJournalWizard,
};

export default function BuddyActivityFlowPage() {
  const { activityType } = useParams<{ activityType: string }>();

  if (!activityType) {
    return <p className="text-center text-red-700">Unknown activity</p>;
  }

  const Wizard = WIZARDS[activityType];
  if (Wizard) {
    return (
      <div className="space-y-4">
        <Wizard />
        <Link
          to="/garden/buddy/activities"
          className="mx-auto block max-w-lg text-center text-sm font-medium text-emerald-800 hover:underline"
        >
          ← Activity library
        </Link>
      </div>
    );
  }

  return <GenericActivityFlow activityType={activityType} />;
}
