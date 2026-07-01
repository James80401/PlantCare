import { useCallback, useEffect, useState } from 'react';
import { gardensApi, type GardenDetail } from '../services/api';
import { formatApiErrorMessage } from '../utils/apiError';

/** Shared loader for the Garden Dashboard and its subsection pages. */
export function useGardenDetail(gardenId: string | undefined) {
  const [garden, setGarden] = useState<GardenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!gardenId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await gardensApi.detail(gardenId);
      setGarden(data);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load this garden.'));
    } finally {
      setLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { garden, loading, error, reload };
}
