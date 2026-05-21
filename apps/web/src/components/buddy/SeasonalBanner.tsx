import { Card } from '../ui/Card';

/** Lightweight seasonal nudge until full event system ships. */
export default function SeasonalBanner() {
  const month = new Date().getMonth() + 1;
  if (month < 3 || month > 5) return null;

  return (
    <Card className="border-lime-300 bg-lime-50/90">
      <p className="text-sm font-semibold text-lime-950">Spring garden season</p>
      <p className="mt-1 text-xs text-lime-900">
        Extra sunshine from outdoor care — complete a season check activity this week.
      </p>
    </Card>
  );
}
