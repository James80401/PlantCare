import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi } from '../../../services/api';

interface ActivityMeta {
  activityType: string;
  label: string;
  emoji: string;
  estimatedMinutes: number;
  sunlightReward: number;
  dewdropReward: number;
}

const GUIDED = new Set([
  'WATERING_CHECK',
  'SEASON_CHECK',
  'PROGRESS_PHOTO',
  'SUNLIGHT_AUDIT',
]);

export default function BuddyActivitiesPage() {
  const [activities, setActivities] = useState<ActivityMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buddyApi
      .activityLibrary()
      .then(({ data }) => setActivities(data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading activities…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Plant Buddy"
        title="Activities"
        description="Guided care experiences that earn sunlight and dewdrops"
      />

      <div className="grid gap-2">
        {activities.map((a) => (
          <Link
            key={a.activityType}
            to={`/garden/buddy/activities/${a.activityType}`}
            className="block"
          >
            <Card className="flex items-center gap-3 transition hover:border-emerald-300">
              <span className="text-3xl" aria-hidden>
                {a.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-950">
                  {a.label}
                  {GUIDED.has(a.activityType) && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Guided
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  ~{a.estimatedMinutes} min · +{a.sunlightReward} ☀️ · +{a.dewdropReward} 💧
                  {a.activityType === 'WATERING_CHECK' && ' · syncs watering tasks'}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  );
}
