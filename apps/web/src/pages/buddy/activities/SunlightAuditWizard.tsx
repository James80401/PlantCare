import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

type PlantRow = {
  id: string;
  nickname: string | null;
  location: string | null;
  species: { commonName: string; sunlight?: string | null };
};

type LightRating = 'low' | 'good' | 'high' | null;

export default function SunlightAuditWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, LightRating>>({});
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const setRating = (plantId: string, value: LightRating) => {
    setRatings((prev) => ({ ...prev, [plantId]: value }));
  };

  const ratedCount = Object.values(ratings).filter(Boolean).length;

  const finish = async () => {
    if (ratedCount === 0) {
      setMessage('Rate light for at least one plant.');
      return;
    }
    const lines = plants
      .filter((p) => ratings[p.id])
      .map((p) => {
        const label = p.nickname || p.species.commonName;
        const r = ratings[p.id];
        const word = r === 'low' ? 'needs more light' : r === 'high' ? 'too much direct sun' : 'light looks good';
        return `${label}: ${word}`;
      });
    const summary = `Sunlight audit — ${lines.join('; ')}${notes ? `. ${notes}` : ''}`;
    const firstId = plants.find((p) => ratings[p.id])?.id;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'SUNLIGHT_AUDIT',
        plantId: firstId,
        notes: summary,
      });
      setMessage(
        `Done! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.`,
      );
      setTimeout(() => navigate('/garden/buddy/quests'), 1800);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setMessage(Array.isArray(raw) ? raw.join(' ') : raw || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Activity"
        title="☀️ Sunlight audit"
        description="Check each plant’s spot — too dim, just right, or too harsh?"
      />

      {step === 0 && (
        <Card className="space-y-3">
          <p className="text-sm text-gray-600">
            Walk your space and note where each plant sits. You’ll rate light in the next step.
          </p>
          <ul className="text-sm text-emerald-900">
            <li>• South/west windows — often bright</li>
            <li>• Leggy growth or pale leaves — may need more light</li>
            <li>• Scorched or bleached leaves — may need shade</li>
          </ul>
          <Button type="button" fullWidth onClick={() => setStep(1)}>
            Start audit
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          {plants.length === 0 ? (
            <p className="text-sm text-gray-500">
              No plants yet.{' '}
              <a href="/garden/plants/new" className="font-medium text-emerald-800 underline">
                Add a plant
              </a>{' '}
              first.
            </p>
          ) : (
            <ul className="max-h-80 space-y-3 overflow-y-auto">
              {plants.map((p) => (
                <li key={p.id} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-emerald-950">
                    {p.nickname || p.species.commonName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.location ? `Spot: ${p.location}` : 'No location set'}
                    {p.species.sunlight ? ` · likes ${p.species.sunlight} light` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['low', 'Too dim'],
                        ['good', 'Just right'],
                        ['high', 'Too bright'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRating(p.id, key)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                          ratings[p.id] === key
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={plants.length === 0} onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Moves you’ll make (optional)</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Moving pothos back from the south window…"
            />
          </label>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Complete audit'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
