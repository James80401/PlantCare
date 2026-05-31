import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBuddyCompanion } from '../../context/BuddyCompanionContext';
import { pickBuddyPhrase, pushRecentPhraseId } from './pickBuddyPhrase';
import BuddyCompanionAnimated from './BuddyCompanionAnimated';
import BuddyCuteFace from './BuddyCuteFace';
import MoodIndicator from './MoodIndicator';
import SunlightBar from './SunlightBar';
import { GROWTH_STAGE_LABEL } from './species';

const ACTIONS = [
  { to: '/garden/buddy', label: 'Home', emoji: '🏠' },
  { to: '/garden/buddy/activities', label: 'Activities', emoji: '✨' },
  { to: '/garden/buddy/quests', label: 'Quests', emoji: '🎯' },
  { to: '/garden/buddy/journey', label: 'Journey', emoji: '🗺️' },
  { to: '/garden/buddy/town', label: 'Town', emoji: '🌻' },
  { to: '/garden/buddy/style', label: 'Style', emoji: '👒' },
] as const;

const PHRASE_ROTATE_MS = 9_000;
const DISPLAY_PREF_KEY = 'drplant.buddy.floatingDisplay';

type BuddyDisplayMode = 'visible' | 'minimized' | 'hidden';

function readDisplayMode(): BuddyDisplayMode {
  if (typeof window === 'undefined') return 'visible';
  const raw = window.localStorage.getItem(DISPLAY_PREF_KEY);
  return raw === 'minimized' || raw === 'hidden' ? raw : 'visible';
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
  const { buddy, missing, loading, journey, traveling, greeting, phraseContext, loadGreeting, refresh } =
    useBuddyCompanion();
  const [expanded, setExpanded] = useState(false);
  const [displayMode, setDisplayMode] = useState<BuddyDisplayMode>(() => readDisplayMode());
  const [phraseTick, setPhraseTick] = useState(0);
  const [recentPhraseIds, setRecentPhraseIds] = useState<string[]>([]);
  const [displayPhrase, setDisplayPhrase] = useState('…');
  const [speechKey, setSpeechKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const hideOnRoute =
    location.pathname.includes('/buddy/onboarding') || location.pathname === '/garden/onboarding';

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

  const setBuddyDisplayMode = (mode: BuddyDisplayMode) => {
    setDisplayMode(mode);
    setExpanded(false);
    window.localStorage.setItem(DISPLAY_PREF_KEY, mode);
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
            className="self-start rounded-full border border-emerald-100 bg-white/95 px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
            aria-label="Hide plant buddy prompt"
          >
            Hide
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
            className="translate-x-1 rounded-l-full border border-emerald-100 bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
            aria-label={`Hide ${buddy.name}`}
          >
            Hide
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
                  className="rounded-full p-1.5 text-gray-500 hover:bg-white/80 hover:text-emerald-900"
                  aria-label="Minimize buddy"
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
                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Minimize
              </button>
              <button
                type="button"
                onClick={() => setBuddyDisplayMode('hidden')}
                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Hide
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="flex items-start gap-1">
              <p
                key={speechKey}
                className="buddy-speech-in max-w-[11rem] rounded-2xl rounded-br-sm border border-emerald-100 bg-white/95 px-3 py-2 text-sm font-medium leading-snug text-emerald-900 shadow-lg shadow-emerald-950/10"
                role="status"
                aria-live="polite"
              >
                {travelPhrase}
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setBuddyDisplayMode('minimized')}
                  className="rounded-full border border-emerald-100 bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  aria-label={`Minimize ${buddy.name}`}
                >
                  Min
                </button>
                <button
                  type="button"
                  onClick={() => setBuddyDisplayMode('hidden')}
                  className="rounded-full border border-emerald-100 bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  aria-label={`Hide ${buddy.name}`}
                >
                  Hide
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
                : 'h-28 w-28'
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
