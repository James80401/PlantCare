import { useState } from 'react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { estimateLightLevelFromImage, type LightLevel } from '../../utils/lightMeter';

const LEVEL_LABELS: Record<LightLevel, string> = {
  low: 'Low light',
  medium: 'Medium light',
  high: 'Bright light',
};

export interface LightMeterButtonProps {
  /** Called with the estimated level when the user applies the reading. */
  onApply: (level: LightLevel) => void;
  className?: string;
}

/** Lets a user snap a photo of where a plant sits and get a rough light-level
 *  estimate from its average brightness — a phone camera auto-exposes, so
 *  this is a relative read, not a calibrated lux meter, and the copy says so.
 *  Reuses the same file-input + capture="environment" pattern as every other
 *  camera entry point in this app (PhotoCaptureZone, DiagnosisForm) rather
 *  than a live getUserMedia preview, which behaves inconsistently inside the
 *  Capacitor WebView this app ships as an Android app through. */
export function LightMeterButton({ onApply, className }: LightMeterButtonProps) {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [level, setLevel] = useState<LightLevel | null>(null);

  const close = () => {
    setOpen(false);
    setLevel(null);
    setError('');
  };
  const { titleId, dialogRef, initialFocusRef } = useDialogA11y(open, close);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setLevel(null);
    try {
      const reading = await estimateLightLevelFromImage(file);
      setLevel(reading.level);
    } catch {
      setError('Could not read that photo. Try again with a clearer shot.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'text-xs font-semibold text-emerald-700 hover:underline'}
      >
        📷 Measure with camera
      </button>
      {open ? (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={close} />
          <div className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-sm sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="font-display text-lg font-bold text-emerald-950">
                Light meter
              </h2>
              <button
                ref={initialFocusRef}
                type="button"
                onClick={close}
                aria-label="Close light meter"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Take a photo of the spot where your plant sits. This gives a rough estimate from
              your camera's exposure — not a calibrated lux reading — but it beats guessing.
            </p>

            <label className="mt-4 block">
              <span className="sr-only">Take a photo of the spot</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-800"
              />
            </label>

            {analyzing ? <p className="mt-3 text-sm text-gray-500">Reading brightness…</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            {level && !analyzing ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-900">
                  Looks like <span className="font-semibold">{LEVEL_LABELS[level]}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onApply(level);
                    close();
                  }}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  Use this reading
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
