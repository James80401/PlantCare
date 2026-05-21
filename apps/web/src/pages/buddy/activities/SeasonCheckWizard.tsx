import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, weatherApi } from '../../../services/api';

interface WeatherDay {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  rainProbability: number;
}

export default function SeasonCheckWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    weatherApi
      .adviceStatus()
      .then(({ data }) => {
        setHasLocation(data.hasLocation);
        setLocationLabel(data.locationLabel);
        const d = data.cachedAdvice?.summary?.days ?? [];
        setDays(d.slice(0, 3));
      })
      .catch(() => setHasLocation(false))
      .finally(() => setLoading(false));
  }, []);

  const finish = async () => {
    setSubmitting(true);
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'SEASON_CHECK',
        notes: notes || `Season check${locationLabel ? ` — ${locationLabel}` : ''}`,
      });
      setMessage(
        `Done! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.`,
      );
      setTimeout(() => navigate('/garden/buddy'), 1500);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(raw || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center text-emerald-700">Loading weather…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Activity"
        title="🌡️ Season check"
        description="Align your care rhythm with the weather this week."
      />

      <Card className="space-y-3">
        {!hasLocation ? (
          <p className="text-sm text-gray-600">
            Add your city in{' '}
            <a href="/garden/settings" className="font-medium text-emerald-800 underline">
              Settings
            </a>{' '}
            to see local forecast tips. You can still complete this check with your own notes.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-900">
              Forecast{locationLabel ? ` — ${locationLabel}` : ''}
            </p>
            {days.length === 0 ? (
              <p className="text-sm text-gray-500">
                Run today&apos;s weather check from Settings or Dashboard for fresh advice.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {days.map((d) => (
                  <li key={d.date} className="rounded-xl bg-emerald-50/80 px-3 py-2">
                    <span className="font-medium">{d.date}</span>: {d.tempMinC}–{d.tempMaxC}°C
                    {d.rainProbability >= 50 ? ' · rain likely' : ''}
                  </li>
                ))}
              </ul>
            )}
            <ul className="list-inside list-disc text-xs text-gray-600">
              <li>High rain → ease up on watering</li>
              <li>Heat wave → check soil moisture more often</li>
              <li>Cold snap → watch for drafts near windows</li>
            </ul>
          </>
        )}

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Adjustments you&apos;ll make</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pausing fertilizer until nights warm up…"
          />
        </label>

        {message && <p className="text-sm text-emerald-800">{message}</p>}

        <Button type="button" fullWidth disabled={submitting} onClick={finish}>
          {submitting ? 'Saving…' : 'Complete season check'}
        </Button>
      </Card>
    </div>
  );
}
