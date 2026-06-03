import { Button } from '../ui/Button';
import type { JourneyDiscovery } from '../../hooks/buddy/types';
import { DiscoveryEncounterCard } from './BuddyJourneyWorld';

interface DiscoveryModalProps {
  discovery: JourneyDiscovery;
  dewdropsEarned: number;
  stageAdvanced?: boolean;
  newGrowthStage?: string;
  onChoice: (choice: number) => void;
  onDone?: () => void;
  choiceOutcome?: string;
  choiceReaction?: string;
  busy?: boolean;
}

export default function DiscoveryModal({
  discovery,
  dewdropsEarned,
  stageAdvanced,
  newGrowthStage,
  onChoice,
  onDone,
  choiceOutcome,
  choiceReaction,
  busy,
}: DiscoveryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 id="discovery-title" className="text-lg font-bold text-emerald-950">
          {discovery.title ?? 'Discovery encounter'}
        </h2>
        <div className="mt-4">
          <DiscoveryEncounterCard discovery={discovery} dewdropsEarned={dewdropsEarned} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{discovery.story}</p>
        <p className="mt-3 text-sm font-semibold text-amber-800">
          +{dewdropsEarned} dewdrops
        </p>
        {stageAdvanced && newGrowthStage ? (
          <p className="mt-2 text-sm font-semibold text-emerald-800">
            Your buddy grew to a new stage: {newGrowthStage.replace(/_/g, ' ').toLowerCase()}!
          </p>
        ) : null}

        {choiceOutcome ? (
          <>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-950">
              <p className="font-semibold">{choiceReaction || 'Choice saved'}</p>
              <p className="mt-1 text-emerald-900">{choiceOutcome}</p>
            </div>
            <Button type="button" fullWidth className="mt-4" onClick={onDone}>
              Done
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              How did your buddy respond?
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <Button type="button" fullWidth disabled={busy} onClick={() => onChoice(0)}>
                <span className="block text-left">
                  <span className="block">{discovery.choiceA}</span>
                  {discovery.outcomeA ? (
                    <span className="mt-1 block text-xs font-medium opacity-80">
                      Outcome: {discovery.outcomeA}
                    </span>
                  ) : null}
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={busy}
                onClick={() => onChoice(1)}
              >
                <span className="block text-left">
                  <span className="block">{discovery.choiceB}</span>
                  {discovery.outcomeB ? (
                    <span className="mt-1 block text-xs font-medium opacity-80">
                      Outcome: {discovery.outcomeB}
                    </span>
                  ) : null}
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
