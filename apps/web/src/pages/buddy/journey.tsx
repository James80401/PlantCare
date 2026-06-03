import { useState } from 'react';
import { Link } from 'react-router-dom';
import BuddyScene from '../../components/buddy/BuddyScene';
import DiscoveryModal from '../../components/buddy/DiscoveryModal';
import { JourneyWorldStatus } from '../../components/buddy/BuddyJourneyWorld';
import { BuddyPersonalityCard, personalityForTrait } from '../../components/buddy/BuddyPersonality';
import SunlightBar from '../../components/buddy/SunlightBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useBuddy } from '../../hooks/buddy/useBuddy';
import { isJourneyTraveling, useJourney } from '../../hooks/buddy/useJourney';
import { buddyApi } from '../../services/api';

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Returning soon…';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}m ${s}s`;
}

export default function BuddyJourneyPage() {
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { journey, data, loading, error, refresh } = useJourney(Boolean(buddy));
  const [starting, setStarting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [discoveryReaction, setDiscoveryReaction] = useState('');
  const [discoveryOutcome, setDiscoveryOutcome] = useState('');
  const [pageError, setPageError] = useState('');

  const traveling = isJourneyTraveling(journey);
  const personality = buddy ? personalityForTrait(buddy.trait) : null;
  const completedWithDiscovery =
    journey?.completed && journey.discovery && journey.needsChoice && journey.choiceMade === null;

  const handleStart = async () => {
    if (!buddy) return;
    setStarting(true);
    setPageError('');
    try {
      await buddyApi.startJourney(buddy.currentBiome);
      await refresh();
      await refreshBuddy();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setPageError(Array.isArray(msg) ? msg.join(' ') : msg || 'Could not start journey.');
    } finally {
      setStarting(false);
    }
  };

  const handleDiscoveryChoice = async (choice: number) => {
    if (!journey?.id) return;
    setResponding(true);
    try {
      const { data } = await buddyApi.respondDiscovery(journey.id, choice);
      const response = data as { reaction?: string; outcome?: string };
      setDiscoveryReaction(
        response.reaction ?? 'Your buddy appreciated the moment.',
      );
      setDiscoveryOutcome(response.outcome ?? '');
      await refreshBuddy();
    } finally {
      setResponding(false);
    }
  };

  if (!buddy || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading journey…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Grow journey"
        title={traveling ? `${buddy.name} is exploring` : 'Send your buddy exploring'}
        description={
          traveling
            ? `Exploring ${journey?.biomeName ?? 'the garden'} with ${personality?.choiceTone ?? 'their own style'} - complete tasks to shorten the trip.`
            : `Fill sunlight to 100, then send your buddy on a timed adventure. ${personality?.journeyStyle ?? ''}`
        }
      />

      {error || pageError ? (
        <p className="text-sm text-red-600">{error || pageError}</p>
      ) : null}

      {traveling && journey ? (
        <BuddyScene
          buddy={buddy}
          mode="traveling"
          biomeName={journey.biomeName}
          biomeEmoji={journey.biomeEmoji}
          progressPercent={journey.progressPercent}
          remainingLabel={`Returns in ${formatCountdown(journey.remainingSeconds)}`}
        />
      ) : (
        <Card className="space-y-4 py-6">
          <BuddyScene buddy={buddy} mode="home" compact />
        </Card>
      )}

      {traveling && journey ? (
        <JourneyWorldStatus
          biomeId={journey.biomeId}
          biomeName={journey.biomeName}
          tasksCompleted={journey.tasksCompletedDuring}
          minutesSaved={journey.minutesSaved}
        />
      ) : null}

      <BuddyPersonalityCard trait={buddy.trait} mode="journey" compact={traveling} />

      <Card className="space-y-4 py-5">
        {traveling && journey ? (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                style={{ width: `${journey.progressPercent}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600">
              Returns in {formatCountdown(journey.remainingSeconds)}
            </p>
            <p className="text-center text-xs text-gray-500">
              Tasks you complete now still earn dewdrops and shave ~10 min off the timer.
            </p>
            {journey.tasksCompletedDuring > 0 ? (
              <p className="text-center text-sm font-medium text-emerald-800">
                Care tasks during this trip: {journey.tasksCompletedDuring} · ~
                {journey.minutesSaved} min saved
              </p>
            ) : null}
          </>
        ) : journey?.completed && journey.discovery ? (
          <div className="space-y-2 text-center text-sm text-gray-700">
            <p className="font-semibold text-emerald-900">{buddy.name} is back!</p>
            {journey.discovery.title ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {journey.discovery.title}
              </p>
            ) : null}
            <p>{journey.discovery.story}</p>
            {journey.choiceMade !== null ? (
              <p className="text-xs text-gray-500">
                {discoveryReaction || 'Thanks for sharing how they responded.'}
              </p>
            ) : null}
          </div>
        ) : (
          <SunlightBar value={buddy.sunlightToday} />
        )}
      </Card>

      {!traveling && !journey?.completed ? (
        <Button fullWidth disabled={!buddy.journeyReady || starting} onClick={handleStart}>
          {starting ? 'Starting…' : buddy.journeyReady ? `Send ${buddy.name} on a journey` : 'Need 100 sunlight'}
        </Button>
      ) : null}

      <Button variant="secondary" fullWidth onClick={() => { refresh(); refreshBuddy(); }}>
        Refresh status
      </Button>

      <Link
        to="/garden/buddy"
        className="block text-center text-sm font-semibold text-emerald-800 hover:underline"
      >
        ← Back to buddy home
      </Link>

      {completedWithDiscovery && journey.discovery ? (
        <DiscoveryModal
          discovery={journey.discovery}
          dewdropsEarned={data?.dewdropsEarned ?? journey.dewdropsEarned}
          stageAdvanced={data?.stageAdvanced}
          newGrowthStage={data?.newGrowthStage}
          onChoice={handleDiscoveryChoice}
          onDone={() => {
            setDiscoveryOutcome('');
            refresh();
          }}
          choiceOutcome={discoveryOutcome}
          choiceReaction={discoveryReaction}
          busy={responding}
        />
      ) : null}
    </div>
  );
}
