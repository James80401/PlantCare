import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buddyApi } from '../../services/api';
import type { BuddyState } from '../../hooks/buddy/types';
import { speciesEmoji } from './species';

const SUNLIGHT_CAP = 100;

export default function BuddyDashboardPanel() {
  const [buddy, setBuddy] = useState<BuddyState | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buddyApi
      .get()
      .then(({ data }) => setBuddy(data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setMissing(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (missing) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Plant Buddy</p>
        <p className="mt-1 text-sm text-emerald-950">
          Adopt a companion that grows when you care for your plants.
        </p>
        <Link
          to="/garden/buddy/onboarding"
          className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Meet your buddy
        </Link>
      </section>
    );
  }

  if (!buddy) return null;

  const pct = Math.min(100, Math.round((buddy.sunlightToday / SUNLIGHT_CAP) * 100));
  const status = buddy.hasActiveJourney
    ? 'On a grow journey'
    : buddy.journeyReady
      ? 'Ready to journey!'
      : `${buddy.sunlightToday}/${SUNLIGHT_CAP} sunlight today`;

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {speciesEmoji(buddy.speciesId)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Plant Buddy
          </p>
          <p className="font-semibold text-emerald-950">{buddy.name}</p>
          <p className="text-xs text-gray-600">{status}</p>
        </div>
        <Link
          to="/garden/buddy"
          className="shrink-0 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Open
        </Link>
      </div>
      {!buddy.hasActiveJourney && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-2 flex gap-3 text-xs text-gray-500">
        <span>{buddy.dewdrops} dewdrops</span>
        <span>{buddy.streakDays} day streak</span>
      </div>
    </section>
  );
}
