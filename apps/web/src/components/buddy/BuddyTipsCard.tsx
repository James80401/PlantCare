import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const STORAGE_KEY = 'buddy_home_tips_dismissed_v1';

const TIPS = [
  {
    title: 'Grow with your garden',
    body: 'Complete care tasks to fill your buddy’s sunlight bar. When it’s full, send them on a grow journey.',
    cta: 'View tasks',
    to: '/garden/tasks',
  },
  {
    title: 'Guided activities',
    body: 'Watering checks, journals, and season checks earn sunlight and dewdrops — and can sync your task list.',
    cta: 'Open activities',
    to: '/garden/buddy/activities',
  },
  {
    title: 'Daily quests',
    body: 'Three rotating goals each day. Claim dewdrop rewards when a quest completes.',
    cta: 'See quests',
    to: '/garden/buddy/quests',
  },
  {
    title: 'Garden Town',
    body: 'Share your garden code, visit friends’ terrariums, and send sunshine once per friend per day.',
    cta: 'Visit town',
    to: '/garden/buddy/town',
  },
] as const;

export default function BuddyTipsCard() {
  const [dismissed, setDismissed] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  if (dismissed) return null;

  const tip = TIPS[index];

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50/80">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Buddy tips · {index + 1}/{TIPS.length}
        </p>
        <button
          type="button"
          className="text-xs font-medium text-gray-500 hover:text-emerald-900"
          onClick={dismiss}
        >
          Dismiss
        </button>
      </div>
      <p className="mt-2 text-sm font-semibold text-emerald-950">{tip.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-900/90">{tip.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {index > 0 && (
          <Button type="button" size="sm" variant="secondary" onClick={() => setIndex((i) => i - 1)}>
            Back
          </Button>
        )}
        {index < TIPS.length - 1 ? (
          <Button type="button" size="sm" onClick={() => setIndex((i) => i + 1)}>
            Next tip
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={dismiss}>
            Got it
          </Button>
        )}
        <Link
          to={tip.to}
          className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-semibold text-emerald-800 hover:underline"
        >
          {tip.cta} →
        </Link>
      </div>
    </Card>
  );
}
