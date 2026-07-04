import { useCallback, useEffect, useState } from 'react';
import { gardensApi, type GardenDetail } from '../services/api';
import { formatApiErrorMessage } from '../utils/apiError';

const SYNC_INTERVAL_MS = 20_000;

/** Shared loader for the Garden Dashboard and its subsection pages. Polls in
 *  the background so a caregiver's changes (completed tasks, new plants)
 *  show up here without a manual reload — mirrors the interval pattern
 *  already used for Buddy's garden metrics refresh. */
export function useGardenDetail(gardenId: string | undefined) {
  const [garden, setGarden] = useState<GardenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!gardenId) return;
      if (!options?.silent) {
        setLoading(true);
        setError('');
      }
      try {
        const { data } = await gardensApi.detail(gardenId);
        setGarden(data);
        if (!options?.silent) setError('');
      } catch (err) {
        // A silent background poll that fails shouldn't blank out a
        // working view — just skip this tick and retry on the next one.
        if (!options?.silent) {
          setError(formatApiErrorMessage(err, 'Could not load this garden.'));
        }
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [gardenId],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!gardenId) return;
    const id = window.setInterval(() => reload({ silent: true }), SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [gardenId, reload]);

  return { garden, loading, error, reload };
}
