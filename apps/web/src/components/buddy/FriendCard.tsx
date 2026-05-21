import { Link } from 'react-router-dom';
import { speciesEmoji } from './species';
import { Button } from '../ui/Button';

export interface FriendCardData {
  friendshipId: string;
  friendBuddyId: string;
  buddyName: string;
  ownerName: string | null;
  speciesId: string;
  growthStage: string;
  mood: string;
  level: number;
  levelName: string;
  points: number;
  sunshineSentToday: boolean;
  lastActiveLabel: string;
}

interface FriendCardProps {
  friend: FriendCardData;
  shining?: boolean;
  onShine?: (friendBuddyId: string) => void;
}

export default function FriendCard({ friend, shining, onShine }: FriendCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <Link
        to={`/garden/buddy/town/${friend.friendBuddyId}`}
        className="flex items-center gap-3"
      >
        <span className="text-4xl" aria-hidden>
          {speciesEmoji(friend.speciesId)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-emerald-950">{friend.buddyName}</p>
          <p className="text-xs text-gray-500">
            {friend.ownerName ? `${friend.ownerName} · ` : ''}
            {friend.lastActiveLabel}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            {friend.levelName} · {friend.points} pts
          </p>
        </div>
      </Link>
      <Button
        type="button"
        size="sm"
        fullWidth
        className="mt-3"
        variant={friend.sunshineSentToday ? 'secondary' : 'primary'}
        disabled={friend.sunshineSentToday || shining}
        onClick={() => onShine?.(friend.friendBuddyId)}
      >
        {friend.sunshineSentToday ? 'Sent ✓' : '☀️ Shine'}
      </Button>
    </div>
  );
}
