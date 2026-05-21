interface SunlightBarProps {
  value: number;
  max?: number;
}

export default function SunlightBar({ value, max = 100 }: SunlightBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
        <span>Sunlight today</span>
        <span>
          {value}/{max} ☀️
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 100 ? (
        <p className="text-xs font-medium text-amber-800">Ready for a grow journey!</p>
      ) : (
        <p className="text-xs text-gray-500">Complete care tasks to fill the bar.</p>
      )}
    </div>
  );
}
