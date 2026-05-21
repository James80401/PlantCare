import { Link, useParams } from 'react-router-dom';
import ProgressPhotoWizard from './ProgressPhotoWizard';
import SeasonCheckWizard from './SeasonCheckWizard';
import WateringWizard from './WateringWizard';
import GenericActivityFlow from './GenericActivityFlow';

const WIZARDS: Record<string, () => JSX.Element> = {
  WATERING_CHECK: WateringWizard,
  SEASON_CHECK: SeasonCheckWizard,
  PROGRESS_PHOTO: ProgressPhotoWizard,
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
