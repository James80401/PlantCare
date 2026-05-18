import { useState } from 'react';

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
  const [position, setPosition] = useState(50);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Photo compare
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Drag the slider to compare two journal photos from this plant.
        </p>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-900">
        <img src={afterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          aria-label="Compare photos"
          className="absolute inset-x-4 bottom-4 z-10 w-[calc(100%-2rem)] accent-emerald-600"
          onChange={(event) => setPosition(Number(event.currentTarget.value))}
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}
