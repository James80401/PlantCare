import { useState } from 'react';
import { cn } from '../../lib/cn';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { HELP_TOPICS, type HelpTopicKey } from '../../content/helpTopics';

export interface HelpButtonProps {
  topic: HelpTopicKey;
  className?: string;
}

function IconHelp(props: { className?: string }) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

/** Self-contained "?" help button: owns its own open/close state, so a call
 *  site is just `<HelpButton topic="dashboard" />`. Opens a short, dismissible
 *  tip panel — nothing auto-shows and nothing needs to be remembered, by design. */
export function HelpButton({ topic, className }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const content = HELP_TOPICS[topic];
  const close = () => setOpen(false);
  const { titleId, initialFocusRef } = useDialogA11y(open, close);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Help: ${content.title}`}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white/80 text-emerald-700 transition hover:bg-emerald-50',
          className,
        )}
      >
        <IconHelp className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={close} />
          <div className="relative max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="font-display text-lg font-bold text-emerald-950">
                {content.title}
              </h2>
              <button
                ref={initialFocusRef}
                type="button"
                onClick={close}
                aria-label="Close help"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {content.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
