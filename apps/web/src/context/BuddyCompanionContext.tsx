import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { buddyApi, dashboardApi } from '../services/api';
import { trackEvent } from '../utils/analytics';
import type { BuddyCompanionMode, BuddyState, BuddyTrait, JourneyState } from '../hooks/buddy/types';
import { isJourneyTraveling } from '../hooks/buddy/useJourney';
import { useInterval } from '../hooks/useInterval';
import {
  buildBuddyPhraseContext,
  EMPTY_GARDEN_METRICS,
  type BuddyPhraseContext,
  type GardenMetrics,
} from '../components/buddy/buddyPhraseContext';

interface BuddyCompanionContextValue {
  buddy: BuddyState | null;
  missing: boolean;
  loading: boolean;
  journey: JourneyState | null;
  traveling: boolean;
  greeting: string;
  gardenMetrics: GardenMetrics;
  phraseContext: BuddyPhraseContext | null;
  refresh: () => Promise<void>;
  refreshJourney: () => Promise<void>;
  refreshGardenMetrics: () => Promise<void>;
  loadGreeting: () => Promise<void>;
  updateBuddy: (data: BuddyUpdateInput) => Promise<BuddyState | null>;
}

interface BuddyUpdateInput {
  name?: string;
  trait?: BuddyTrait;
  speciesId?: string;
  equippedItems?: Record<string, unknown>;
  terrariumLayout?: Record<string, unknown>;
  terrariumBackground?: string;
  floatingCompanionMode?: BuddyCompanionMode;
}

const BuddyCompanionContext = createContext<BuddyCompanionContextValue | null>(null);

const BUDDY_ENABLED = import.meta.env.VITE_ENABLE_PLANT_BUDDY === 'true';

export function BuddyCompanionProvider({ children }: { children: ReactNode }) {
  const [buddy, setBuddy] = useState<BuddyState | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<JourneyState | null>(null);
  const [greeting, setGreeting] = useState('');
  const [gardenMetrics, setGardenMetrics] = useState<GardenMetrics>(EMPTY_GARDEN_METRICS);
  const trackedJourneyCompleteId = useRef<string | null>(null);

  const refreshGardenMetrics = useCallback(async () => {
    try {
      const { data } = await dashboardApi.get();
      const m = data.metrics;
      setGardenMetrics({
        totalPlants: m?.totalPlants ?? 0,
        dueToday: m?.dueToday ?? 0,
        overdue: m?.overdue ?? 0,
        completedToday: m?.completedToday ?? 0,
      });
    } catch {
      /* keep last snapshot */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await buddyApi.get();
      setBuddy(data);
      setMissing(false);
      if (!data.hasActiveJourney) setJourney(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setBuddy(null);
        setMissing(true);
        setJourney(null);
      }
    } finally {
      setLoading(false);
    }
    await refreshGardenMetrics();
  }, [refreshGardenMetrics]);

  const refreshJourney = useCallback(async () => {
    if (!buddy) return;
    try {
      const { data } = await buddyApi.getJourney();
      const next = data.journey ?? null;
      setJourney(next);
      if (data.buddy) setBuddy(data.buddy);
      if (
        next?.completed &&
        next.id &&
        trackedJourneyCompleteId.current !== next.id
      ) {
        trackedJourneyCompleteId.current = next.id;
        trackEvent('BuddyJourneyCompleted', { biomeId: next.biomeId });
      }
    } catch {
      /* keep last journey snapshot */
    }
  }, [buddy]);

  const updateBuddy = useCallback(async (data: BuddyUpdateInput) => {
    const res = await buddyApi.update(data);
    setBuddy(res.data);
    setMissing(false);
    return res.data;
  }, []);

  const loadGreeting = useCallback(async () => {
    if (!buddy) return;
    try {
      const { data } = await buddyApi.greeting();
      setGreeting(data.message);
    } catch {
      setGreeting('');
    }
  }, [buddy]);

  useEffect(() => {
    // Plant Buddy is a post-release feature — keep the provider mountable
    // (so useBuddyCompanion() stays safe to call everywhere) but never fetch.
    if (!BUDDY_ENABLED) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (buddy?.hasActiveJourney) refreshJourney();
  }, [buddy?.hasActiveJourney, buddy?.id, refreshJourney]);

  const wasOnJourney = useRef(false);
  useEffect(() => {
    const active = Boolean(buddy?.hasActiveJourney);
    if (wasOnJourney.current && !active) {
      void refreshJourney();
    }
    wasOnJourney.current = active;
  }, [buddy?.hasActiveJourney, refreshJourney]);

  useEffect(() => {
    if (buddy) loadGreeting();
  }, [buddy?.id, loadGreeting]);

  useInterval(refreshGardenMetrics, 60_000, BUDDY_ENABLED);

  const traveling = isJourneyTraveling(journey) || Boolean(buddy?.hasActiveJourney);

  useInterval(refreshJourney, 30_000, BUDDY_ENABLED && traveling);

  const phraseContext = useMemo(() => {
    if (!buddy) return null;
    return buildBuddyPhraseContext(buddy, journey, traveling, gardenMetrics, greeting || undefined);
  }, [buddy, journey, traveling, gardenMetrics, greeting]);

  const value = useMemo(
    () => ({
      buddy,
      missing,
      loading,
      journey,
      traveling,
      greeting,
      gardenMetrics,
      phraseContext,
      refresh,
      refreshJourney,
      refreshGardenMetrics,
      loadGreeting,
      updateBuddy,
    }),
    [
      buddy,
      missing,
      loading,
      journey,
      traveling,
      greeting,
      gardenMetrics,
      phraseContext,
      refresh,
      refreshJourney,
      refreshGardenMetrics,
      loadGreeting,
      updateBuddy,
    ],
  );

  return (
    <BuddyCompanionContext.Provider value={value}>{children}</BuddyCompanionContext.Provider>
  );
}

export function useBuddyCompanion() {
  const ctx = useContext(BuddyCompanionContext);
  if (!ctx) {
    throw new Error('useBuddyCompanion must be used within BuddyCompanionProvider');
  }
  return ctx;
}

/** Safe for optional UI — returns null outside provider. */
export function useBuddyCompanionOptional() {
  return useContext(BuddyCompanionContext);
}
