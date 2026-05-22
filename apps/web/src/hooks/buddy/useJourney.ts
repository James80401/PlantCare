import { useCallback, useEffect, useRef, useState } from 'react';
import { buddyApi } from '../../services/api';
import { trackEvent } from '../../utils/analytics';
import type { JourneyResponse, JourneyState } from './types';

export function useJourney(enabled: boolean) {
  const [data, setData] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setError('');
    try {
      const res = await buddyApi.getJourney();
      setData(res.data);
    } catch {
      setError('Could not load journey status.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const journey = data?.journey;
    if (!journey || journey.completed) return;
    const id = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(id);
  }, [enabled, data?.journey, refresh]);

  useEffect(() => {
    const journey = data?.journey;
    if (!journey?.completed || !journey.id) return;
    if (trackedCompleteId.current === journey.id) return;
    trackedCompleteId.current = journey.id;
    trackEvent('BuddyJourneyCompleted', { biomeId: journey.biomeId });
  }, [data?.journey]);

  return { data, journey: data?.journey ?? null, loading, error, refresh, setData };
}

export function isJourneyTraveling(journey: JourneyState | null): boolean {
  return Boolean(journey && !journey.completed);
}
