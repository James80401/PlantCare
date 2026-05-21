import { useCallback, useEffect, useState } from 'react';
import { buddyApi } from '../../services/api';
import type { BuddyState } from './types';

export function useBuddy() {
  const [buddy, setBuddy] = useState<BuddyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const { data } = await buddyApi.get();
      setBuddy(data);
      setMissing(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setBuddy(null);
        setMissing(true);
      } else {
        setError('Could not load your plant buddy.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { buddy, loading, missing, error, refresh, setBuddy };
}
