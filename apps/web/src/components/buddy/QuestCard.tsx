import { Button } from '../ui/Button';

export interface QuestCardData {
  questId: string;
  title: string;
  description: string;
  progress: number;
  required: number;
  completed: boolean;
  rewardClaimed: boolean;
  rewardDewdrops: number;
}

interface QuestCardProps {
  quest: QuestCardData;
  claiming?: boolean;
  onClaim?: (questId: string) => void;
}

export default function QuestCard({ quest, claiming, onClaim }: QuestCardProps) {
  const pct = Math.min(100, Math.round((quest.progress / quest.required) * 100));

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-emerald-950">{quest.title}</p>
          <p className="mt-1 text-sm text-gray-600">{quest.description}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-amber-800">{quest.rewardDewdrops} 💧</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {quest.progress} / {quest.required}
      </p>
      {quest.completed && !quest.rewardClaimed && onClaim && (
        <Button
          type="button"
          size="sm"
          className="mt-3"
          disabled={claiming}
          onClick={() => onClaim(quest.questId)}
        >
          Claim reward
        </Button>
      )}
      {quest.rewardClaimed && (
        <p className="mt-2 text-xs font-medium text-emerald-700">Reward claimed</p>
      )}
    </div>
  );
}
