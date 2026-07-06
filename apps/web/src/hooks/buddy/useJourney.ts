import { useCallback, useEffect, useState } from 'react';
import { buddyApi } from '../../services/api';
import type { JourneyResponse, JourneyState } from './types';
import { formatApiErrorMessage } from '../../utils/apiError';
import { useInterval } from '../useInterval';

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
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load journey status.'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const journey = data?.journey;
  useInterval(refresh, 30_000, enabled && Boolean(journey && !journey.completed));

  return { data, journey: data?.journey ?? null, loading, error, refresh, setData };
}

export function isJourneyTraveling(journey: JourneyState | null): boolean {
  return Boolean(journey && !journey.completed);
}
