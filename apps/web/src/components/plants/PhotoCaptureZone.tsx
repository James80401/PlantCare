import { useRef, type ChangeEvent } from 'react';
import { cn } from '../../lib/cn';

export function PhotoCaptureZone({
  label,
  hint,
  busy,
  previewUrl,
  onFile,
  className,
}: {
  label: string;
  hint?: string;
  busy?: boolean;
  previewUrl?: string | null;
  onFile: (file: File) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border-2 border-dashed transition',
          'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
          busy && 'opacity-70 pointer-events-none',
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="aspect-[4/3] w-full object-cover" />
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
            <span className="text-sm font-semibold text-emerald-800">Identifying…</span>
          </div>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}
