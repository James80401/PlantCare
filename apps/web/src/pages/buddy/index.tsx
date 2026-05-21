import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BuddySprite from '../../components/buddy/BuddySprite';
import MoodIndicator from '../../components/buddy/MoodIndicator';
import SunlightBar from '../../components/buddy/SunlightBar';
import { GROWTH_STAGE_LABEL } from '../../components/buddy/species';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import SeasonalBanner from '../../components/buddy/SeasonalBanner';
import { useBuddy } from '../../hooks/buddy/useBuddy';
import { buddyApi } from '../../services/api';

export default function BuddyHome() {
  const { buddy, loading, error, refresh } = useBuddy();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!buddy) return;
    buddyApi.greeting().then(({ data }) => setGreeting(data.message)).catch(() => {});
  }, [buddy?.id]);

  if (loading || !buddy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        {loading ? 'Loading…' : error || 'Buddy not found'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Plant Buddy"
        title={buddy.name}
        description={greeting || `Your ${GROWTH_STAGE_LABEL[buddy.growthStage] ?? 'plant'} companion`}
      />

      <SeasonalBanner />

      <Card className="flex flex-col items-center gap-4 py-8">
        <BuddySprite
          speciesId={buddy.speciesId}
          size="lg"
          traveling={buddy.hasActiveJourney}
          mood={buddy.mood}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MoodIndicator mood={buddy.mood} />
          <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-900">
            {GROWTH_STAGE_LABEL[buddy.growthStage] ?? buddy.growthStage}
          </span>
          <span className="text-xs text-gray-500">{buddy.dewdrops} dewdrops 💧</span>
        </div>
        {buddy.hasActiveJourney ? (
          <p className="text-center text-sm text-emerald-800">
            {buddy.name} is on a grow journey!
          </p>
        ) : (
          <SunlightBar value={buddy.sunlightToday} />
        )}
      </Card>

      <Card className="grid grid-cols-2 gap-3 text-center text-sm">
        <div>
          <p className="text-2xl font-bold text-emerald-900">{buddy.streakDays}</p>
          <p className="text-xs text-gray-500">Day streak</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-900">{buddy.journeyCount}</p>
          <p className="text-xs text-gray-500">Journeys</p>
        </div>
      </Card>

      <Link
        to="/garden/tasks"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-100"
      >
        First aid — plant health tasks
      </Link>

      <Link
        to="/garden/buddy/town"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-200"
      >
        Garden Town
      </Link>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          to="/garden/buddy/activities"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          Activities
        </Link>
        <Link
          to="/garden/buddy/quests"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          Quests
        </Link>
        <Link
          to="/garden/buddy/style"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 sm:col-span-2"
        >
          Style & shop
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {buddy.hasActiveJourney ? (
          <Link
            to="/garden/buddy/journey"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
          >
            View journey
          </Link>
        ) : buddy.journeyReady ? (
          <Link
            to="/garden/buddy/journey"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
          >
            Send on a journey
          </Link>
        ) : (
          <Link
            to="/garden/tasks"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
          >
            Complete care tasks
          </Link>
        )}
        <Button type="button" variant="ghost" fullWidth onClick={() => refresh()}>
          Refresh
        </Button>
      </div>

      <p className="text-center text-xs text-gray-500">
        Garden code:{' '}
        <span className="font-mono font-semibold">{buddy.gardenCode}</span> — share in{' '}
        <Link to="/garden/buddy/town" className="font-medium text-emerald-800 hover:underline">
          Garden Town
        </Link>
      </p>
    </div>
  );
}
