import { format } from 'date-fns';
import type { MeasurementPoint } from '../../utils/journalMeasurements';
import { formatDelta, heightSeries } from '../../utils/journalMeasurements';

export function GrowthMeasurementsPanel({ points }: { points: MeasurementPoint[] }) {
  const height = heightSeries(points);
  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;

  if (!latest) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
        <p className="text-sm font-semibold text-emerald-950">Track growth over time</p>
        <p className="mt-1 text-sm text-gray-600">
          Add height, width, or leaf count on journal entries to see trends and changes here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-emerald-950">Growth measurements</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {points.length} logged snapshot{points.length === 1 ? '' : 's'}
          {latest.date ? ` - latest ${format(latest.date, 'MMM d, yyyy')}` : ''}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <StatCard
          label="Height"
          value={latest.heightCm != null ? `${latest.heightCm} cm` : '-'}
          delta={
            latest.heightCm != null && previous?.heightCm != null
              ? formatDelta(latest.heightCm, previous.heightCm)
              : undefined
          }
        />
        <StatCard
          label="Width"
          value={latest.widthCm != null ? `${latest.widthCm} cm` : '-'}
          delta={
            latest.widthCm != null && previous?.widthCm != null
              ? formatDelta(latest.widthCm, previous.widthCm)
              : undefined
          }
        />
        <StatCard
          label="Leaves"
          value={latest.leafCount != null ? String(latest.leafCount) : '-'}
          delta={
            latest.leafCount != null && previous?.leafCount != null
              ? `${latest.leafCount - previous.leafCount >= 0 ? '+' : ''}${latest.leafCount - previous.leafCount}`
              : undefined
          }
        />
      </div>

      {height.length >= 2 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Height trend
          </p>
          <HeightSparkline series={height} className="mt-2" />
          <p className="mt-1 text-xs text-gray-500">
            {height[0].value} cm ({format(height[0].date, 'MMM d')}) to{' '}
            {height[height.length - 1].value} cm ({format(height[height.length - 1].date, 'MMM d')})
          </p>
        </div>
      ) : height.length === 1 ? (
        <p className="text-xs text-gray-500">Log height on one more entry to see a trend line.</p>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl bg-emerald-50/80 px-3 py-2.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-emerald-950">{value}</p>
      {delta ? (
        <p
          className={`text-xs font-medium ${
            delta.startsWith('+')
              ? 'text-emerald-700'
              : delta.startsWith('-')
                ? 'text-amber-800'
                : 'text-gray-500'
          }`}
        >
          {delta} vs previous
        </p>
      ) : null}
    </div>
  );
}

function HeightSparkline({
  series,
  className = '',
}: {
  series: Array<{ date: Date; value: number }>;
  className?: string;
}) {
  const values = series.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 56;
  const step = series.length > 1 ? width / (series.length - 1) : width;

  const points = series
    .map((s, i) => {
      const x = series.length > 1 ? i * step : width / 2;
      const y = height - ((s.value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full max-w-full text-emerald-700 ${className}`}
      role="img"
      aria-label="Height measurements over time"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {series.map((s, i) => {
        const x = series.length > 1 ? i * step : width / 2;
        const y = height - ((s.value - min) / range) * (height - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="3.5" fill="currentColor" />;
      })}
    </svg>
  );
}
