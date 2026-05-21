import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buddyApi } from '../services/api';
import type { BuddyState, JourneyState } from '../hooks/buddy/types';
import { isJourneyTraveling } from '../hooks/buddy/useJourney';

interface BuddyCompanionContextValue {
  buddy: BuddyState | null;
  missing: boolean;
  loading: boolean;
  journey: JourneyState | null;
  traveling: boolean;
  greeting: string;
  refresh: () => Promise<void>;
  refreshJourney: () => Promise<void>;
  loadGreeting: () => Promise<void>;
}

const BuddyCompanionContext = createContext<BuddyCompanionContextValue | null>(null);

export function BuddyCompanionProvider({ children }: { children: ReactNode }) {
  const [buddy, setBuddy] = useState<BuddyState | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<JourneyState | null>(null);
  const [greeting, setGreeting] = useState('');

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
  }, []);

  const refreshJourney = useCallback(async () => {
    if (!buddy?.hasActiveJourney) return;
    try {
      const { data } = await buddyApi.getJourney();
      setJourney(data.journey ?? null);
      if (data.buddy) setBuddy(data.buddy);
    } catch {
      /* keep last journey snapshot */
    }
  }, [buddy?.hasActiveJourney]);

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
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (buddy?.hasActiveJourney) refreshJourney();
  }, [buddy?.hasActiveJourney, buddy?.id, refreshJourney]);

  const traveling = isJourneyTraveling(journey) || Boolean(buddy?.hasActiveJourney);

  useEffect(() => {
    if (!traveling) return;
    const id = window.setInterval(refreshJourney, 30_000);
    return () => window.clearInterval(id);
  }, [traveling, refreshJourney]);

  const value = useMemo(
    () => ({
      buddy,
      missing,
      loading,
      journey,
      traveling,
      greeting,
      refresh,
      refreshJourney,
      loadGreeting,
    }),
    [buddy, missing, loading, journey, traveling, greeting, refresh, refreshJourney, loadGreeting],
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
