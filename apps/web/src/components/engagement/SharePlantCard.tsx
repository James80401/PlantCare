import { useEffect, useRef, useState } from 'react';
import { formatSharePlantText, type SharePlantSnapshot } from '../../utils/engagement';

export function SharePlantCard({
  snapshot,
  onClose,
}: {
  snapshot: SharePlantSnapshot;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const shareText = formatSharePlantText(snapshot);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setShareError('');
    } catch {
      setShareError('Could not copy. Select the text below and copy manually.');
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copyText();
      return;
    }
    try {
      await navigator.share({
        title: snapshot.plantName,
        text: shareText,
      });
      onClose();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setShareError('Sharing was cancelled or is not available on this device.');
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100%,24rem)] max-w-lg rounded-3xl border border-emerald-100 bg-white p-0 text-emerald-950 shadow-2xl backdrop:bg-emerald-950/40"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Share plant card
            </p>
            <h2 className="mt-1 text-lg font-semibold font-display">Spread the green</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <article className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-800 to-lime-700 p-4 text-white shadow-inner">
          <p className="text-3xl" aria-hidden>
            🌿
          </p>
          <h3 className="mt-2 text-xl font-bold">{snapshot.plantName}</h3>
          <p className="text-sm text-emerald-50/90">{snapshot.speciesName}</p>
          {snapshot.scientificName ? (
            <p className="mt-1 text-xs italic text-emerald-50/75">{snapshot.scientificName}</p>
          ) : null}
          <dl className="mt-4 space-y-1 text-sm text-emerald-50/95">
            {snapshot.location ? (
              <div>
                <dt className="sr-only">Location</dt>
                <dd>📍 {snapshot.location}</dd>
              </div>
            ) : null}
            {snapshot.sunlight ? (
              <div>
                <dt className="sr-only">Light</dt>
                <dd>☀️ {snapshot.sunlight}</dd>
              </div>
            ) : null}
            {snapshot.nextCareLabel ? (
              <div>
                <dt className="sr-only">Next care</dt>
                <dd>Next: {snapshot.nextCareLabel}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-4 text-xs font-medium text-emerald-100/90">Plant Care</p>
        </article>

        <pre className="mt-4 max-h-32 overflow-auto rounded-2xl bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
          {shareText}
        </pre>

        {shareError ? <p className="mt-2 text-sm text-amber-800">{shareError}</p> : null}
        {copied ? (
          <p className="mt-2 text-sm font-medium text-emerald-800">Copied to clipboard.</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Share
          </button>
          <button
            type="button"
            onClick={copyText}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Copy text
          </button>
        </div>
      </div>
    </dialog>
  );
}
