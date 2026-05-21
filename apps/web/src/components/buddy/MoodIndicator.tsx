import type { BuddyMood } from '../../hooks/buddy/types';

const MOOD_COPY: Record<BuddyMood, { label: string; emoji: string }> = {
  THRIVING: { label: 'Thriving', emoji: '✨' },
  HAPPY: { label: 'Happy', emoji: '😊' },
  CONTENT: { label: 'Content', emoji: '🙂' },
  WILTING: { label: 'Wilting', emoji: '🍂' },
  THIRSTY: { label: 'Thirsty', emoji: '💧' },
  DORMANT: { label: 'Resting', emoji: '😴' },
};

export default function MoodIndicator({ mood }: { mood: BuddyMood }) {
  const m = MOOD_COPY[mood] ?? MOOD_COPY.HAPPY;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
      <span aria-hidden>{m.emoji}</span>
      {m.label}
    </span>
  );
}
