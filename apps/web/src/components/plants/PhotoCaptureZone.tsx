import { useRef, type ChangeEvent } from 'react';
import { cn } from '../../lib/cn';
import { resolveApiAssetUrl } from '../../utils/apiAssets';

export function PhotoCaptureZone({
  label,
  hint,
  busy,
  busyLabel = 'Identifying...',
  previewUrl,
  onFile,
  className,
  sourceMode = 'camera',
}: {
  label: string;
  hint?: string;
  busy?: boolean;
  busyLabel?: string;
  previewUrl?: string | null;
  onFile: (file: File) => void;
  className?: string;
  sourceMode?: 'camera' | 'library' | 'both';
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const showSourceActions = sourceMode === 'both';
  const resolvedPreviewUrl = resolveApiAssetUrl(previewUrl);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  const openPreferredSource = () => {
    if (sourceMode === 'camera') {
      cameraInputRef.current?.click();
      return;
    }
    libraryInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        disabled={busy}
        onClick={openPreferredSource}
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border-2 border-dashed transition',
          'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
          busy && 'opacity-70 pointer-events-none',
        )}
      >
        {resolvedPreviewUrl ? (
          <img
            src={resolvedPreviewUrl}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-4xl" aria-hidden>
              📷
            </span>
            <span className="font-semibold text-emerald-900">{label}</span>
            {hint ? <span className="text-sm text-gray-600">{hint}</span> : null}
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="text-sm font-semibold text-emerald-800">{busyLabel}</span>
          </div>
        ) : null}
      </button>
      {showSourceActions ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              'min-h-11 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition',
              'hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
              busy && 'pointer-events-none opacity-70',
            )}
          >
            Take photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => libraryInputRef.current?.click()}
            className={cn(
              'min-h-11 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition',
              'hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
              busy && 'pointer-events-none opacity-70',
            )}
          >
            Upload from files
          </button>
        </div>
      ) : null}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={onChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}
