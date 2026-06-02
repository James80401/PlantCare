import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBuddyCompanion } from '../../context/BuddyCompanionContext';
import { pickBuddyPhrase, pushRecentPhraseId } from './pickBuddyPhrase';
import BuddyCompanionAnimated from './BuddyCompanionAnimated';
import BuddyCuteFace from './BuddyCuteFace';
import MoodIndicator from './MoodIndicator';
import SunlightBar from './SunlightBar';
import { GROWTH_STAGE_LABEL } from './species';
import {
  readBuddyCompanionMode,
  writeBuddyCompanionMode,
} from '../../hooks/buddy/displayMode';
import { isBuddyCompanionMode, type BuddyCompanionMode } from '../../hooks/buddy/types';

const ACTIONS = [
  { to: '/garden/buddy', label: 'Home', emoji: '🏠' },
  { to: '/garden/buddy/activities', label: 'Activities', emoji: '✨' },
  { to: '/garden/buddy/quests', label: 'Quests', emoji: '🎯' },
  { to: '/garden/buddy/journey', label: 'Journey', emoji: '🗺️' },
  { to: '/garden/buddy/town', label: 'Town', emoji: '🌻' },
  { to: '/garden/buddy/style', label: 'Style', emoji: '👒' },
] as const;

const PHRASE_ROTATE_MS = 9_000;

const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconMinimize() {
  return (
    <svg {...iconBase} aria-hidden>
      <path d="M5 12h14" />
    </svg>
  );
}

function IconHide() {
  return (
    <svg {...iconBase} aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a12.6 12.6 0 0 1-2.3 4" />
      <path d="M6.6 6.6A12.1 12.1 0 0 0 2 12c1 3.5 5 8 10 8a10.8 10.8 0 0 0 4.2-.9" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg {...iconBase} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Back soon';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function BuddyFloatingCompanion() {
  const location = useLocation();
  const {
    buddy,
    missing,
    loading,
    journey,
    traveling,
    greeting,
    phraseContext,
    loadGreeting,
    refresh,
    updateBuddy,
  } = useBuddyCompanion();
  const [expanded, setExpanded] = useState(false);
  const [displayMode, setDisplayMode] = useState<BuddyCompanionMode>(() => readBuddyCompanionMode());
  const [phraseTick, setPhraseTick] = useState(0);
  const [recentPhraseIds, setRecentPhraseIds] = useState<string[]>([]);
  const [displayPhrase, setDisplayPhrase] = useState('…');
  const [speechKey, setSpeechKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingModeRef = useRef<BuddyCompanionMode | null>(null);
  const modeSaveInFlightRef = useRef(false);

  const hideOnRoute = location.pathname.includes('/buddy/onboarding');

  const persistDisplayMode = useCallback(
    (mode: BuddyCompanionMode) => {
      if (!buddy?.id || modeSaveInFlightRef.current) return;
      modeSaveInFlightRef.current = true;
      void updateBuddy({ floatingCompanionMode: mode })
        .then((updated) => {
          if (updated?.floatingCompanionMode === mode && pendingModeRef.current === mode) {
            pendingModeRef.current = null;
          }
        })
        .catch(() => {
          pendingModeRef.current = mode;
        })
        .finally(() => {
          modeSaveInFlightRef.current = false;
          const nextMode = pendingModeRef.current;
          if (nextMode && nextMode !== mode) {
            persistDisplayMode(nextMode);
          }
        });
    },
    [buddy?.id, updateBuddy],
  );

  useEffect(() => {
    if (!buddy?.id) return;
    const serverMode = isBuddyCompanionMode(buddy.floatingCompanionMode)
      ? buddy.floatingCompanionMode
      : 'visible';
    const pendingMode = pendingModeRef.current;

    if (pendingMode) {
      if (pendingMode === serverMode) {
        pendingModeRef.current = null;
      } else {
        persistDisplayMode(pendingMode);
      }
      return;
    }

    setDisplayMode(serverMode);
    writeBuddyCompanionMode(serverMode);
  }, [buddy?.id, buddy?.floatingCompanionMode, persistDisplayMode]);

  useEffect(() => {
    if (!phraseContext) return;
    const picked = pickBuddyPhrase({
      context: phraseContext,
      recentIds: recentPhraseIds,
      preferApiGreeting: Boolean(greeting),
      tick: phraseTick,
    });
    setDisplayPhrase(picked.text);
    setRecentPhraseIds((prev) => pushRecentPhraseId(prev, picked.id));
    setSpeechKey((k) => k + 1);
  }, [phraseTick, phraseContext, greeting]);

  useEffect(() => {
    if (hideOnRoute || loading || missing || !phraseContext) return;
    const id = window.setInterval(() => {
      setPhraseTick((t) => t + 1);
    }, PHRASE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [hideOnRoute, loading, missing, phraseContext]);

  useEffect(() => {
    if (expanded) loadGreeting();
  }, [expanded, loadGreeting, buddy?.id]);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setExpanded(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded]);

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  if (hideOnRoute) return null;

  const dockClass =
    'pointer-events-none fixed right-0 z-50 flex flex-col items-end pr-[max(0px,env(safe-area-inset-right))] ' +
    'max-sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-sm:top-auto max-sm:translate-y-0 ' +
    'sm:top-1/2 sm:-translate-y-1/2';

  const setBuddyDisplayMode = (mode: BuddyCompanionMode) => {
    setDisplayMode(mode);
    setExpanded(false);
    writeBuddyCompanionMode(mode);
    pendingModeRef.current = mode;
    persistDisplayMode(mode);
  };

  if (displayMode === 'hidden') {
    return (
      <div className={dockClass}>
        <button
          type="button"
          onClick={() => setBuddyDisplayMode('visible')}
          className="pointer-events-auto mr-0 rounded-l-full border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-lg shadow-emerald-950/10 hover:bg-emerald-50"
          aria-label={buddy ? `Show ${buddy.name}` : 'Show plant buddy'}
        >
          Buddy
        </button>
      </div>
    );
  }

  if (loading) {
    if (displayMode === 'minimized') {
      return (
        <div className={dockClass} aria-hidden>
          <div className="pointer-events-none mr-1 h-12 w-12 rounded-full border border-emerald-100 bg-emerald-50/90 shadow-md" />
        </div>
      );
    }
    return (
      <div className={dockClass} aria-hidden>
        <div className="pointer-events-none mr-1 flex items-center gap-2">
          <div className="buddy-speech-in max-w-[11rem] rounded-2xl rounded-br-sm border border-emerald-100 bg-white/95 px-3 py-2 text-sm text-emerald-800 shadow-md">
            …
          </div>
          <div className="buddy-act-bob h-28 w-28 rounded-full border-2 border-emerald-100 bg-emerald-50/90 shadow-lg" />
        </div>
      </div>
    );
  }

  if (missing) {
    if (displayMode === 'minimized') {
      return (
        <div ref={panelRef} className={dockClass}>
          <button
            type="button"
            onClick={() => setBuddyDisplayMode('visible')}
            className="pointer-events-auto mr-1 flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-200 bg-white text-xl shadow-lg shadow-emerald-900/10 hover:scale-105"
            aria-label="Show plant buddy adoption prompt"
          >
            <span aria-hidden>+</span>
          </button>
        </div>
      );
    }
    return (
      <div ref={panelRef} className={dockClass}>
        <div className="pointer-events-auto mr-2 flex items-center gap-2">
          <div className="buddy-speech-in max-w-[11rem] rounded-2xl rounded-br-sm border border-emerald-200 bg-white/95 px-3 py-2 text-sm font-medium leading-snug text-emerald-900 shadow-lg shadow-emerald-900/10">
            Adopt a buddy — they’ll cheer you on every day!
          </div>
          <Link
            to="/garden/buddy/onboarding"
            className="buddy-act-bob relative flex h-28 w-28 translate-x-2 items-center justify-center rounded-full border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 text-5xl shadow-lg shadow-emerald-900/15 transition hover:scale-105"
            aria-label="Get a plant buddy"
          >
            <span className="relative" role="img" aria-hidden>
              🌱
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <BuddyCuteFace expression="happy" size="md" />
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setBuddyDisplayMode('hidden')}
            title="Hide plant buddy prompt"
            className="self-start inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-100 bg-white/95 p-2 text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Hide plant buddy prompt"
          >
            <IconHide />
          </button>
        </div>
      </div>
    );
  }

  if (!buddy) return null;

  const journeyLabel = journey
    ? `${journey.biomeEmoji} ${journey.biomeName} · ${formatCountdown(journey.remainingSeconds)}`
    : 'On a grow journey';

  const travelPhrase = displayPhrase;

  if (displayMode === 'minimized') {
    return (
      <div ref={panelRef} className={dockClass}>
        <div className="pointer-events-auto mr-1 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setBuddyDisplayMode('visible')}
            className={`buddy-hang-peek flex h-16 w-16 translate-x-2 items-center justify-center rounded-full border-2 shadow-lg transition hover:scale-105 ${
              traveling
                ? 'border-sky-200 bg-gradient-to-br from-sky-100 to-amber-50 shadow-sky-900/15'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 shadow-emerald-900/10'
            }`}
            aria-label={`Show ${buddy.name}`}
          >
            <BuddyCompanionAnimated
              speciesId={buddy.speciesId}
              size="sm"
              traveling={traveling}
              mood={buddy.mood}
              phraseContext={phraseContext}
            />
          </button>
          <button
            type="button"
            onClick={() => setBuddyDisplayMode('hidden')}
            title={`Hide ${buddy.name}`}
            className="translate-x-1 inline-flex min-h-9 min-w-9 items-center justify-center rounded-l-full border border-emerald-100 bg-white/95 p-2 text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label={`Hide ${buddy.name}`}
          >
            <IconHide />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={dockClass}>
      <div className="pointer-events-auto mr-1 flex flex-col items-end gap-2">
        {expanded && (
          <div
            role="dialog"
            aria-label={`${buddy.name} companion menu`}
            className="buddy-panel-in mr-2 w-[min(18rem,calc(100vw-5rem))] overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 shadow-xl shadow-emerald-950/15 backdrop-blur-md"
          >
            <div
              className={`px-4 pt-4 pb-3 ${traveling ? 'bg-gradient-to-br from-sky-50 to-amber-50' : 'bg-gradient-to-br from-emerald-50 to-lime-50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    {traveling ? 'Traveling' : 'Plant Buddy'}
                  </p>
                  <p className="font-display text-lg font-bold text-emerald-950">{buddy.name}</p>
                  <p className="text-xs text-gray-600">
                    {GROWTH_STAGE_LABEL[buddy.growthStage] ?? buddy.growthStage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  title="Close buddy menu"
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full p-2 text-gray-500 hover:bg-white/80 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  aria-label="Close buddy menu"
                >
                  ✕
                </button>
              </div>

              <div
                className={`mt-3 flex justify-center ${traveling ? 'buddy-travel-stage' : ''}`}
              >
            <BuddyCompanionAnimated
              speciesId={buddy.speciesId}
              size="md"
              traveling={traveling}
              mood={buddy.mood}
              phraseContext={phraseContext}
            />
              </div>

              {traveling ? (
                <div className="mt-3 space-y-2">
                  <p className="text-center text-sm font-medium text-sky-900">{journeyLabel}</p>
                  {journey && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${journey.progressPercent}%` }}
                      />
                    </div>
                  )}
                  <p className="text-center text-xs text-sky-800/80">
                    Complete tasks to help them return sooner
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <MoodIndicator mood={buddy.mood} />
                  <SunlightBar value={buddy.sunlightToday} compact />
                </div>
              )}
            </div>

            {greeting && (
              <p className="border-t border-emerald-50 px-4 py-2.5 text-sm leading-snug text-emerald-900/90">
                {greeting}
              </p>
            )}

            <nav className="grid grid-cols-3 gap-1 border-t border-emerald-50 p-2">
              {ACTIONS.map(({ to, label, emoji }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setExpanded(false)}
                  className="flex flex-col items-center rounded-2xl px-1 py-2.5 text-center text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <span className="text-lg" aria-hidden>
                    {emoji}
                  </span>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap gap-2 border-t border-emerald-50 px-3 py-2">
              <Link
                to="/garden/tasks"
                onClick={() => setExpanded(false)}
                className="flex-1 rounded-xl bg-emerald-800 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-900"
              >
                Care tasks
              </Link>
              <button
                type="button"
                onClick={() => refresh()}
                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setBuddyDisplayMode('minimized')}
                title={`Minimize ${buddy.name}`}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-emerald-200 p-2 text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label={`Minimize ${buddy.name}`}
              >
                <IconMinimize />
              </button>
              <button
                type="button"
                onClick={() => setBuddyDisplayMode('hidden')}
                title={`Hide ${buddy.name}`}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-emerald-200 p-2 text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label={`Hide ${buddy.name}`}
              >
                <IconHide />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="flex items-start gap-1">
              <p
                key={speechKey}
                className="buddy-speech-in max-w-[10rem] rounded-2xl rounded-br-sm border border-emerald-100 bg-white/95 px-3 py-2 text-sm font-medium leading-snug text-emerald-900 shadow-lg shadow-emerald-950/10 max-sm:max-w-[8.5rem] max-sm:text-xs"
                role="status"
                aria-live="polite"
              >
                {travelPhrase}
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setBuddyDisplayMode('minimized')}
                  title={`Minimize ${buddy.name}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-100 bg-white/95 p-2 text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  aria-label={`Minimize ${buddy.name}`}
                >
                  <IconMinimize />
                </button>
                <button
                  type="button"
                  onClick={() => setBuddyDisplayMode('hidden')}
                  title={`Hide ${buddy.name}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-100 bg-white/95 p-2 text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  aria-label={`Hide ${buddy.name}`}
                >
                  <IconHide />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={
              expanded ? `Minimize ${buddy.name}` : `Talk to ${buddy.name} — ${travelPhrase}`
            }
            className={`buddy-hang-peek relative flex translate-x-4 items-center justify-center overflow-visible rounded-full border-[3px] shadow-xl transition hover:scale-105 active:scale-95 ${
              expanded
                ? 'buddy-chip-expanded h-36 w-36 ring-2 ring-emerald-400 ring-offset-2'
                : 'h-24 w-24 max-sm:h-20 max-sm:w-20'
            } ${
              traveling
                ? 'border-sky-200 bg-gradient-to-br from-sky-100 to-amber-50 shadow-sky-900/20'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 shadow-emerald-900/15'
            }`}
          >
            {traveling && (
              <>
                <span className="buddy-trail-dot absolute -left-2 top-1/2 h-2 w-2" aria-hidden />
                <span
                  className="buddy-trail-dot absolute -left-5 top-1/3 h-2 w-2 animation-delay-150"
                  aria-hidden
                />
                <span
                  className="buddy-trail-dot absolute -left-3 bottom-1/3 h-2 w-2 animation-delay-300"
                  aria-hidden
                />
              </>
            )}
            <BuddyCompanionAnimated
              speciesId={buddy.speciesId}
              size={expanded ? 'md' : 'sm'}
              traveling={traveling}
              mood={buddy.mood}
              phraseContext={phraseContext}
            />
            {traveling && (
              <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs text-white shadow">
                ✈
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
