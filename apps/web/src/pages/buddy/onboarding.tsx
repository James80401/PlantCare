import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BUDDY_SPECIES, BUDDY_TRAITS } from '../../components/buddy/species';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { buddyApi } from '../../services/api';
import type { BuddyTrait } from '../../hooks/buddy/types';
import { formatApiErrorMessage } from '../../utils/apiError';

export default function BuddyOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('monstera');
  const [trait, setTrait] = useState<BuddyTrait>('RESILIENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await buddyApi.create({ name: name.trim(), speciesId, trait });
      navigate('/garden/buddy', { replace: true });
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not create your buddy. You may already have one.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Plant Buddy"
        title="Plant Buddy is optional"
        description="A small companion can grow alongside your garden, but you can skip this and use the rest of DrPlant right away."
      />

      <Card className="border-amber-200 bg-amber-50/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-emerald-950">No setup required</h2>
            <p className="mt-1 text-sm leading-6 text-gray-700">
              Buddy adds encouragement, quests, and customization. It does not block gardens, plant care,
              DrPlant health checks, journal notes, or reminders.
            </p>
          </div>
          <Link
            to="/garden"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            Skip for now
          </Link>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-3">
          <label className="block text-sm font-semibold text-emerald-900">
            Buddy name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monty"
              maxLength={24}
              className="mt-1 w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm"
            />
          </label>
        </Card>

        <Card className="space-y-2">
          <p className="text-sm font-semibold text-emerald-900">Choose a species</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BUDDY_SPECIES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeciesId(s.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  speciesId === s.id
                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-emerald-100 bg-white hover:bg-emerald-50/50'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <span className="mt-1 block text-sm font-semibold text-emerald-950">{s.label}</span>
                <span className="text-xs text-gray-600">{s.blurb}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <p className="text-sm font-semibold text-emerald-900">Personality trait</p>
          <div className="space-y-2">
            {BUDDY_TRAITS.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 ${
                  trait === t.value ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100'
                }`}
              >
                <input
                  type="radio"
                  name="trait"
                  value={t.value}
                  checked={trait === t.value}
                  onChange={() => setTrait(t.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-emerald-950">{t.label}</span>
                  <span className="text-xs text-gray-600">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-2">
          <Button type="submit" fullWidth disabled={busy || !name.trim()}>
            {busy ? 'Creating...' : 'Adopt my buddy'}
          </Button>
          <Link
            to="/garden"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            Skip and continue
          </Link>
        </div>
      </form>
    </div>
  );
}
