import { useState } from 'react';
import { resolveApiAssetUrl } from '../utils/apiAssets';

interface JournalPhotoCompareProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function JournalPhotoCompare({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Earlier',
  afterLabel = 'Later',
}: JournalPhotoCompareProps) {
  const resolvedBeforeUrl = resolveApiAssetUrl(beforeUrl) ?? beforeUrl;
  const resolvedAfterUrl = resolveApiAssetUrl(afterUrl) ?? afterUrl;
  const [position, setPosition] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side-by-side'>('slider');

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Photo compare
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Compare shape, color, leaf count, and recovery signs between two updates.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-emerald-100">
          {(['slider', 'side-by-side'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`min-h-8 rounded-full px-3 text-xs font-semibold transition ${
                mode === option
                  ? 'bg-emerald-800 text-white'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              {option === 'slider' ? 'Slider' : 'Side by side'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'slider' ? (
        <>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-900">
            <img src={resolvedAfterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
            <img
              src={resolvedBeforeUrl}
              alt={beforeLabel}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            />
            <div
              className="absolute inset-y-0 z-10 w-0.5 bg-white shadow"
              style={{ left: `${position}%` }}
              aria-hidden
            />
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              aria-label="Compare photos"
              className="absolute inset-x-4 bottom-4 z-20 w-[calc(100%-2rem)] accent-emerald-600"
              onChange={(event) => setPosition(Number(event.currentTarget.value))}
            />
            <PhotoLabel label={beforeLabel} className="left-3 top-3" />
            <PhotoLabel label={afterLabel} className="right-3 top-3" />
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>{beforeLabel}</span>
            <span>{afterLabel}</span>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <PhotoPanel url={resolvedBeforeUrl} label={beforeLabel} />
          <PhotoPanel url={resolvedAfterUrl} label={afterLabel} />
        </div>
      )}
    </div>
  );
}

function PhotoLabel({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`absolute z-10 max-w-[45%] rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white ${className}`}
    >
      {label}
    </span>
  );
}

function PhotoPanel({ url, label }: { url: string; label: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-white ring-1 ring-emerald-100">
      <img src={url} alt={label} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      <figcaption className="px-3 py-2 text-xs font-semibold text-emerald-900">
        {label}
      </figcaption>
    </figure>
  );
}
