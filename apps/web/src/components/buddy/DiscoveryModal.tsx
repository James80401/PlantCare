import { Button } from '../ui/Button';
import type { JourneyDiscovery } from '../../hooks/buddy/types';

interface DiscoveryModalProps {
  discovery: JourneyDiscovery;
  dewdropsEarned: number;
  stageAdvanced?: boolean;
  newGrowthStage?: string;
  onChoice: (choice: number) => void;
  busy?: boolean;
}

export default function DiscoveryModal({
  discovery,
  dewdropsEarned,
  stageAdvanced,
  newGrowthStage,
  onChoice,
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
          Discovery!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{discovery.story}</p>
        <p className="mt-3 text-sm font-semibold text-amber-800">+{dewdropsEarned} dewdrops 💧</p>
        {stageAdvanced && newGrowthStage ? (
          <p className="mt-2 text-sm font-semibold text-emerald-800">
            Your buddy grew to a new stage: {newGrowthStage.replace(/_/g, ' ').toLowerCase()}!
          </p>
        ) : null}
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          How did your buddy respond?
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Button type="button" fullWidth disabled={busy} onClick={() => onChoice(0)}>
            {discovery.choiceA}
          </Button>
          <Button type="button" variant="secondary" fullWidth disabled={busy} onClick={() => onChoice(1)}>
            {discovery.choiceB}
          </Button>
        </div>
      </div>
    </div>
  );
}
